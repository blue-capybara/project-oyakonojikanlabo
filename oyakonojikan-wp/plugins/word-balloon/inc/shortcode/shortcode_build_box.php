<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_build_word_balloon_box( $atts , $content ){

	
	require_once WORD_BALLOON_DIR . 'inc/settings/default_atts.php';
	$atts = shortcode_atts(word_balloon_default_atts(),$atts,'word_balloon');

	
	$load_setting = get_option('word_balloon_post_settings');
	if(!$load_setting){
		require_once WORD_BALLOON_DIR . 'inc/settings/default_post_settings.php';
		$load_setting = word_balloon_default_post_settings();
	}

	
	if( wp_is_mobile() )$load_setting['is_mobile'] = true;

	
	$content = do_shortcode( shortcode_unautop( $content ) );

	
	add_action( 'wp_footer', 'word_balloon_user_styles');

	
	require_once WORD_BALLOON_DIR . 'inc/shortcode/shortcode_function.php';

	
	require_once WORD_BALLOON_DIR . 'inc/shortcode/shortcode_build_balloon.php';

	
	require_once WORD_BALLOON_DIR . 'inc/shortcode/shortcode_build_avatar.php';

	
	if( function_exists('word_balloon_pro_replace_atts') ){
		$atts = word_balloon_pro_replace_atts($atts,$load_setting);
	}else{
		$atts['name_font_size'] = '';
	}

	
	if($atts['name_font_size'] !== ''){
		$load_setting['name_margin'] = $atts['name_font_size'];
	}else{
		$load_setting['name_margin'] = $load_setting['name_font_size'];
	}

	$load_setting['name_margin'] = floor( (int)$load_setting['name_margin'] * 1.4 );

	
	wp_enqueue_style('word_balloon_skin_'.$atts['balloon'], WORD_BALLOON_URI . 'css/skin/word_balloon_'.$atts['balloon'].'.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);

	
	if($load_setting['inview'] === 'true' ){
		
		wp_enqueue_style( 'word_balloon_inview_style', WORD_BALLOON_URI . 'css/word_balloon_inview.min.css' , array() , WORD_BALLOON_VERSION);
		wp_enqueue_script( 'polyfill_IntersectionObserver', 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver', array(), null , true );
		wp_enqueue_script('word_balloon_inview_script', WORD_BALLOON_URI . 'js/word_balloon_inview.min.js',array('polyfill_IntersectionObserver'),WORD_BALLOON_VERSION,true);
	}

	
	if( file_exists( WORD_BALLOON_DIR . 'inc/adjust/adjust_'.$atts['balloon'].'.php' ) ){
		require_once WORD_BALLOON_DIR . 'inc/adjust/adjust_'.$atts['balloon'].'.php';
	}

	$w_b_class['w_b_box'] = '';
	$w_b_class['w_b_wrap'] = '';
	$w_b_style['w_b_wrap'] = '';


	
	if($atts['name'] === 'false') $atts['name'] = '';

	
	if( is_numeric($atts['id']) ){

		
		global $wpdb;
		$table_name = $wpdb->prefix . 'word_balloon';
		$ava_data = $wpdb->get_results("SELECT * FROM $table_name", 'ARRAY_A');

		
		
		
		
		


		foreach($ava_data as $key => $value){
			if($value['id'] === $atts['id']){

				
				$atts['src'] = $value['url'];

				
				if($atts['name'] === '') $atts['name'] = $value['name'];

				
				break;
			}
		}

		
		if($atts['src'] === ''){
			$atts['id'] = 'mystery_men';
			$atts['src'] = WORD_BALLOON_URI . 'img/mystery_men.svg';
		}

	}elseif($atts['id'] === 'mystery_men'){

		
		$atts['src'] = WORD_BALLOON_URI . 'img/mystery_men.svg';

	}


	
	if($atts['balloon_full_width'] === 'true'){
		$w_b_class['w_b_wrap'] .= ' w_b_w100';
	}

	
	
	
	if($atts['box_center'] === 'true'){
		$w_b_class['w_b_box'] .= ' w_b_jc_c w_b_mla w_b_mra';
		//$margin_left_auto = '';
	}

	
	/*
	if($atts['balloon'] === 'rpg_3'){
		if($atts['position'] === 'L'){
			$w_b_class['w_b_wrap'] .= ' w_b_rpg_3_ml14';
		}else{
			$w_b_class['w_b_wrap'] .= ' w_b_rpg_3_mr14';
		}
	}
    */

	
	
	

	if($atts['position'] === 'R') {
		$w_b_class['w_b_wrap'] .= ' w_b_jc_fe';
		if($atts['box_center'] !== 'true')
			$w_b_class['w_b_box'] .= ' w_b_mla w_b_jc_fe';
	}

	
	$load_setting['is_under'] = word_balloon_is_under_balloon($atts['balloon']);
	$load_setting['is_over'] = word_balloon_is_over_balloon($atts['balloon']);

	$atts['direction'] = $atts['position'];

	
	if( $load_setting['is_under'] || $load_setting['is_over'] ){

		$atts['direction'] = 'O';
		if($load_setting['is_under']) {
			$atts['direction'] = 'U';
		}

		if($atts['position'] === 'L'){
			$w_b_class['w_b_wrap'] .= ' w_b_col w_b_ai_fs';
		}else{
			$w_b_class['w_b_wrap'] .= ' w_b_col w_b_ai_fe';
		}


		if($atts['balloon'] === 'talk_uc' || $atts['balloon'] === 'talk_oc' || $atts['balloon'] === 'slash_oc' || $atts['balloon'] === 'slash_uc'){
			$w_b_class['w_b_wrap'] = str_replace(array(' w_b_ai_fs',' w_b_ai_fe'), '', $w_b_class['w_b_wrap']);
			$w_b_class['w_b_wrap'] .= ' w_b_ai_c';
		}
		
		
	}

	
	if( $atts['box_margin'] === 'true' && $atts['box_center'] === 'false' && function_exists('word_balloon_pro_box_margin') && (!$load_setting['is_mobile'] || $load_setting['box_margin_require'] === 'true') )
		$w_b_style['w_b_wrap'] .= word_balloon_pro_box_margin($atts,$load_setting['avatar_custom_size'][$atts['size']]);



	$msg = '<div class="w_b_box w_b_w100 w_b_flex'.$w_b_class['w_b_box'].' w_b_div">';
	$msg .= '<div class="w_b_wrap w_b_wrap_'.$atts['balloon'].' w_b_'.$atts['position'].' w_b_flex'.$w_b_class['w_b_wrap'].' w_b_div" style="'.$w_b_style['w_b_wrap'].'">';


	
	if( ( $atts['position'] === 'L' && !$load_setting['is_over'] ) || $load_setting['is_under'] ){

		if( $atts['avatar_hide'] !== 'true' )
			$msg .= word_balloon_build_avatar_box( $atts , $load_setting );

		$msg .= word_balloon_build_balloon_box( $atts , $content , $load_setting );

	}else{
		
		$msg .= word_balloon_build_balloon_box( $atts , $content , $load_setting );


		if( $atts['avatar_hide'] !== 'true' )
			$msg .= word_balloon_build_avatar_box( $atts , $load_setting);

	}


	return $msg.'</div></div>';

}


