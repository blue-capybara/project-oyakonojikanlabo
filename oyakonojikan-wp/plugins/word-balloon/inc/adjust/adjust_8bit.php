<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_adjust_balloon_8bit($atts , $load_setting , $balloon_data){

	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}

	$under_avatar_margin = 0;
	if($atts['name_position'] === 'under_avatar'){
		$under_avatar_margin = $load_setting['name_margin'];
	}else if($atts['name_position'] === 'on_avatar') {
		$balloon_data['box_padding_top'] = $load_setting['name_margin'];
	}

	$balloon_data['box_padding_bottom'] = absint($load_setting['avatar_custom_size'][$atts['size']] * 0.48 + $under_avatar_margin);

	//$balloon_data['quote_align'] = ' w_b_flex w_b_ai_c';

	return $balloon_data;

}

function word_balloon_adjust_avatar_8bit($atts , $load_setting , $avatar_data){

	if($atts['name_position'] === "under_balloon"){
		$avatar_data["avatar_padding_bottom"] = $load_setting['name_margin'];
	}

	$avatar_data['class']['w_b_ava_box'] .= ' w_b_mta w_b_flex w_b_col w_b_jc_fe';

	return $avatar_data;

}
