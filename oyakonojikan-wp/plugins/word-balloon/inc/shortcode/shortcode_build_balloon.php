<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_build_balloon_box( $atts , $content , $load_setting ){

	$msg = '';

	$allowed_tag = array(
		'br' => array(),
	);

	$balloon_data_name = array('balloon_shadow','box_padding_top','box_padding_bottom','box_padding','text_color','background_color','background_style','border_style','name_color','name_box','status_box','status_box_margin','font_size','name_position','name_side','over_under','sound','etc_style','text_align','name_style','full_width','balloon_filter','effect','name_margin','border_image_source','quote_align','quote_style','quote_class','quote_data','balloon_effect_duration');

	foreach ($balloon_data_name as $key) {
		$balloon_data[$key] = '';
	}

	
	$balloon_data['space_svg'] = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="1" height="1" viewBox="0 0 1 1" fill="transparent" stroke="transparent" stroke-miterlimit="10" class="w_b_db w_b_mp0"><polygon fill="transparent" stroke="transparent" points="0,1 0,1 0,1 0,1 "/></svg>';


	$balloon_data['class']['w_b_bal_box'] = '';
	$balloon_data['style']['w_b_bal_box'] = '';

	
	if($atts['balloon_filter'] != ''){
		wp_enqueue_style('word_balloon_filter_'.$atts['balloon_filter'], WORD_BALLOON_URI . 'css/filter/word_balloon_'.$atts['balloon_filter'].'.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);
		$balloon_data['balloon_filter'] = ' w_b_f_'.$atts['balloon_filter'];
	}

	
	if($atts['balloon_full_width'] === 'true'){

		$balloon_data['full_width'] = ' w_b_w100';

		
		if($atts['text_align'] === 'R'){
			$balloon_data['text_align'] = ' w_b_jc_fe w_b_ta_R';
		}elseif($atts['text_align'] === 'C'){
			$balloon_data['text_align'] = ' w_b_jc_c w_b_ta_C';
		}

	}elseif($atts['text_align'] !== ''){

		$balloon_data['text_align'] = ' w_b_ta_'.$atts['text_align'];

	}

	
	if($atts['font_size'] !== '') $balloon_data['font_size'] = 'font-size:'.$atts['font_size'].'px;';



	
	if (strpos($content,'class="w_b_block_quote"') !== false){
		$content = str_replace('<div class="w_b_block_quote">', '', $content);
		$content = rtrim($content, '</div>');
	}









	

	if($atts['balloon_effect'] != '' ){

		$balloon_data['effect'] .= ' w_b_'.$atts['balloon_effect'];
		wp_enqueue_style('word_balloon_effect_'.$atts['balloon_effect'], WORD_BALLOON_URI . 'css/effect/word_balloon_'.$atts['balloon_effect'].'.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);


		if($atts['balloon_effect_duration'] !== '' && function_exists('word_balloon_pro_animation_duration') )
			$balloon_data['balloon_effect_duration'] .= word_balloon_pro_animation_duration($atts['balloon_effect_duration']);

	}



	

	
	$function_balloon = 'word_balloon_adjust_balloon_'.$atts['balloon'];

	if ( function_exists( $function_balloon ) ){
		$balloon_data = $function_balloon($atts , $load_setting , $balloon_data);
	}


	
	if($balloon_data['background_color'] || $balloon_data['text_color'] || $balloon_data['font_size'] || $balloon_data['etc_style'] || $balloon_data['border_style'] || $balloon_data['border_image_source']){
		$balloon_data['background_style'] = ' style="' .$balloon_data['background_color'].$balloon_data['border_style'].$balloon_data['text_color'].$balloon_data['font_size'] .$balloon_data['etc_style']. $balloon_data['border_image_source'] . '"';
	}

	
	if($atts['balloon_vertical_writing'] === 'true'){
		$user_agent = $_SERVER['HTTP_USER_AGENT'];
		if (strstr($user_agent, 'Trident') || strstr($user_agent, 'MSIE')) {
			
			
			$balloon_data['quote_style'] = '';
		}else{
			$balloon_data['quote_style'] = ' style="-webkit-writing-mode:vertical-rl;-ms-writing-mode:tb-rl;writing-mode:vertical-rl;-webkit-text-orientation:upright;text-orientation:upright;"';
		}
	}

	
	if($atts['quote_effect'] !== ''){
		if ( function_exists( 'word_balloon_pro_quote_effect' ) ){
			$balloon_data = word_balloon_pro_quote_effect($atts , $content , $load_setting , $balloon_data);
			$content = $balloon_data['content'];
		}
	}

	if($balloon_data['box_padding_top'] !== "" && $atts['balloon_hide'] !== 'true'){

		$balloon_data['space_svg'] = str_replace('height="1','height="'.( $balloon_data['box_padding_top'] ),$balloon_data['space_svg']);

		$balloon_data['box_padding'] = '<div class="w_b_space w_b_mp0 w_b_div">'.$balloon_data['space_svg'].'</div>';
		
	}

	
	if($atts['balloon_shadow'] === 'true'){
		$balloon_data['balloon_shadow'] = ' w_b_shadow_'.$atts['position'];
	}


	
	if($atts['status'] !== '' || $atts['sound'] !== ''){

		require_once WORD_BALLOON_DIR . 'inc/shortcode/shortcode_build_status.php';
		$balloon_data['status_box'] = word_balloon_build_status( $atts , $load_setting , $balloon_data );

	}


	
	
	
	





	
	if( ( $atts['name_position'] === 'on_balloon' ||  $atts['name_position'] === 'under_balloon' ) && $atts['name'] !== '' ){

		if($atts['name_color'] !== ''){
			$balloon_data['name_style'] .= 'color:'.$atts['name_color'].';';
		}

		if('' !== $atts['name_font_size']) $balloon_data['name_style'] .= 'font-size:'.$atts['name_font_size'].'px;';

		
		if($balloon_data['name_side'] === '' ){

			if($atts['position'] === 'R'){
				$balloon_data['name_side'] = 'L';
			}else{
				$balloon_data['name_side'] = 'R';
			}

		}

		if($balloon_data['name_style'] !== '') $balloon_data['name_style'] = ' style="'.$balloon_data['name_style'].'"';

		$balloon_data['name_box'] = '<div class="w_b_name w_b_name_'.$balloon_data['name_side'].' w_b_ta_'.$balloon_data['name_side'].' w_b_lh w_b_div"'.$balloon_data['name_style'].'>'.wp_kses( $atts['name'], $allowed_tag ).'</div>';

	}

	if($atts['balloon_in_view'] !== ''){
		if(function_exists('word_balloon_pro_in_view_setting') ) $balloon_data['class']['w_b_bal_box'] .= word_balloon_pro_in_view_setting($atts,'balloon');

		if($atts['balloon_in_view_duration'] !== '' && function_exists('word_balloon_pro_animation_duration') )
			$balloon_data['style']['w_b_bal_box'] .= word_balloon_pro_animation_duration($atts['balloon_in_view_duration']);

		if($balloon_data['style']['w_b_bal_box'] !== '') $balloon_data['style']['w_b_bal_box'] = ' style="'.$balloon_data['style']['w_b_bal_box'].'";';
	}

	$msg .= '<div class="w_b_bal_box w_b_bal_'.$atts['position'].' w_b_relative w_b_direction_'.$atts['direction'].' w_b_w100'.$balloon_data['class']['w_b_bal_box'].' w_b_div"'.$balloon_data['style']['w_b_bal_box'].'>'.$balloon_data['box_padding'];


	$msg .= '<div class="w_b_bal_outer w_b_flex'.$balloon_data['effect'].$balloon_data['full_width'].' w_b_mp0 w_b_relative w_b_div" style="'.$balloon_data['balloon_effect_duration'].'">';

	if($atts['position'] === 'R') $msg .= $balloon_data['status_box'];

	if($atts['balloon_hide'] !== 'true'){

		$msg .= '<div class="w_b_bal_wrap w_b_bal_wrap_'.$atts['position'].$balloon_data['full_width'].' w_b_div">';

		if($atts['name_position'] === 'on_balloon') $msg .= $balloon_data['name_box'];


		if($balloon_data['full_width'] === ' w_b_w100') $balloon_data['full_width'] = ' w_b_flex';

		$msg .= '<div class="w_b_bal w_b_relative w_b_'.$atts['balloon'].' w_b_'.$atts['balloon'].'_'.$atts['position'].$balloon_data['balloon_shadow'].$balloon_data['over_under'].$balloon_data['text_align'].$balloon_data['full_width'].$balloon_data['balloon_filter'].$balloon_data['quote_align'].' w_b_div"'.$balloon_data['background_style'].'><div class="w_b_quote w_b_div'.$balloon_data['quote_class'].'"'.$balloon_data['quote_style'].$balloon_data['quote_data'].'>'.$content.'</div></div>';

		if($atts['name_position'] === 'under_balloon') $msg .= $balloon_data['name_box'];

		$msg .= '</div>';

	}




	if($atts['position'] === 'L') $msg .= $balloon_data['status_box'];

	$msg .= '</div>';



	if($balloon_data['box_padding_bottom'] !== '' && $atts['balloon_hide'] !== 'true'){

		$balloon_data['space_svg'] = str_replace('height="1','height="'.( $balloon_data['box_padding_bottom'] ),$balloon_data['space_svg']);

		$msg .= '<div class="w_b_space w_b_mp0 w_b_div">'.$balloon_data['space_svg'].'</div>';

		
	}

	$msg .= '</div>';

	return $msg;

}
