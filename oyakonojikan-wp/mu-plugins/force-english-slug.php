<?php

/**
 * Auto-generate ASCII slug for artist/space if current slug is empty or non-ASCII.
 * ACF 'slug_en' があれば最優先で採用。
 */
if (!defined('ABSPATH')) exit;

add_filter('wp_insert_post_data', function ($data, $postarr) {
	if (empty($postarr['ID'])) return $data;
	if (!in_array($data['post_type'] ?? '', ['artist', 'space'], true)) return $data;

	$post_id = (int)$postarr['ID'];
	$current = $data['post_name'] ?? '';
	$needs_ascii = ($current === '' || preg_match('/[^a-z0-9\-]/', $current));

	// ACFの slug_en があれば最優先
	$slug_en = function_exists('get_field') ? (string)get_field('slug_en', $post_id) : '';

	if ($slug_en !== '') {
		$slug = strtolower($slug_en);
		$slug = preg_replace('/[^a-z0-9\-]+/', '-', $slug);
		$slug = preg_replace('/-+/', '-', $slug);
		$slug = trim($slug, '-');
	} elseif ($needs_ascii) {
		// タイトルから簡易ASCIIスラッグ生成
		$title = $data['post_title'] ?? '';
		$slug  = ascii_slug_from($title);

		// 末尾に post_type + ID を付けて安定性を高める
		$slug = trim($slug, '-');
		if ($slug !== '') {
			$slug = substr($slug, 0, 40); // 長すぎ防止
			$slug .= '-' . $data['post_type'] . '-' . $post_id;
		} else {
			$slug = $data['post_type'] . '-' . $post_id;
		}
	} else {
		return $data; // ASCIIで問題なければ何もしない
	}

	if ($slug !== '') {
		$data['post_name'] = $slug; // wp_insert_post() 内で最終的にユニーク化されます
	}
	return $data;
}, 20, 2);

// 簡易ASCIIスラッグ生成（日本語は除去→全角→半角→英数字以外ハイフン）
function ascii_slug_from($s)
{
	$s = (string)$s;
	// 全角英数記号 → 半角
	if (function_exists('mb_convert_kana')) {
		$s = mb_convert_kana($s, 'asKV', 'UTF-8');
	}
	// ひらがな→カタカナ（任意）
	if (function_exists('mb_convert_kana')) {
		$s = mb_convert_kana($s, 'C', 'UTF-8');
	}
	// 記号・空白 → ハイフン、英数字以外は除去に近い置換
	$s = strtolower($s);
	$s = preg_replace('/[^a-z0-9]+/u', '-', $s);
	$s = preg_replace('/-+/', '-', $s);
	return $s;
}
