<?php

/**
 * Plugin Name: Headless Preview Endpoint
 * Description: Secure preview endpoint for headless React frontend.
 * Version: 2.1
 */

if (!defined('ABSPATH')) exit;

/**
 * ----------------------------------------------------
 * 1) プレビュー専用ロール "previewer" を追加
 * ----------------------------------------------------
 */
add_action('init', function () {
	if (!get_role('previewer')) {
		add_role(
			'previewer',
			'Previewer',
			[
				'read' => true, // プレビューに必要な最小権限
			]
		);
	}
});

/**
 * ----------------------------------------------------
 * 2) previewer ロールは Application Password を利用可能にする
 * ----------------------------------------------------
 */
add_filter('wp_is_application_passwords_available_for_user', function ($available, $user) {
	if (in_array('previewer', (array)$user->roles, true)) {
		return true;
	}
	return $available;
}, 10, 2);


/**
 * ----------------------------------------------------
 * 3) PREVIEW API 定義
 * ----------------------------------------------------
 */
define('PREVIEW_FRONTEND_URL', 'https://stg.oyakonojikanlabo.jp/preview');

add_action('rest_api_init', function () {
	register_rest_route('preview/v1', '/post/(?P<id>\d+)', [
		'methods'  => 'GET',
		'callback' => 'preview_api_handler',

		// ★ Application Password / Cookie 認証が成功していれば通る
		'permission_callback' => function () {
			return current_user_can('read');
		},
	]);
});


/**
 * API 本体（投稿データを返す）
 */
function preview_api_handler(WP_REST_Request $req)
{

	$post_id = intval($req['id']);
	$post    = get_post($post_id);

	$media_id  = get_post_thumbnail_id($post_id);
	$media_url = $media_id ? wp_get_attachment_image_url($media_id, 'full') : null;

	if (!$post) {
		return new WP_REST_Response(['error' => 'not found'], 404);
	}

	return [
		'id'      => $post->ID,
		'title'   => apply_filters('the_title', $post->post_title),
		'content' => apply_filters('the_content', $post->post_content),
		'excerpt' => apply_filters('the_excerpt', $post->post_excerpt),
		'slug'    => $post->post_name,
		'status'  => $post->post_status,
		'modified' => $post->post_modified_gmt,
		'featured_image_url' => $media_url,
	];
}


/**
 * ----------------------------------------------------
 * 4) WP 管理画面の「プレビュー」ボタンを書き換える
 * ----------------------------------------------------
 */
add_filter('preview_post_link', function ($link, $post) {
	return PREVIEW_FRONTEND_URL . '?p=' . $post->ID;
}, 10, 2);
