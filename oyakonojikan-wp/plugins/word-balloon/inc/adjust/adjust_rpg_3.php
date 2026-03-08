<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_adjust_balloon_rpg_3($atts , $load_setting , $balloon_data){

	$balloon_data['class']['w_b_bal_box'] .= ' w_b_mta w_b_mba w_b_flex';

	
	$rpg_3_name_margin = 0;

	if( $atts['name'] != '' )
		$rpg_3_name_margin = $load_setting['name_margin']*2;

	$balloon_data['etc_style'] = 'min-height:'. ($load_setting['avatar_custom_size'][$atts['size']] + $rpg_3_name_margin + 30) .'px;';

	if($atts['position'] === 'L'){

		$balloon_data['etc_style'] .= 'padding-left:'. ($load_setting['avatar_custom_size'][$atts['size']] + 20) .'px;margin-left:-'. ($load_setting['avatar_custom_size'][$atts['size']] + 10) .'px;';

	}else{
		$balloon_data['etc_style'] .= 'padding-right:'. ($load_setting['avatar_custom_size'][$atts['size']] + 20) .'px;margin-right:-'. ($load_setting['avatar_custom_size'][$atts['size']] + 10) .'px;';
	}

	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}

	if($atts['border_color']){
		$balloon_data['border_style'] = 'border-color:' . $atts['border_color'] . ';';
	}

	if($atts['bg_color']){
		$balloon_data['background_color'] = 'background:' . $atts['bg_color'] . ';border-color:' . $atts['bg_color'] . ';';
	}

	if($atts['balloon_shadow_color']){
		$balloon_data['etc_style'] .= 'box-shadow :-2px 3px 1px 1px ' . $atts['balloon_shadow_color'] . ';';
	}

	if( $atts['name_position'] === 'on_balloon' || $atts['balloon'] === 'under_balloon' ){
		//$balloon_data['name_side'] = 'R';
	}

	$balloon_data['class']['w_b_bal_box'] .= ' w_b_z1';

	return $balloon_data;

}


function word_balloon_adjust_avatar_rpg_3($atts , $load_setting , $avatar_data){

	if($atts['name_position'] === "under_balloon"){
		$avatar_data['style']['w_b_ava_box'] .= 'margin-bottom:'.$load_setting['name_margin'].'px;';
	}else if($atts['name_position'] === "on_balloon"){
		$avatar_data['style']['w_b_ava_box'] .= 'margin-top:'.$load_setting['name_margin'].'px;';
	}

	$avatar_data['class']['w_b_ava_box'] .= ' w_b_mta w_b_mba w_b_z2';

	return $avatar_data;

}
