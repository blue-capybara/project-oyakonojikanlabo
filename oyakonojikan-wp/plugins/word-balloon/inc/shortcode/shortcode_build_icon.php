<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_build_avatar_icon( $atts , $load_setting ){

	$svg_file = word_balloon_get_material(WORD_BALLOON_DIR .'icon/'.$atts['icon_type'].'.svg');

	if ( !$svg_file ) return;

	$w_b_class['w_b_icon_filter'] = $w_b_class['w_b_icon'] = $w_b_class['w_b_icon_effect'] = '';
	$w_b_style['w_b_icon'] = $w_b_style['w_b_icon_effect'] = '';

	$icon_size = $load_setting['icon_custom_size'][$atts['icon_size']];

	
	wp_enqueue_style('word_balloon_icon', WORD_BALLOON_URI . 'css/word_balloon_icon.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);

	if($atts['icon_effect'] !== '' ){
		$w_b_class['w_b_icon_effect'] .= ' w_b_'.$atts['icon_effect'];
		wp_enqueue_style('word_balloon_effect_'.$atts['icon_effect'], WORD_BALLOON_URI . 'css/effect/word_balloon_'.$atts['icon_effect'].'.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);

		if($atts['icon_effect_duration'] !== '' && function_exists('word_balloon_pro_animation_duration') )
			$w_b_style['w_b_icon_effect'] .= word_balloon_pro_animation_duration($atts['icon_effect_duration']);

	}

	if($atts['icon_filter'] !== ''){
		wp_enqueue_style('word_balloon_filter_'.$atts['icon_filter'], WORD_BALLOON_URI . 'css/filter/word_balloon_'.$atts['icon_filter'].'.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);
		$w_b_class['w_b_icon_filter'] .= ' w_b_f_'.$atts['icon_filter'];
	}

	$w_b_style['w_b_icon'] .= 'width:'.$load_setting['icon_custom_size'][$atts['icon_size']].'%;height:'.$load_setting['icon_custom_size'][$atts['icon_size']].'%;';

	if($atts['icon_position'] === "top_left" || $atts['icon_position'] === "bottom_left" || $atts['icon_position'] === "center_left"){
		$w_b_class['w_b_icon'] .= ' w_b_icon_L';
	}
	if($atts['icon_position'] === "top_right" || $atts['icon_position'] === "bottom_right" || $atts['icon_position'] === "center_right"){
		$w_b_class['w_b_icon'] .= ' w_b_icon_R';
	}
	if($atts['icon_position'] === "top_left" || $atts['icon_position'] === "top_right" || $atts['icon_position'] === "top_center"){
		$w_b_class['w_b_icon'] .= ' w_b_icon_T';
	}
	if($atts['icon_position'] === "bottom_left" || $atts['icon_position'] === "bottom_right" || $atts['icon_position'] === "bottom_center"){
		$w_b_class['w_b_icon'] .= ' w_b_icon_B';
	}
	if($atts['icon_position'] === "top_center" || $atts['icon_position'] === "bottom_center" || $atts['icon_position'] === "center"){
		$w_b_class['w_b_icon'] .= ' w_b_icon_HC';
	}
	if($atts['icon_position'] === "center_left" || $atts['icon_position'] === "center_right" || $atts['icon_position'] === "center"){
		$w_b_class['w_b_icon'] .= ' w_b_icon_VC';
	}




	if($atts['icon_size'] !== '') {
		$w_b_class['w_b_icon'] .= ' w_b_icon-'.$atts['icon_size'];
	}else{
		$w_b_class['w_b_icon'] .= ' w_b_icon-M';
	}

	if($atts['icon_in_view'] !== ''){
		if(function_exists('word_balloon_pro_in_view_setting') ) $w_b_class['w_b_icon'] .= word_balloon_pro_in_view_setting($atts,'icon');

		if($atts['icon_in_view_duration'] !== '' && function_exists('word_balloon_pro_animation_duration') )
			$w_b_style['w_b_icon'] .= word_balloon_pro_animation_duration($atts['icon_in_view_duration']);
	}



	

	if($atts['icon_flip'] !== '') {
		$svg_file = str_replace('<svg', '<svg class="w_b_flip_'.$atts['icon_flip'].'"', $svg_file);
	}

	if( $atts['icon_fill'] !== '' || $atts['icon_stroke'] !== '' || $atts['icon_stroke_width'] !== '' ){
		if(function_exists('word_balloon_pro_icon_replace') ) $svg_file = word_balloon_pro_icon_replace($atts,$svg_file);
	}

	return '<div class="w_b_icon'.$w_b_class['w_b_icon'].' w_b_direction_'.$atts['direction'].' w_b_div" style="'.$w_b_style['w_b_icon'].'"><div class="w_b_icon_effect'.$w_b_class['w_b_icon_effect'].$w_b_class['w_b_icon_filter'].' w_b_w100 w_b_h100 w_b_div" style="'.$w_b_style['w_b_icon_effect'].'">'."\n".$svg_file."\n".'</div></div>';

}
