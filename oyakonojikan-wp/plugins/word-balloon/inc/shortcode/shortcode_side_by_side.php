<?php
defined( 'ABSPATH' ) || exit;



function word_balloon_shortcode_side_by_side( $atts, $content = null ) {

	$atts = shortcode_atts(
		array(
			'position' => 'space-between',
			'wrap' => 'true',
		), $atts, 'word_balloon_side_by_side' );

	$content = do_shortcode( shortcode_unautop( $content ) );
	
	
	
	
	//$content = str_replace( '</p>'."\n".'<p>','',$content);

	$justify = ' w_b_jc_sb';
	$wrap_style = '';

	if( $atts['wrap'] === 'true' ) $wrap_style = ' style="flex-wrap:wrap;"';

	if( $atts['wrap'] === 'reverse' ) $wrap_style = ' style="flex-wrap:wrap-reverse;"';

	if( $atts['position'] === 'center' ) $justify = ' w_b_jc_c';

	if( $atts['position'] === 'flex-end' ) $justify = ' w_b_jc_fe';

	if( $atts['position'] === 'flex-start' ) $justify = '';

	
	if (strpos($content,'class="w_b_block_side_by_side"') !== false){
		$content = str_replace('<div class="w_b_block_side_by_side">', '', $content);
		$content = rtrim($content, '</div>');
	}

	return '<div class="w_b_line_up w_b_box w_b_flex w_b_ai_c'.$justify.'"'.$wrap_style.'>' . $content . '</div>';
}
