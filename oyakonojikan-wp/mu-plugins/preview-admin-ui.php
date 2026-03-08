<?php

/**
 * Plugin Name: Preview Admin UI
 */

add_action('add_meta_boxes', function () {
	add_meta_box(
		'preview_link_box',
		'プレビューURL',
		'render_preview_link_box',
		['post', 'page'],   // 必要な投稿タイプを指定
		'side',
		'high'
	);
});

function render_preview_link_box($post)
{

	// preview-endpoint.php で定義済みならそれを使う
	if (defined('PREVIEW_FRONTEND_URL')) {
		$base_url = PREVIEW_FRONTEND_URL;
	} else {
		// 念のためのフォールバック（ステージング）
		$base_url = 'https://stg.oyakonojikanlabo.jp/preview';
	}

	// 旧: id / nonce / ts はすべて不要なので削除
	$preview_url = add_query_arg(
		[
			'p' => $post->ID,
		],
		$base_url
	);

	echo '<p><a href="' . esc_url($preview_url) . '" target="_blank" class="button button-primary">プレビューを開く</a></p>';
	echo '<p style="font-size:12px;">社内共有用にこのURLをコピーできます</p>';
}

/**
 * 投稿一覧画面の「プレビュー」リンクに target="_blank" を付ける
 */
add_filter('post_row_actions', 'add_target_blank_to_preview_link', 20, 2);
function add_target_blank_to_preview_link($actions, $post)
{

	// プレビューリンクが存在する場合のみ処理
	if (isset($actions['view'])) {

		// URL を React 側プレビューURLに変換（preview_post_link が既に差し替えを担当）
		$preview_url = get_preview_post_link($post);

		// target="_blank" を追加した新しいリンク HTML を生成
		$actions['view'] = sprintf(
			'<a href="%s" target="_blank">プレビュー</a>',
			esc_url($preview_url)
		);
	}

	return $actions;
}
