<?php
/**
 * Template Name: 記事プレビュー
 */

global $wp_query, $post;

$user         = wp_get_current_user();
$runtime_caps = array();

// プレビュー表示に必要な権限
$require_caps = array( 'edit_post', 'edit_posts' );

// 現在のユーザーが必要な権限を持っているかを確認
foreach ( $require_caps as $require_cap ) {
	if ( ! user_can( $user->ID, $require_cap, $post->ID ) ) {
		$runtime_caps[] = $require_cap;
	}
}

// 持っていない権限を一時的に割り当て
if ( $runtime_caps ) {
	foreach ( $runtime_caps as $runtime_cap ) {
		$user->add_cap( $runtime_cap );
	}
}

$post_id  = filter_input( INPUT_GET, 'id' );
$wp_query = new WP_Query( array( 'p' => $post_id, 'post_status' => 'any' ) );

// 一時権限を削除
if ( $runtime_caps ) {
	foreach ( $runtime_caps as $runtime_cap ) {
		$user->remove_cap( $runtime_cap );
	}
}

if ( ! $wp_query->have_posts() || $wp_query->post->post_author != $user->ID ) {
	exit( 'Error.' );
}

$wp_query->post->post_title .= '（プレビュー）';

include locate_template( 'single.php' );