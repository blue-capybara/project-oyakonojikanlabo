<?php

/**
 * Plugin Name: Find Post by Slug (Admin Search Helper)
 * Description: 管理画面検索でスラッグ(post_name)も検索対象に含める
 */

add_filter('posts_search', function ($search, $wp_query) {
	global $wpdb;

	if (
		!is_admin() ||
		!$wp_query->is_main_query() ||
		empty($wp_query->query_vars['s'])
	) {
		return $search;
	}

	$s = esc_sql($wp_query->query_vars['s']);

	return " AND (
        {$wpdb->posts}.post_title LIKE '%{$s}%'
        OR {$wpdb->posts}.post_name LIKE '%{$s}%'
    )";
}, 10, 2);
