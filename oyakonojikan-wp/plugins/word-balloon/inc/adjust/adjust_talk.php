<?php
defined( 'ABSPATH' ) || exit;


function word_balloon_adjust_balloon_talk($atts , $load_setting , $balloon_data){

	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}

	$on_balloon_margin = 0;
	if($atts['name_position'] === 'on_balloon'){
		$on_balloon_margin = $load_setting['name_margin'];
	}elseif($atts['name_position'] === 'on_avatar'){
		$on_balloon_margin = -$load_setting['name_margin'];
	}

	$balloon_data['box_padding_top'] = absint($load_setting['avatar_custom_size'][$atts['size']] / 2.5 - $on_balloon_margin);

	//$balloon_data['quote_align'] = ' w_b_flex w_b_ai_c';

	return $balloon_data;

}
