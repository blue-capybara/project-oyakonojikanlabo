<?php
defined( 'ABSPATH' ) || exit;


function word_balloon_adjust_balloon_heart($atts , $load_setting , $balloon_data){

	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}

	if($atts['name_position'] === 'on_avatar') $balloon_data['box_padding_top'] = $load_setting['name_margin'];
	//$balloon_data['border_image_source'] = ' border-image-source:url(\''.WORD_BALLOON_URI.'css/skin/'.$atts['balloon'].'_'.$atts['position'].'.svg\');';

	//$balloon_data['quote_align'] = ' w_b_flex w_b_ai_c';

	if(defined('WORD_BALLOON_AMP') && WORD_BALLOON_AMP){

		$svg = '\''.WORD_BALLOON_URI.'css/skin/'.$atts['balloon'].'_'.$atts['position'].'.svg\'';

	}else{

		$svg = '\'data:image/svg+xml;base64,'.base64_encode(word_balloon_get_material(WORD_BALLOON_DIR.'css/skin/'.$atts['balloon'].'_'.$atts['position'].'.svg')).'\'';

	}

	$balloon_data['border_image_source'] .= 'border-image-source:url('.$svg.');';

	return $balloon_data;

}

function word_balloon_adjust_avatar_heart($atts , $load_setting , $avatar_data){

	if($atts['name_position'] === "on_balloon"){
		$avatar_data["avatar_padding_top"] = $load_setting['name_margin'];
	}

	return $avatar_data;

}
