<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_build_status( $atts , $load_setting , $balloon_data ){


	$balloon_data_name = array('status_box','status_color','sound_flip');

	$allowed_tag = array(
		'br' => array(),
	);

	foreach ($balloon_data_name as $key) {
		$balloon_data[$key] = '';
	}

	
	if($atts['sound'] !== ''){

		$balloon_data['sound'] = wp_get_attachment_url($atts['sound']);

		if($balloon_data['sound']){

			$temp = '';
			if($atts['position'] === 'R'){
				$balloon_data['sound_flip'] = 'w_b_flip_h';
				$temp = ' w_b_ta_R';
			}
			$balloon_data['sound'] = '<div class="w_b_status_sound w_b_mba w_b_div" style=""><div class="w_b_sound w_b_div w_b_relative w_b_z2'.$temp.'" style="cursor:pointer;"><div class="w_b_play_sound w_b_div" data-audio_id="'.$atts['sound'].'" data-audio_url="'.$balloon_data['sound'].'" data-play="'. WORD_BALLOON_URI .'img/play.svg" data-speaker="'. WORD_BALLOON_URI .'img/speaker.svg" data-flip="'.$balloon_data['sound_flip'].'">'."\n".'<img src="'. WORD_BALLOON_URI .'img/speaker.svg" width="26" height="26" class="'.$balloon_data['sound_flip'].' w_b_mp0 w_b_img" />'."\n".'</div><div class="w_b_stop_sound w_b_div" data-audio_id="'.$atts['sound'].'" style="display:none">'."\n".'<img class="w_b_mp0 w_b_img" src="'. WORD_BALLOON_URI .'img/stop.svg" width="26" height="26" />'."\n".'</div></div></div>';

			wp_enqueue_script( 'word_balloon_sound_script', WORD_BALLOON_URI . 'js/word_balloon_sound.min.js', array(), WORD_BALLOON_VERSION,true );
		}
	}

	$w_b_Class['status_box'] = '';
	$w_b_style['status_box'] = '';
	$w_b_style['status_color'] = '';


	if($atts['balloon_hide'] === 'true'){
		$w_b_style['status_box'] .= 'min-height:'.($load_setting['avatar_custom_size'][$atts['size']] -10).'px;'.$balloon_data['status_box_margin'];
	}else{
		//if($balloon_data['status_box_margin'] !== ''){
		$w_b_style['status_box'] .= $balloon_data['status_box_margin'];
		//}
	}
	if( in_array($atts['balloon'], array('talk_uc','talk_oc','slash_oc','slash_uc'), true) ){

		$w_b_Class['status_box'] .= ' w_b_absolute w_b_h100 w_b_w100';

		if($atts['position'] === 'L'){
			$w_b_style['status_box'] .= 'left:4px;margin-left:100%;';
		}else{
			$w_b_Class['status_box'] .= ' w_b_ta_R';
			$w_b_style['status_box'] .= 'right:4px;margin-right:100%;';
		}
	}else{
		$w_b_Class['status_box'] .= ' w_b_relative';
	}

	if( $atts['name_position'] === 'under_balloon' ){
		$w_b_style['status_box'] .= 'bottom:'. $load_setting['name_margin'] .'px;';
	}

	if( $atts['name_position'] === 'on_balloon' || $atts['name_position'] === 'under_balloon' ){
		$w_b_style['status_box'] .= 'margin-top:'. $load_setting['name_margin'] .'px;';
	}


	$w_b_style['status_box'] = ' style="' . $w_b_style['status_box'] . '"';

	if($atts['status_color'] !== '') $w_b_style['status_color'] = ' style="color:'.$atts['status_color'].';"';
	$balloon_data['status_box'] .= '<div class="w_b_status_box w_b_flex w_b_col w_b_f_n w_b_lh w_b_div'.$w_b_Class['status_box'].'"'.$w_b_style['status_box'].'>';

	$balloon_data['status_box'] .= $balloon_data['sound'];

	$balloon_data['status_box'] .= '<div class="w_b_status w_b_h100 w_b_flex w_b_col w_b_jc_fe w_b_div"'.$w_b_style['status_color'].'>';
	$balloon_data['status_box'] .= wp_kses( $atts['status'], $allowed_tag );
	$balloon_data['status_box'] .= '</div>';

	$balloon_data['status_box'] .= '</div>';

	return $balloon_data['status_box'];

}
