<?php
defined( 'ABSPATH' ) || exit;


function word_balloon_do_shortcode( $atts , $content = null ){

	require_once WORD_BALLOON_DIR . 'inc/shortcode/shortcode_build_box.php';
	return word_balloon_build_word_balloon_box( $atts , $content );

}


add_shortcode('word_balloon', 'word_balloon_do_shortcode');


function word_balloon_shortcode_do_wallpaper( $atts , $content = null ){

	require_once WORD_BALLOON_DIR . 'inc/shortcode/shortcode_wallpaper.php';
	return word_balloon_shortcode_wallpaper( $atts, $content );
}
add_shortcode('word_balloon_wallpaper', 'word_balloon_shortcode_do_wallpaper');


function word_balloon_shortcode_do_side_by_side( $atts , $content = null ){

	require_once WORD_BALLOON_DIR . 'inc/shortcode/shortcode_side_by_side.php';
	return word_balloon_shortcode_side_by_side( $atts, $content );
}
add_shortcode('word_balloon_side_by_side', 'word_balloon_shortcode_do_side_by_side');


function word_balloon_linebreak_fix($content) {
	$array = array (
		'<br />'."\n".'[word_balloon' => '[word_balloon',
		'<br>'."\n".'[word_balloon' => '[word_balloon',
		'<br />'."\n".'[/word_balloon' => '[/word_balloon',
		'<br>'."\n".'[/word_balloon' => '[/word_balloon',
	);

	$content = strtr($content, $array);
	return $content;
}
add_filter('the_content', 'word_balloon_linebreak_fix');

