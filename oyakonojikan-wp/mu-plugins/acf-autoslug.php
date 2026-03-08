<?php

/**
 * Force ASCII slug by ACF 'slug_en' (fallback to title/kana/ID)
 * Targets: artist, space, event
 */
if (!defined('ABSPATH')) exit;

add_action('acf/save_post', 'my_apply_slug_en_after_acf', 20);
function my_apply_slug_en_after_acf($post_id)
{
	if (!is_numeric($post_id)) return; // ACFは"options"等でも呼ばれる
	my_adjust_slug_en((int)$post_id);
}

add_action('save_post', function ($post_id) {
	// ACFが動かなかった経路（RESTやクイック編集等）の保険
	if (!did_action('acf/save_post')) {
		my_adjust_slug_en((int)$post_id);
	}
}, 99);

function my_adjust_slug_en(int $post_id)
{
	if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) return;

	$post = get_post($post_id);
	if (!$post || !in_array($post->post_type, ['artist', 'space', 'event'], true)) return;
	if (in_array($post->post_status, ['auto-draft', 'inherit'], true)) return;

	static $running = false;
	if ($running) return;
	$running = true;

	// 1) ACF slug_en を最優先
	$slug = '';
	if (function_exists('get_field')) {
		$val = (string)get_field('slug_en', $post_id);
		if ($val !== '') $slug = my_sanitize_ascii_slug($val);
	}

	// 2)（任意）読みかな→ローマ字（reading_kana があれば）
	if ($slug === '' && function_exists('get_field')) {
		$kana = (string)get_field('reading_kana', $post_id);
		if ($kana !== '') $slug = my_sanitize_ascii_slug(my_kana_to_romaji($kana));
	}

	// 3) タイトルからASCII抽出
	if ($slug === '') $slug = my_sanitize_ascii_slug($post->post_title);

	// 4) それでも空ならフォールバック
	if ($slug === '') $slug = $post->post_type . '-' . $post_id;

	if ($slug !== $post->post_name) {
		$unique = wp_unique_post_slug($slug, $post_id, $post->post_status, $post->post_type, $post->post_parent);
		wp_update_post(['ID' => $post_id, 'post_name' => $unique]);
		// 開発中の確認用ログ（必要ならON）: error_log("slug updated #$post_id => $unique");
	}

	$running = false;
}

function my_sanitize_ascii_slug($s)
{
	$s = strtolower((string)$s);
	$s = preg_replace('/[^a-z0-9\-]+/', '-', $s);
	$s = preg_replace('/-+/', '-', $s);
	return trim(substr($s, 0, 60), '-');
}

// かな→ローマ字（簡易）。未使用なら削除OK。
function my_kana_to_romaji($s)
{
	if (function_exists('mb_convert_kana')) $s = mb_convert_kana($s, 'CKV', 'UTF-8');
	$s = preg_replace('/\s+/u', '', $s);
	$dig = ['キャ' => 'kya', 'キュ' => 'kyu', 'キョ' => 'kyo', 'シャ' => 'sha', 'シュ' => 'shu', 'ショ' => 'sho', 'チャ' => 'cha', 'チュ' => 'chu', 'チョ' => 'cho', 'ニャ' => 'nya', 'ニュ' => 'nyu', 'ニョ' => 'nyo', 'ヒャ' => 'hya', 'ヒュ' => 'hyu', 'ヒョ' => 'hyo', 'ミャ' => 'mya', 'ミュ' => 'myu', 'ミョ' => 'myo', 'リャ' => 'rya', 'リュ' => 'ryu', 'リョ' => 'ryo', 'ギャ' => 'gya', 'ギュ' => 'gyu', 'ギョ' => 'gyo', 'ジャ' => 'ja', 'ジュ' => 'ju', 'ジョ' => 'jo', 'ビャ' => 'bya', 'ビュ' => 'byu', 'ビョ' => 'byo', 'ピャ' => 'pya', 'ピュ' => 'pyu', 'ピョ' => 'pyo'];
	$base = ['ア' => 'a', 'イ' => 'i', 'ウ' => 'u', 'エ' => 'e', 'オ' => 'o', 'カ' => 'ka', 'キ' => 'ki', 'ク' => 'ku', 'ケ' => 'ke', 'コ' => 'ko', 'サ' => 'sa', 'シ' => 'shi', 'ス' => 'su', 'セ' => 'se', 'ソ' => 'so', 'タ' => 'ta', 'チ' => 'chi', 'ツ' => 'tsu', 'テ' => 'te', 'ト' => 'to', 'ナ' => 'na', 'ニ' => 'ni', 'ヌ' => 'nu', 'ネ' => 'ne', 'ノ' => 'no', 'ハ' => 'ha', 'ヒ' => 'hi', 'フ' => 'fu', 'ヘ' => 'he', 'ホ' => 'ho', 'マ' => 'ma', 'ミ' => 'mi', 'ム' => 'mu', 'メ' => 'me', 'モ' => 'mo', 'ヤ' => 'ya', 'ユ' => 'yu', 'ヨ' => 'yo', 'ラ' => 'ra', 'リ' => 'ri', 'ル' => 'ru', 'レ' => 're', 'ロ' => 'ro', 'ワ' => 'wa', 'ヲ' => 'o', 'ン' => 'n', 'ガ' => 'ga', 'ギ' => 'gi', 'グ' => 'gu', 'ゲ' => 'ge', 'ゴ' => 'go', 'ザ' => 'za', 'ジ' => 'ji', 'ズ' => 'zu', 'ゼ' => 'ze', 'ゾ' => 'zo', 'ダ' => 'da', 'ヂ' => 'ji', 'ヅ' => 'zu', 'デ' => 'de', 'ド' => 'do', 'バ' => 'ba', 'ビ' => 'bi', 'ブ' => 'bu', 'ベ' => 'be', 'ボ' => 'bo', 'パ' => 'pa', 'ピ' => 'pi', 'プ' => 'pu', 'ペ' => 'pe', 'ポ' => 'po', 'ァ' => 'a', 'ィ' => 'i', 'ゥ' => 'u', 'ェ' => 'e', 'ォ' => 'o', 'ャ' => 'ya', 'ュ' => 'yu', 'ョ' => 'yo'];
	$out = '';
	$len = mb_strlen($s, 'UTF-8');
	for ($i = 0; $i < $len; $i++) {
		$ch = mb_substr($s, $i, 1, 'UTF-8');
		if ($ch === 'ッ' && $i + 1 < $len) {
			$next2 = ($i + 2 < $len) ? mb_substr($s, $i + 1, 2, 'UTF-8') : '';
			$next1 = mb_substr($s, $i + 1, 1, 'UTF-8');
			$syll = $dig[$next2] ?? ($base[$next1] ?? '');
			$out .= $syll ? substr($syll, 0, 1) : '';
			continue;
		}
		if ($i + 1 < $len) {
			$two = mb_substr($s, $i, 2, 'UTF-8');
			if (isset($dig[$two])) {
				$out .= $dig[$two];
				$i++;
				continue;
			}
		}
		if ($ch === 'ー') {
			if ($out !== '') {
				$v = substr($out, -1);
				if (in_array($v, ['a', 'i', 'u', 'e', 'o'])) $out .= $v;
			}
			continue;
		}
		if (isset($base[$ch])) $out .= $base[$ch];
	}
	return strtolower($out);
}
