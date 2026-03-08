<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_build_avatar_box( $atts , $load_setting ){

	$msg = '';


	$etc_num = '';

	$avatar_data = array();

	$temp = array('w_b_ava_box','w_b_ava_wrap','w_b_name','w_b_ava_img','w_b_ava_effect','w_b_icon_wrap');
	foreach ($temp as $key => $value) {
		$avatar_data['class'][$value] = '';
	}

	$temp = array('w_b_ava_box','w_b_ava_wrap','w_b_ava_effect','w_b_ava_img','w_b_name');
	foreach ($temp as $key => $value) {
		$avatar_data['style'][$value] = '';
	}

	$avatar_data["avatar_padding_bottom"] = $avatar_data["avatar_padding_top"] = '';

	$allowed_tag = array(
		'br' => array(),
	);

	
	$function_balloon = 'word_balloon_adjust_avatar_'.$atts['balloon'];

	if ( function_exists( $function_balloon ) ){
		$avatar_data = $function_balloon($atts , $load_setting , $avatar_data);
	}

	
	if($atts['avatar_filter'] !== ''){
		$avatar_data['class']['w_b_ava_img'] .= ' w_b_f_'.$atts['avatar_filter'];
		wp_enqueue_style('word_balloon_filter_'.$atts['avatar_filter'], WORD_BALLOON_URI . 'css/filter/word_balloon_'.$atts['avatar_filter'].'.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);
	}




	
	if($atts['avatar_effect'] !== '' ){
		$avatar_data['class']['w_b_ava_effect'] .= ' w_b_'.$atts['avatar_effect'];
		wp_enqueue_style('word_balloon_effect_'.$atts['avatar_effect'], WORD_BALLOON_URI . 'css/effect/word_balloon_'.$atts['avatar_effect'].'.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);

		if($atts['avatar_effect_duration'] !== '' && function_exists('word_balloon_pro_animation_duration') )
			$avatar_data['style']['w_b_ava_effect'] .= word_balloon_pro_animation_duration($atts['avatar_effect_duration']);

	}






	
	$w_b_name['up_name'] = $w_b_name['low_name'] = false;
	$w_b_name['box'] = '';


	if( '' !== $atts['name']){
		
		if( 'on_avatar' === $atts['name_position'] ){

			$w_b_name['up_name'] = true;
			$avatar_data['class']['w_b_ava_box'] .= ' w_b_col';

		}else if( 'under_avatar' === $atts['name_position'] ){

			$w_b_name['low_name'] = true;
			$avatar_data['class']['w_b_ava_box'] .= ' w_b_col';

		}else if( 'side_avatar' === $atts['name_position'] ){
			if( $load_setting['is_under'] || $load_setting['is_over'] ){

				$avatar_data['class']['w_b_ava_box'] .= ' w_b_flex w_b_ai_fe';

				if( $load_setting['is_over'] ){
					$w_b_name['up_name'] = true;
					if( $atts['position'] === 'L' ){
						$avatar_data['class']['w_b_name'] .= ' w_b_o_2';
					}
				}

				if( $load_setting['is_under'] ){
					$w_b_name['low_name'] = true;

					if( $atts['position'] === 'R' ){
						$avatar_data['class']['w_b_icon_wrap'] .= ' w_b_o_2';
					}
				}
			}else{
				$atts['name'] = '';
			}
		}else{
			$atts['name'] = '';
		}



		if( '' !== $atts['name'] && ( $w_b_name['up_name'] || $w_b_name['low_name'] ) ){

			if('' !== $atts['name_color']) $avatar_data['style']['w_b_name'] .= 'color:'.$atts['name_color'].';';
			if('' !== $atts['name_font_size']) $avatar_data['style']['w_b_name'] .= 'font-size:'.$atts['name_font_size'].'px;';

			$w_b_name['box'] = '<div class="w_b_name w_b_w100 w_b_lh w_b_name_C w_b_ta_C'.$avatar_data['class']['w_b_name'].' w_b_mp0 w_b_div"'.('' === $avatar_data['style']['w_b_name'] ? '' : ' style="'.$avatar_data['style']['w_b_name'].'"' ).'>'.wp_kses( $atts['name'], $allowed_tag ).'</div>';

		}

	}
	

	

	
	if($atts['avatar_border'] === 'true') {
		$avatar_data['class']['w_b_ava_effect'] .= ' w_b_border_'.$atts['position'];

		if(function_exists('word_balloon_pro_avatar_border_replace') ) $avatar_data['style']['w_b_ava_effect'] .= word_balloon_pro_avatar_border_replace($atts);

	}

	
	if($atts['avatar_background_color'] !== '') {
		if(function_exists('word_balloon_pro_avatar_background_color') ) $avatar_data['style']['w_b_ava_effect'] .= word_balloon_pro_avatar_background_color($atts);
	}

	
	if($atts['avatar_shadow'] === 'true'){
		$avatar_data['class']['w_b_ava_effect'] .= ' w_b_ava_shadow_'.$atts['position'];
	}

	
	if( 'false' !== $atts['radius'] ){
		switch($atts['radius']){
			case 'radius_3' : $avatar_data['class']['w_b_ava_effect'] .= " w_b_radius_3"; break;
			case 'radius_12' : $avatar_data['class']['w_b_ava_effect'] .= " w_b_radius_12"; break;
			case 'radius_20' : $avatar_data['class']['w_b_ava_effect'] .= " w_b_radius_20"; break;
			case 'true' : $avatar_data['class']['w_b_ava_effect'] .= " w_b_radius"; break;
			default : break;
		}
	}

	
	if( '' !== $atts['avatar_flip'] ) {
		$avatar_data['class']['w_b_ava_img'] .= ' w_b_flip_'.$atts['avatar_flip'];
	}


	if($atts['avatar_in_view'] !== ''){
		if(function_exists('word_balloon_pro_in_view_setting') ) $avatar_data['class']['w_b_ava_wrap'] .= word_balloon_pro_in_view_setting($atts,'avatar');

		if($atts['avatar_in_view_duration'] !== '' && function_exists('word_balloon_pro_animation_duration') )
			$avatar_data['style']['w_b_ava_wrap'] .= word_balloon_pro_animation_duration($atts['avatar_in_view_duration']);
	}

	


	$msg = '<div class="w_b_ava_box w_b_relative w_b_ava_'.$atts['position'].$avatar_data['class']['w_b_ava_box'].' w_b_f_n w_b_div"'.( '' === $avatar_data['style']['w_b_ava_box'] ? '' : ' style="'.$avatar_data['style']['w_b_ava_box'].'"'  ). '>';


	
	if( $w_b_name['up_name'] ) $msg .= $w_b_name['box'];

	
	$msg .= '<div class="w_b_icon_wrap w_b_relative'.$avatar_data['class']['w_b_icon_wrap'].' w_b_div">';

	
	if( '' !== $atts['icon_type']  ) {
		require_once WORD_BALLOON_DIR . 'inc/shortcode/shortcode_build_icon.php';
		$msg .= word_balloon_build_avatar_icon( $atts , $load_setting );
	}

	$msg .= '<div class="w_b_ava_wrap w_b_direction_'.$atts['direction'].$avatar_data['class']['w_b_ava_wrap'].' w_b_mp0 w_b_div"'. ( '' === $avatar_data['style']['w_b_ava_wrap'] ? '' : ' style="'.$avatar_data['style']['w_b_ava_wrap'].'"'  ) .'>';

	$msg .= '<div class="w_b_ava_effect w_b_relative w_b_oh'.$avatar_data['class']['w_b_ava_effect'].' w_b_size_'.$atts['size'].' w_b_div" style="'.$avatar_data['style']['w_b_ava_effect'].'">';


	$msg .= "\n".'<img src="' .$atts['src']. '" width="'.$load_setting['avatar_custom_size'][$atts['size']].'" height="'.$load_setting['avatar_custom_size'][$atts['size']].'" alt="'.$atts['name'].'" class="w_b_ava_img w_b_w100 w_b_h100 '.$avatar_data['class']['w_b_ava_img'].' w_b_mp0 w_b_img" style="'.$avatar_data['style']['w_b_ava_img'].'" />'."\n";

	$msg .= '</div></div></div>';

	
	if( $w_b_name['low_name'] )	$msg .= $w_b_name['box'];

	return $msg . '</div>';


}

