<?php

defined( 'ABSPATH' ) || exit;


function word_balloon_block_control_panel() {



	wp_enqueue_script('word_balloon_block_script', WORD_BALLOON_URI . 'js/word_balloon_block.min.js',array('wp-i18n', 'wp-element', 'wp-blocks', 'wp-components', 'wp-editor'));


	if ( function_exists( 'wp_set_script_translations' ) ) {
		
		wp_set_script_translations( 'word_balloon_block_script', 'word-balloon', WORD_BALLOON_DIR . 'languages' );

	} else if (function_exists('gutenberg_get_jed_locale_data')) {
		

		
		$locale  = gutenberg_get_jed_locale_data( 'word-balloon' );

		
		$content = 'wp.i18n.setLocaleData(' . json_encode( $locale ) . ', "word-balloon" );';

		
		wp_script_add_data( 'word_balloon_block_script', 'data', $content );
	}

	if(class_exists('WP_Block_Type_Registry') ){

		$block_registry = WP_Block_Type_Registry::get_instance();

		if( !array_key_exists('word-balloon/word-balloon-block', $block_registry->get_all_registered()) ){
			register_block_type( 'word-balloon/word-balloon-block', array(
				'editor_script' => 'word_balloon_block_script'	) );
		}
	}

	$load_setting = word_balloon_full_option_load();

	
	foreach ($load_setting['disable_balloon'] as $key => $value) {
		if($value === 'true')unset($load_setting['type_balloon'][$key]);
	}

	$word_balloon_block_balloon = array();
	$i = 0;
	foreach ($load_setting['type_balloon'] as $balloon_type => $balloon_name) {

		if($balloon_type === 'rpg_1')$balloon_name = 'RPG Ⅰ';
		if($balloon_type === 'rpg_2')$balloon_name = 'RPG Ⅱ';
		if($balloon_type === 'rpg_3')$balloon_name = 'RPG Ⅲ';
		if($balloon_type === '8bit_2')$balloon_name = __( '8bit Ⅱ', 'word-balloon' );

		$word_balloon_block_balloon[$i] = array(
			'value' => $balloon_type,
			'label' => esc_html($balloon_name)
		);
		++$i;
	}

	
	foreach ($load_setting['disable_icon'] as $key => $value) {
		if($value === 'true')unset($load_setting['type_icon'][$key]);
	}

	$word_balloon_block_icon = array();

	$word_balloon_block_icon[0] = array(
		'value' => '',
		'label' => ''
	);
	$i = 1;
	foreach ($load_setting['type_icon'] as $icon_type => $icon_name) {
		$word_balloon_block_icon[$i] = array(
			'value' => $icon_type,
			'label' => esc_html($icon_name)
		);
		++$i;
	}

	$i = 0;
	$word_balloon_block_icon_position = array();
	foreach ($load_setting['icon_position'] as $icon_position => $icon_position_name) {
		$word_balloon_block_icon_position[$i] = array(
			'value' => $icon_position,
			'label' => esc_html($icon_position_name)
		);
		++$i;
	}

	
	foreach ($load_setting['disable_effect'] as $key => $value) {
		if($value === 'true')unset($load_setting['type_effect'][$key]);
	}

	$word_balloon_block_effect = array();

	$word_balloon_block_effect[0] = array(
		'value' => '',
		'label' => ''
	);
	$i = 1;
	foreach ($load_setting['type_effect'] as $effect_type => $effect_name) {
		$word_balloon_block_effect[$i] = array(
			'value' => $effect_type,
			'label' => esc_html($effect_name)
		);
		++$i;
	}


	
	foreach ($load_setting['disable_filter'] as $key => $value) {
		if($value === 'true')unset($load_setting['type_filter'][$key]);
	}

	$word_balloon_block_filter = array();

	$word_balloon_block_filter[0] = array(
		'value' => '',
		'label' => ''
	);
	$i = 1;
	foreach ($load_setting['type_filter'] as $filter_type => $filter_name) {
		$word_balloon_block_filter[$i] = array(
			'value' => $filter_type,
			'label' => esc_html($filter_name)
		);
		++$i;
	}


	
	$word_balloon_block_in_view = array();
	$word_balloon_block_in_view_balloon = array();
	$word_balloon_block_in_view[0] = array(
		'value' => '',
		'label' => ''
	);
	$word_balloon_block_in_view_balloon[0] = array(
		'value' => '',
		'label' => ''
	);
	$word_balloon_block_in_view_balloon[1] = array(
		'value' => 'unset',
		'label' => __('Not use','word-balloon')
	);
	$i = 1;
	foreach ($load_setting['type_in_view'] as $in_view_type => $in_view_name) {
		$word_balloon_block_in_view[$i] = array(
			'value' => $in_view_type,
			'label' => esc_html($in_view_name)
		);
		$word_balloon_block_in_view_balloon[$i+1] = array(
			'value' => $in_view_type,
			'label' => esc_html($in_view_name)
		);
		++$i;
	}

	$word_balloon_block_quote_effect = array();
	$word_balloon_block_quote_effect[0] = array(
		'value' => '',
		'label' => ''
	);
	$i = 1;
	foreach ($load_setting['type_quote_effect'] as $quote_effect_type => $quote_effect_name) {
		$word_balloon_block_quote_effect[$i] = array(
			'value' => $quote_effect_type,
			'label' => esc_html($quote_effect_name)
		);
		++$i;
	}

	
	global $wpdb;
	$table_name = $wpdb->prefix . 'word_balloon';
	$array = $wpdb->get_results("SELECT * FROM $table_name", 'ARRAY_A');
	$word_balloon_block_avatar = array();

	if(count(array_filter($array)) === 0 || $load_setting['keep_mystery_men'] === 'true'){
		$word_balloon_block_avatar[0] = array(
			'id' => 'mystery_men',
			'name' => __('Mystery Men','word-balloon'),
			'url' => WORD_BALLOON_URI . 'img/mystery_men.svg',
			'memo' => __('mysterious figure','word-balloon'),
		);
	}

	


	foreach($array as $key => $value){
		$word_balloon_block_avatar[$value['id']] = array(
			'id' => $value['id'],
			'name' => $value['name'],
			'url' => $value['url'],
			'memo' => $value['text'],
		);
	}

	if(function_exists('word_balloon_pro_sort_avatar_list') ) $array = word_balloon_pro_sort_avatar_list($array , $load_setting['avatar_priority']);

	$word_balloon_block_avatar_select_option = array();

	if(count(array_filter($array)) === 0 || $load_setting['keep_mystery_men'] === 'true'){
		$word_balloon_block_avatar_select_option[0] = array(
			'value' => 'mystery_men',
			'label' => __('Mystery Men','word-balloon'). '(' . __('mysterious figure','word-balloon') . ')',
		);
	}
	foreach($array as $key => $value){
		$word_balloon_block_avatar_select_option[] = array(
			'value' => $value['id'],
			'label' => $value['name'] . ($value['text'] === '' ? '' : '(' . $value['text'] . ')'),
		);
	}



	$border_style = array(
		//'none' => esc_html__( 'none', 'word-balloon' ),
		'solid' => esc_html__( 'Solid', 'word-balloon' ),
		'double' => esc_html__( 'Double', 'word-balloon' ),
		'groove' => esc_html__( 'Groove', 'word-balloon' ),
		'ridge' => esc_html__( 'Ridge', 'word-balloon' ),
		'inset' => esc_html__( 'Inset', 'word-balloon' ),
		'outset' => esc_html__( 'Outset', 'word-balloon' ),
		'dashed' => esc_html__( 'Dashed', 'word-balloon' ),
		'dotted' => esc_html__( 'Dotted', 'word-balloon' ),
	);
	$word_balloon_block_border_style = array();
	foreach($border_style as $key => $value){
		$word_balloon_block_border_style[] = array(
			'value' => $key,
			'label' => $value,
		);
	}

	$word_balloon_pro = false;
	
	include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
	if(is_plugin_active( 'word-balloon-pro/word-balloon-pro.php' )){

		$license_info = get_option( 'word_balloon_pro_license_info' );

		if( isset($license_info['status']) && $license_info['status'] === 'valid' ){
			$word_balloon_pro = true;
		}
	}

	$word_balloon_block_default_settings = array(
		'avatar_size' => $load_setting['avatar_size'],
		'avatar_position' => $load_setting['avatar_position'],
		'avatar_border_radius' => $load_setting['avatar_border_radius'],
		'avatar_border' => ($load_setting['avatar_border'] === 'true' ? true : false),
		'avatar_shadow' => ($load_setting['avatar_shadow'] === 'true' ? true : false),
		'avatar_hide' => ($load_setting['avatar_hide'] === 'true' ? true : false),
		'choice_balloon' => $load_setting['choice_balloon'],
		'balloon_shadow' => ($load_setting['balloon_shadow'] === 'true' ? true : false),
		'box_center' => ($load_setting['box_center'] === 'true' ? true : false),
		'balloon_full_width' => ($load_setting['balloon_full_width'] === 'true' ? true : false),
		'innerblocks_mode' => ($load_setting['innerblocks_mode'] === 'true' ? true : false),
		'icon_size' => $load_setting['icon_size'],
		
		'name_color' => $load_setting['name_color'],
		'status_color' => $load_setting['status_color'],
		'balloon_m' => $load_setting['balloon_m'],
		'avatar_size_m' => $load_setting['avatar_size_m'],
		'name_position_m' => $load_setting['name_position_m'],
		'font_size_m' => $load_setting['font_size_m'],
		'name_position_m' => $load_setting['name_position_m'],
		'quote_effect_speed' => $load_setting['quote_effect_speed'],
		'quote_effect_minimum' => ($load_setting['quote_effect_minimum'] === 'true' ? true : false),
		'word_balloon_url' => WORD_BALLOON_URI,
		'word_balloon_pro' => $word_balloon_pro,
	);

	$word_balloon_block_template = array();
	$word_balloon_block_favorite = array();
	$word_balloon_block_wallpaper = array();
	$word_balloon_javascript_wallpaper = array();

	if($word_balloon_pro){

		if($load_setting['side_by_side'] === 'true' && defined( 'WORD_BALLOON_PRO_URI' )){

			wp_enqueue_script('word_balloon_side_by_side_block_script', WORD_BALLOON_PRO_URI . 'js/block/word_balloon_side_by_side.js',array('word_balloon_block_script'));

			if ( function_exists( 'wp_set_script_translations' ) ) {
				
				wp_set_script_translations( 'word_balloon_side_by_side_block_script', 'word-balloon-pro', WORD_BALLOON_PRO_DIR . 'languages' );

			} else if (function_exists('gutenberg_get_jed_locale_data')) {
				

				
				$locale  = gutenberg_get_jed_locale_data( 'word-balloon-pro' );

				
				$content = 'wp.i18n.setLocaleData(' . json_encode( $locale ) . ', "word-balloon-pro" );';

				
				wp_script_add_data( 'word_balloon_side_by_side_block_script', 'data', $content );
			}

		}

		if($load_setting['enable_wallpaper'] === 'true' && defined( 'WORD_BALLOON_PRO_URI' )){

			$word_balloon_block_wallpaper[] = array(
				'value' => 'custom',
				'label' => __('Custom','word-balloon')
			);

			$wallpaper_setting = get_option('word_balloon_wallpaper_settings');
			foreach ($wallpaper_setting as $key => $value) {
				if($value['background_color'] !== '' || $value['border_color'] !== '' || $value['image'] !== ''){

					$word_balloon_block_wallpaper[] = array(
						'value' => $key,
						'label' => $key
					);

					$word_balloon_javascript_wallpaper[$key] = array(
						'background_color' => $value['background_color'],
						'border_style' => $value['border_style'],
						'border_width' => $value['border_width'],
						'border_color' => $value['border_color'],
						'border_radius' => $value['border_radius'],
						'background_image' => $value['image']
					);
				}
			}

			wp_enqueue_script('word_balloon_wallpaper_block_script', WORD_BALLOON_PRO_URI . 'js/block/word_balloon_wallpaper.js',array('word_balloon_block_script'));
			wp_localize_script( 'word_balloon_wallpaper_block_script', 'word_balloon_block_wallpaper_id', $word_balloon_block_wallpaper );
			wp_localize_script( 'word_balloon_wallpaper_block_script', 'word_balloon_block_wallpaper', $word_balloon_javascript_wallpaper );


			if ( function_exists( 'wp_set_script_translations' ) ) {
				
				wp_set_script_translations( 'word_balloon_wallpaper_block_script', 'word-balloon-pro', WORD_BALLOON_PRO_DIR . 'languages' );

			} else if (function_exists('gutenberg_get_jed_locale_data')) {
				

				
				$locale  = gutenberg_get_jed_locale_data( 'word-balloon-pro' );

				
				$content = 'wp.i18n.setLocaleData(' . json_encode( $locale ) . ', "word-balloon-pro" );';

				
				wp_script_add_data( 'word_balloon_wallpaper_block_script', 'data', $content );
			}


		}




		//register_block_type( 'word-balloon/word-balloon-block', array(
			//'editor_script' => 'word_balloon_block_script'	) );

		$word_balloon_block_template[] = array(
			'value' => '',
			'label' => __('Template','word-balloon')
		);
		foreach($load_setting['template'] as $key => $value){
			$word_balloon_block_template[] = array(
				'value' => $key,
				'label' => $value,
			);
		}

		$word_balloon_block_favorite[] = array(
			'value' => '',
			'label' => __('Favorite','word-balloon')
		);

		$favorite_setting = get_option('word_balloon_favorite_settings');

		if($favorite_setting){

			$favorite_enable = false;
			$i = 1;
			while($i <= $load_setting['max_favorite']){
				if(isset($favorite_setting[$i]['enable'])){
					if($favorite_setting[$i]['enable'] === 'true'){
						$favorite_enable = true;
						$favorite_data = '';

						$word_balloon_block_favorite[] = array(
							'value' => $i,
							'label' => $favorite_setting[$i]['memo'],
						);

					}
				}
				++$i;
			}

		}

	}

	$palette = get_theme_support('editor-color-palette');

	if(is_array($palette) && !empty($palette) ){
		$color_array = array();

		foreach ($palette as $palette_key => $palette_val) {
			foreach ($palette_val as $color_key) {
				$color_array[$color_key['slug']] = $color_key['color'];
			}
		}
		wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_color_palette', $color_array );
	}



	$load_setting = word_balloon_post_settings_load();

	$word_balloon_block_avatar_size = array();
	foreach($load_setting['avatar_custom_size'] as $key => $value){
		$word_balloon_block_avatar_size[$key] = $value;
	}
	$word_balloon_block_icon_size = array();
	foreach($load_setting['icon_custom_size'] as $key => $value){
		$word_balloon_block_icon_size[$key] = $value;
	}


	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_avatar', $word_balloon_block_avatar );
	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_avatar_select_option', $word_balloon_block_avatar_select_option );

	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_avatar_size', $word_balloon_block_avatar_size );
	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_balloon', $word_balloon_block_balloon );
	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_icon', $word_balloon_block_icon );
	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_icon_size', $word_balloon_block_icon_size );
	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_icon_position_data', $word_balloon_block_icon_position );
	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_effect', $word_balloon_block_effect );
	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_filter', $word_balloon_block_filter );


	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_in_view', $word_balloon_block_in_view );
	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_in_view_balloon', $word_balloon_block_in_view_balloon );
	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_quote_effect', $word_balloon_block_quote_effect );


	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_border_style', $word_balloon_block_border_style );
	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_default_settings', $word_balloon_block_default_settings );
	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_template', $word_balloon_block_template );
	wp_localize_script( 'word_balloon_block_script', 'word_balloon_block_favorite', $word_balloon_block_favorite );


	wp_enqueue_style('word_balloon_admin_block', WORD_BALLOON_URI . 'css/word_balloon_block.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);

}
