<?php

/**
 * Plugin Name: Feature Post Type
 * Description: 「特集」カスタム投稿タイプを登録します。
 */

if (!defined('ABSPATH')) {
	exit;
}

add_action('init', function () {
	$labels = [
		'name'                  => '特集',
		'singular_name'         => '特集',
		'add_new'               => '新規追加',
		'add_new_item'          => '特集を追加',
		'edit_item'             => '特集を編集',
		'new_item'              => '新規特集',
		'view_item'             => '特集を表示',
		'search_items'          => '特集を検索',
		'not_found'             => '特集が見つかりませんでした',
		'not_found_in_trash'    => 'ゴミ箱に特集はありません',
		'all_items'             => '特集一覧',
		'archives'              => '特集アーカイブ',
		'menu_name'             => '特集',
	];

	register_post_type('feature', [
		'labels'             => $labels,
		'public'             => true,
		'show_in_rest'       => true,
		'has_archive'        => true,
		'rewrite'            => [
			'slug'       => 'feature',
			'with_front' => false,
		],
		'supports'           => [
			'title',
			'editor',
			'excerpt',
			'thumbnail',
			'revisions',
			'custom-fields',
		],
		'menu_position'      => 21,
		'menu_icon'          => 'dashicons-star-filled',
		'publicly_queryable' => true,
		'show_in_nav_menus'  => true,
		'show_ui'            => true,
		'capability_type'    => 'post',
	]);
}, 5);
