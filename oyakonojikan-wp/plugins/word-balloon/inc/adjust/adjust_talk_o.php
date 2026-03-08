<?php
defined( 'ABSPATH' ) || exit;


function word_balloon_adjust_balloon_talk_o($atts , $load_setting , $balloon_data){

	$balloon_data['over_under'] = ' w_b_bal_O';
	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}

	if( $atts['name_position'] === 'on_balloon'){


			$balloon_data['name_style'] .= $balloon_data['etc_style'];


	}

	$under_avatar_margin = 0;
		//$balloon_data['box_padding_top'] = 16;
		//if($atts['name_position'] === 'on_avatar') $balloon_data['box_padding_bottom'] = 16;
	if($atts['name_position'] !== 'under_balloon') $balloon_data['box_padding_bottom'] = 14;

	return $balloon_data;

}
