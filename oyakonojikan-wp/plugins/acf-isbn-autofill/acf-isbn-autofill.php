<?php

/**
 * Plugin Name: ACF ISBN Autofill for Artist
 * Description: ACF repeater(related_books) の ISBN をトリガーに、書名/出版社/発売日/表紙画像を自動補完します（投稿タイプ artist）。
 * Version: 0.1.0
 * Author: your-name
 */

if (!defined('ABSPATH')) exit;

/**
 * related_books リピーターに release_date_text（精度保持用）を動的追加
 * - 既存の date_picker(release_date) では YYYY / YYYY-MM が 1日に補完されるため、
 *   表示用途は text フィールドで保持する。
 */
add_filter('acf/load_field/name=related_books', function ($field) {
	if (!is_array($field)) return $field;

	$sub_fields = $field['sub_fields'] ?? null;
	if (!is_array($sub_fields) || empty($sub_fields)) return $field;

	$sub_names = array_map(
		static function ($sub) {
			return is_array($sub) ? ($sub['name'] ?? '') : '';
		},
		$sub_fields
	);

	// 対象の related_books かを緩く判定
	if (!in_array('isbn', $sub_names, true) || !in_array('release_date', $sub_names, true)) {
		return $field;
	}

	if (in_array('release_date_text', $sub_names, true)) {
		return $field;
	}

	$field['sub_fields'][] = [
		'key' => 'field_ai_isbn_release_date_text',
		'label' => '発売日（精度保持）',
		'name' => 'release_date_text',
		'type' => 'text',
		'instructions' => 'ISBN 自動補完用。YYYY / YYYY-MM / YYYY-MM-DD で保持されます。',
		'required' => 0,
		'default_value' => '',
		'maxlength' => 10,
		'placeholder' => 'YYYY-MM-DD',
		'prepend' => '',
		'append' => '',
		'wrapper' => [
			'width' => '',
			'class' => '',
			'id' => '',
		],
		'show_in_graphql' => 1,
		'graphql_field_name' => 'releaseDateText',
	];

	return $field;
}, 20);

add_action('acf/save_post', function ($post_id) {
	// 管理画面での保存時のみ（RESTやプログラム更新も拾いたい場合は条件を緩めてOK）
	if (is_numeric($post_id) === false) return;

	// 投稿タイプフィルタ
	$post = get_post($post_id);
	if (!$post || $post->post_type !== 'artist') return;

	// ACF フィールド構成（名前は事前のJSONと合わせています）
	$repeater_field = 'related_books'; // リピーター
	$f_isbn         = 'isbn';
	$f_title        = 'title';
	$f_publisher    = 'publisher';
	$f_release      = 'release_date'; // date_picker (Y-m-d) ※日付確定時のみ
	$f_release_text = 'release_date_text'; // text (YYYY / YYYY-MM / YYYY-MM-DD)
	$f_cover        = 'cover_image';  // image（添付ID）

	// リピーターの現在値を取得
	$rows = get_field($repeater_field, $post_id);
	if (empty($rows) || !is_array($rows)) return;

	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$updated = false;

	foreach ($rows as $i => &$row) {
		$isbn = preg_replace('/[^0-9Xx]/', '', (string)($row[$f_isbn] ?? ''));
		if (empty($isbn)) continue;

		// 既入力を尊重：未入力の項目のみ補完
		$need_title     = empty($row[$f_title]);
		$need_publisher = empty($row[$f_publisher]);
		$need_release   = empty($row[$f_release]);
		$need_release_text = empty($row[$f_release_text]);
		$need_cover     = empty($row[$f_cover]);

		if (!$need_title && !$need_publisher && !$need_release && !$need_release_text && !$need_cover) {
			continue;
		}

		// キャッシュ（12時間）
		$cache_key = 'isbn_autofill_' . strtolower($isbn);
		$cached = get_transient($cache_key);

		if ($cached === false) {
			$meta = fetch_book_meta_via_openbd($isbn);
			if (!$meta) {
				$meta = fetch_book_meta_via_googlebooks($isbn);
			}
			// 正規化
			if ($meta) {
				$meta = normalize_book_meta($meta, $isbn);
				set_transient($cache_key, $meta, 12 * HOUR_IN_SECONDS);
			}
		} else {
			$meta = $cached;
		}

		if (!$meta) continue; // 取得失敗

		// 書名
		if ($need_title && !empty($meta['title'])) {
			$row[$f_title] = $meta['title'];
			$updated = true;
		}
		// 出版社
		if ($need_publisher && !empty($meta['publisher'])) {
			$row[$f_publisher] = $meta['publisher'];
			$updated = true;
		}
		// 発売日（表示用テキスト。精度を保持）
		if ($need_release_text && !empty($meta['release_text'])) {
			$row[$f_release_text] = $meta['release_text'];
			$updated = true;
		}
		// 発売日（date_picker。日まで確定している場合のみ）
		if ($need_release && !empty($meta['release_date'])) {
			$row[$f_release] = $meta['release_date'];
			$updated = true;
		}
		// カバー画像（URL→メディア登録→添付ID）
		if ($need_cover && !empty($meta['cover_url'])) {
			// 同一URLの重複登録防止（簡易）：添付を検索する or 既に同一ISBN用があれば再利用
			$attachment_id = maybe_find_existing_attachment_by_url($meta['cover_url']);
			if (!$attachment_id) {
				// ダウンロード→添付
				$attachment_id = media_sideload_image_to_id($meta['cover_url'], $post_id, $meta['title'] ?? ('Cover ' . $isbn));
			}
			if (is_numeric($attachment_id)) {
				$row[$f_cover] = (int)$attachment_id;
				$updated = true;
			}
		}

		// 反映
		$rows[$i] = $row;
	}

	if ($updated) {
		update_field($repeater_field, $rows, $post_id);
	}
}, 20);

/**
 * openBD から書誌情報を取得
 * @see https://openbd.jp/
 */
function fetch_book_meta_via_openbd(string $isbn): ?array
{
	$url = 'https://api.openbd.jp/v1/get?isbn=' . rawurlencode($isbn);
	$resp = wp_remote_get($url, ['timeout' => 8]);
	if (is_wp_error($resp)) return null;
	$code = wp_remote_retrieve_response_code($resp);
	if ($code !== 200) return null;
	$json = json_decode(wp_remote_retrieve_body($resp), true);
	if (!is_array($json) || empty($json[0])) return null;

	$item = $json[0];
	if (empty($item['summary'])) return null;

	$sum = $item['summary'];
	return [
		'title'       => $sum['title'] ?? '',
		'publisher'   => $sum['publisher'] ?? '',
		// openBDの pubdate は "YYYYMM" or "YYYYMMDD" のことが多い
		'pubdate_raw' => $sum['pubdate'] ?? '',
		// cover が入っていない場合もあるため後でフォールバックを作る
		'cover'       => $sum['cover'] ?? '',
		// フォールバックの定番：cover.openbd.jp/{ISBN}.jpg
		'cover_fallback' => 'https://cover.openbd.jp/' . preg_replace('/[^0-9Xx]/', '', $sum['isbn'] ?? '') . '.jpg',
	];
}

/**
 * Google Books API フォールバック
 */
function fetch_book_meta_via_googlebooks(string $isbn): ?array
{
	$url = add_query_arg([
		'q' => 'isbn:' . $isbn,
		'maxResults' => 1,
		'printType'  => 'books',
	], 'https://www.googleapis.com/books/v1/volumes');

	$resp = wp_remote_get($url, ['timeout' => 8]);
	if (is_wp_error($resp)) return null;
	$code = wp_remote_retrieve_response_code($resp);
	if ($code !== 200) return null;
	$json = json_decode(wp_remote_retrieve_body($resp), true);
	if (empty($json['items'][0]['volumeInfo'])) return null;

	$v = $json['items'][0]['volumeInfo'];
	return [
		'title'     => $v['title'] ?? '',
		'publisher' => $v['publisher'] ?? '',
		'pubdate_raw' => $v['publishedDate'] ?? '', // "YYYY" or "YYYY-MM" or "YYYY-MM-DD"
		'cover'     => $v['imageLinks']['thumbnail'] ?? ($v['imageLinks']['smallThumbnail'] ?? ''),
	];
}

/**
 * メタを正規化（発売日精度保持 + 日付確定値、カバーURL 決定）
 */
function normalize_book_meta(array $meta, string $isbn): array
{
	// 発売日
	$date = '';      // YYYY-MM-DD（確定時のみ）
	$date_text = ''; // YYYY / YYYY-MM / YYYY-MM-DD
	if (!empty($meta['pubdate_raw'])) {
		$raw = trim(str_replace('/', '-', (string)$meta['pubdate_raw']));
		// 形式のバリエーションに対応
		if (preg_match('/^\d{8}$/', $raw)) {
			// YYYYMMDD → YYYY-MM-DD
			$date = substr($raw, 0, 4) . '-' . substr($raw, 4, 2) . '-' . substr($raw, 6, 2);
			$date_text = $date;
		} elseif (preg_match('/^\d{6}$/', $raw)) {
			// YYYYMM → YYYY-MM（日を補完しない）
			$date_text = substr($raw, 0, 4) . '-' . substr($raw, 4, 2);
		} elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
			$date = $raw;
			$date_text = $raw;
		} elseif (preg_match('/^\d{4}-\d{2}$/', $raw)) {
			// YYYY-MM（日を補完しない）
			$date_text = $raw;
		} elseif (preg_match('/^\d{4}$/', $raw)) {
			// YYYY（日・月を補完しない）
			$date_text = $raw;
		} elseif (preg_match('/^(\d{4})-(\d{2})-(\d{2})T/', $raw, $matches)) {
			// ISO 8601
			$date = "{$matches[1]}-{$matches[2]}-{$matches[3]}";
			$date_text = $date;
		}
	}

	// カバーURL
	$cover = $meta['cover'] ?? '';
	if (empty($cover) && !empty($meta['cover_fallback'])) {
		$cover = $meta['cover_fallback'];
	}
	// Google Books のサムネイルは http:// → https:// に置換
	if ($cover && strpos($cover, 'http://') === 0) {
		$cover = 'https://' . substr($cover, 7);
	}
	// openBD の典型拡張子 .jpg を ISBN ベースで生成する最後の保険
	if (empty($cover) && preg_match('/^\d{9,13}[0-9Xx]$/', $isbn)) {
		$cover = 'https://cover.openbd.jp/' . $isbn . '.jpg';
	}

	return [
		'title'        => trim((string)($meta['title'] ?? '')),
		'publisher'    => trim((string)($meta['publisher'] ?? '')),
		'release_date' => $date ?: '',
		'release_text' => $date_text ?: '',
		'cover_url'    => $cover ?: '',
	];
}

/**
 * 既存の同一URL画像を使い回す（簡易版）
 */
function maybe_find_existing_attachment_by_url(string $url)
{
	global $wpdb;
	$guid = esc_url_raw($url);
	$id = $wpdb->get_var($wpdb->prepare(
		"SELECT ID FROM $wpdb->posts WHERE post_type='attachment' AND guid=%s LIMIT 1",
		$guid
	));
	return $id ? intval($id) : 0;
}

/**
 * URLの画像をメディアへ取り込み、添付IDを返す
 */
function media_sideload_image_to_id(string $url, $post_id = 0, string $desc = '')
{
	// media_sideload_image は HTML を返すため、添付ID取得のためのラッパー
	$tmp = download_url($url, 10);
	if (is_wp_error($tmp)) return 0;

	$file_array = [
		'name'     => wp_basename(parse_url($url, PHP_URL_PATH) ?: 'cover.jpg'),
		'tmp_name' => $tmp,
	];
	// 一般的な拡張子がない場合はjpgを仮定
	if (!preg_match('/\.(jpe?g|png|webp|gif)$/i', $file_array['name'])) {
		$file_array['name'] .= '.jpg';
	}

	$id = media_handle_sideload($file_array, $post_id, $desc);
	if (is_wp_error($id)) {
		@unlink($file_array['tmp_name']);
		return 0;
	}
	return (int)$id;
}
