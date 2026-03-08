<?php

/**
 * Yoast SEOメタフィールドをREST APIで更新可能にする
 * LIVEUPアプリからのSEO更新に必要
 */

add_action('init', function () {

	// Yoast SEO が有効なときのみ実行
	if (! defined('WPSEO_VERSION')) {
		return;
	}

	// フォーカスキーワード
	register_meta('post', '_yoast_wpseo_focuskw', [
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'auth_callback' => function () {
			return current_user_can('edit_posts');
		}
	]);

	// メタディスクリプション
	register_meta('post', '_yoast_wpseo_metadesc', [
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'auth_callback' => function () {
			return current_user_can('edit_posts');
		}
	]);

	// SEOタイトル（必要に応じて）
	register_meta('post', '_yoast_wpseo_title', [
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'auth_callback' => function () {
			return current_user_can('edit_posts');
		}
	]);
});
