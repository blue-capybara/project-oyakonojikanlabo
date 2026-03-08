<?php
defined( 'ABSPATH' ) || exit;


function word_balloon_adjust_balloon_upper($atts , $load_setting , $balloon_data){

	$balloon_data['over_under'] = ' w_b_bal_O';
	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}
	if($atts['bg_color']){
		$balloon_data['background_color'] = '--w_b_upper_b:' . $atts['bg_color'] . ';';
	}
	if($atts['border_color']){
		$balloon_data['border_style'] = '--w_b_upper_a:' . $atts['border_color'] . ';';
	}

	//$ud_margin  = $load_setting['avatar_custom_size'][$atts['size']] / 2 - 27 ;

	//if($atts['position'] === 'L'){
	//	$balloon_data['etc_style'] .= 'margin-left:'. $ud_margin .'px;';
	//}else{
	//	$balloon_data['etc_style'] .= 'margin-right:'. $ud_margin .'px;';
	//}

	if( $atts['name_position'] === 'on_balloon'){


			$balloon_data['name_style'] .= $balloon_data['etc_style'];


	}

	$under_avatar_margin = 0;
		//$balloon_data['box_padding_top'] = 16;
		//if($atts['name_position'] === 'on_avatar') $balloon_data['box_padding_bottom'] = 16;
	if($atts['name_position'] !== 'under_balloon') $balloon_data['box_padding_bottom'] = $load_setting['name_margin'] + 4;

	return $balloon_data;

}

/*
function word_balloon_adjust_avatar_upper($atts , $load_setting , $avatar_data){

	return $avatar_data;

}
*/
