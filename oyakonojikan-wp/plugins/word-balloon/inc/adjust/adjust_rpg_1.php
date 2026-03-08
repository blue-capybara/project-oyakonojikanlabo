<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_adjust_balloon_rpg_1($atts , $load_setting , $balloon_data){

	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}
	if($atts['border_color']){
		$balloon_data['border_style'] = 'box-shadow:0 0 0 4px ' . $atts['border_color'] . ' inset;';
	}
	if($atts['bg_color']){
		$balloon_data['background_color'] = 'background:' . $atts['bg_color'] . ';border-color:' . $atts['bg_color'] . ';';
	}

	if($atts['name_position'] === 'on_avatar') $balloon_data['box_padding_top'] = $load_setting['name_margin'];

	return $balloon_data;

}

function word_balloon_adjust_avatar_rpg_1($atts , $load_setting , $avatar_data){

	if($atts['name_position'] === "on_balloon"){
		$avatar_data["avatar_padding_top"] = $load_setting['name_margin'];
	}

	return $avatar_data;

}
