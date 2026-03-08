<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_adjust_balloon_geek($atts , $load_setting , $balloon_data){

	$balloon_data['class']['w_b_bal_box'] .= ' w_b_mta w_b_mba w_b_flex';

	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}

	if($atts['name_position'] === "under_avatar"){
		$balloon_data['box_padding_bottom'] = $load_setting['name_margin'];
	}else if($atts['name_position'] === "on_avatar"){
		$balloon_data['box_padding_top'] = $load_setting['name_margin'];
	}

	return $balloon_data;

}

function word_balloon_adjust_avatar_geek($atts , $load_setting , $avatar_data){

	if($atts['name_position'] === "under_balloon"){
		$avatar_data["avatar_padding_bottom"] = $load_setting['name_margin'];
	}else if($atts['name_position'] === "on_balloon"){
		$avatar_data["avatar_padding_top"] = $load_setting['name_margin'];
	}

	$avatar_data['class']['w_b_ava_box'] .= ' w_b_mta w_b_mba';

	return $avatar_data;

}
