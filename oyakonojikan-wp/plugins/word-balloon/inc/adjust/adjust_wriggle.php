<?php
defined( 'ABSPATH' ) || exit;


function word_balloon_adjust_balloon_wriggle($atts , $load_setting , $balloon_data){

	$balloon_data['class']['w_b_bal_box'] .= ' w_b_mta w_b_flex w_b_col w_b_jc_fe';
	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}

	$under_avatar_margin = 0;
	if($atts['name_position'] === 'under_avatar') $under_avatar_margin = $load_setting['name_margin'];
	if($atts['name_position'] === 'on_avatar') $balloon_data['box_padding_top'] = 16;
	$balloon_data['box_padding_bottom'] = $under_avatar_margin + 5;


	if($atts['name_position'] === 'under_balloon'){
		$balloon_data['name_style'] .= 'margin-top:-26px;margin-bottom:16px;';
	}
	//$balloon_data['border_image_source'] = ' border-image-source:url(\''.WORD_BALLOON_URI.'css/skin/'.$atts['balloon'].'_'.$atts['position'].'.svg\');';
	
	$balloon_data['status_box_margin'] = 'margin-bottom:26px;';

	if(defined('WORD_BALLOON_AMP') && WORD_BALLOON_AMP){

		$svg = '\''.WORD_BALLOON_URI.'css/skin/'.$atts['balloon'].'_'.$atts['position'].'.svg\'';

	}else{

		$svg = '\'data:image/svg+xml;base64,'.base64_encode(word_balloon_get_material(WORD_BALLOON_DIR.'css/skin/'.$atts['balloon'].'_'.$atts['position'].'.svg')).'\'';

	}

	$balloon_data['border_image_source'] .= 'border-image-source:url('.$svg.');';


	return $balloon_data;

}

function word_balloon_adjust_avatar_wriggle($atts , $load_setting , $avatar_data){

	if($atts['name_position'] === "under_balloon"){
		$avatar_data["avatar_padding_top"] = $load_setting['name_margin'] + 5;
	}

	$avatar_data['class']['w_b_ava_box'] .= ' w_b_mta w_b_flex w_b_col w_b_jc_fe';

	return $avatar_data;

}