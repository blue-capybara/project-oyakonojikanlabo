<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_adjust_balloon_line($atts , $load_setting , $balloon_data){

		//$balloon_data['name_position']_margin = 0;
		//if($atts['name_position'] === 'on_balloon') $balloon_data['name_position']_margin = 16;

		//switch($atts['size']){
			//case 'S' : $balloon_data['box_padding_top'] = 17;  break;
			//case 'M' : $balloon_data['box_padding_top'] = 22;  break;
			//case 'L' : $balloon_data['box_padding_top'] = 27; break;
			//default : break;
		//}

		//$balloon_data['box_padding_top'] = $balloon_data['box_padding_top'] - $balloon_data['name_position']_margin;



	if($atts['font_color']){
		$balloon_data['text_color'] = 'color:' .$atts['font_color']. ';';
	}
	if($atts['bg_color']){
		$balloon_data['background_color'] = '--w_b_line:' . $atts['bg_color'] . ';';
	}


	if($atts['name_position'] !== 'on_balloon' || $atts['name'] === ''){
		$balloon_data['box_padding_top'] = $load_setting['name_margin'] + 4;
	}

	if( $atts['name_position'] === 'on_balloon'){
		$balloon_data['box_padding_top'] = 4;
	}
/*
	if( $atts['name_position'] === 'on_balloon' || $atts['name_position'] === 'under_balloon'){

		$name_side_margin = 14;

		if($atts['position'] === 'R'){
			$balloon_data['name_side'] = 'R';
			$balloon_data['name_style'] .= 'margin-right:'.$name_side_margin.'px;';
		}else{
			$balloon_data['name_side'] = 'L';
			$balloon_data['name_style'] .= 'margin-left:'.$name_side_margin.'px;';
		}

	}
*/



return $balloon_data;

}

/*
function word_balloon_adjust_avatar_line($atts , $load_setting , $avatar_data){

	return $avatar_data;

}
*/
