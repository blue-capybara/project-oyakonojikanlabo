<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_is_over_balloon( $balloon ){

	$over_balloon = array('upper','talk_o','think','think_2','talk_oc','freehand_o','slash_oc');

	return in_array($balloon, $over_balloon, true);

}

function word_balloon_is_under_balloon( $balloon ){

	$under_balloon = array('lower','talk_u','talk_uc','freehand_u','slash_uc');

	return in_array($balloon, $under_balloon, true);

}

function word_balloon_is_over_under_balloon( $balloon ){

	$over_balloon = word_balloon_is_over_balloon( $balloon );
	$under_balloon = word_balloon_is_under_balloon( $balloon );

	if($over_balloon || $under_balloon) return true;

	return false;

}

function word_balloon_is_svg_balloon( $balloon ){

	return in_array($balloon, array('heart','wriggle','freehand','scream','think_2','freehand_o','freehand_u','slash','slash_oc','slash_uc'), true);

}

function word_balloon_get_material( $url ){

	require_once ABSPATH.'wp-admin/includes/file.php';

	if(WP_Filesystem()){
		global $wp_filesystem;
		return $wp_filesystem->get_contents($url);
	}

	
	if(WP_Filesystem( request_filesystem_credentials('', '', false, false, null) ) ){
		global $wp_filesystem;
		return $wp_filesystem->get_contents($url);
	}

	return '<!-- ('.esc_html__( 'Cannot read','word-balloon' ).') -->';

}
