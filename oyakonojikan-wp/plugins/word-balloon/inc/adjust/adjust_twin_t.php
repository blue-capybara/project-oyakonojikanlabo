<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_adjust_balloon_twin_t($atts , $load_setting , $balloon_data){

	$balloon_data['class']['w_b_bal_box'] .= ' w_b_mta w_b_flex w_b_col w_b_jc_fe';

	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}
	if($atts['bg_color']){
		$balloon_data['background_color'] = 'background:' . $atts['bg_color'] . ';';
	}
	if($atts['border_color']){
		$balloon_data['border_style'] = '--w_b_twin_t:' . $atts['border_color'] . ';';
	}

	$under_avatar_margin = 0;
	if($atts['name_position'] === 'under_avatar') $balloon_data['box_padding_bottom'] = $load_setting['name_margin'];

	return $balloon_data;

}

function word_balloon_adjust_avatar_twin_t($atts , $load_setting , $avatar_data){

	if($atts['name_position'] === "under_balloon"){
		$avatar_data["avatar_padding_bottom"] = $load_setting['name_margin'];
	}

	$avatar_data['class']['w_b_ava_box'] .= ' w_b_mta w_b_flex w_b_col w_b_jc_fe';

	return $avatar_data;

}
