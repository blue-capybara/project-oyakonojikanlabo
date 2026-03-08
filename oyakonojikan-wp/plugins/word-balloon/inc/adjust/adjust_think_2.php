<?php
defined( 'ABSPATH' ) || exit;


function word_balloon_adjust_balloon_think_2($atts , $load_setting , $balloon_data){

	$balloon_data['over_under'] = ' w_b_bal_O';
	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}

	//$ud_margin  = $load_setting['avatar_custom_size'][$atts['size']] / 2 - 27 ;


	//if($atts['name_position'] === 'on_balloon') {
	//	$balloon_data['name_style'] .= 'margin-bottom:-8px;';
	//}

	if($atts['name_position'] === 'under_balloon'){
		$balloon_data['name_style'] .= 'margin-top:-18px;';
	}elseif($atts['name_position'] === 'on_balloon'){
		$balloon_data['status_box_margin'] .= 'margin-top:14px;';
	}
		//$balloon_data['box_padding_top'] = 16;
		//if($atts['name_position'] === 'on_avatar') $balloon_data['box_padding_bottom'] = 16;
	//if($atts['name_position'] !== 'under_balloon') $balloon_data['box_padding_bottom'] = 4;

	
	$balloon_data['status_box_margin'] .= 'margin-bottom:18px;';

	if(defined('WORD_BALLOON_AMP') && WORD_BALLOON_AMP){

		$svg = '\''.WORD_BALLOON_URI.'css/skin/'.$atts['balloon'].'_'.$atts['position'].'.svg\'';

	}else{

		$svg = '\'data:image/svg+xml;base64,'.base64_encode(word_balloon_get_material(WORD_BALLOON_DIR.'css/skin/'.$atts['balloon'].'_'.$atts['position'].'.svg')).'\'';




	}

	$balloon_data['border_image_source'] .= 'border-image-source:url('.$svg.');';

	//$balloon_data['border_image_source'] = ' border-image-source:url(\''.WORD_BALLOON_URI.'css/skin/'.$atts['balloon'].'_'.$atts['position'].'.svg\');';

	return $balloon_data;

}
