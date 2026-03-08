<?php
defined( 'ABSPATH' ) || exit;


function word_balloon_adjust_balloon_think($atts , $load_setting , $balloon_data){

	$balloon_data['over_under'] = ' w_b_bal_O';

	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}
	//$under_avatar_margin = 0;
	//if($atts['name_position'] === 'under_avatar') $under_avatar_margin = $load_setting['name_margin'];
	//if($atts['name_position'] === 'on_avatar') $balloon_data['box_padding_top'] = 16;
	//$balloon_data['box_padding_bottom'] = absint($load_setting['avatar_custom_size'][$atts['size']] * 0.9375 + $under_avatar_margin);
	if($atts['name_position'] !== 'under_balloon') $balloon_data['box_padding_bottom'] = 18;

	return $balloon_data;

}

/*
function word_balloon_adjust_avatar_think($atts , $load_setting , $avatar_data){

	return $avatar_data;

}
*/
