<?php

/**
 * Plugin Name: Force English Slugs
 * Description: artist / space CPT のスラッグを半角英数字に強制する
 */

if (!defined('ABSPATH')) exit;

add_action('save_post', function ($post_id) {
	if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) return;

	$post = get_post($post_id);
	if (!$post || !in_array($post->post_type, ['event', 'artist', 'space'], true)) return;

	// タイトルを元にASCIIスラッグ生成（例）
	$slug = strtolower($post->post_title);
	$slug = preg_replace('/[^a-z0-9\-]+/', '-', $slug);
	$slug = preg_replace('/-+/', '-', $slug);
	$slug = trim($slug, '-');

	// ユニーク化
	$slug = wp_unique_post_slug($slug, $post_id, $post->post_status, $post->post_type, $post->post_parent);

	if ($slug && $slug !== $post->post_name) {
		wp_update_post([
			'ID'        => $post_id,
			'post_name' => $slug
		]);
	}
}, 20);
