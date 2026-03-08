<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_adjust_balloon_rpg_2($atts , $load_setting , $balloon_data){

	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}

	if($atts['name_position'] === 'on_avatar') $balloon_data['box_padding_top'] = $load_setting['name_margin'];

	return $balloon_data;

}

function word_balloon_adjust_avatar_rpg_2($atts , $load_setting , $avatar_data){

	if($atts['name_position'] === "on_balloon"){
		$avatar_data["avatar_padding_top"] = $load_setting['name_margin'];
	}

	return $avatar_data;

}
