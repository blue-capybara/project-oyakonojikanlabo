<?php

defined( 'ABSPATH' ) || exit;


function word_balloon_custom_enqueue() {
	
	global $hook_suffix;

	if( ('post.php' == $hook_suffix || 'post-new.php' == $hook_suffix || 'widgets.php' == $hook_suffix || 'customize.php' == $hook_suffix )  ) {

		$system_info = word_balloon_system_settings_load();
		if( !current_user_can( word_balloon_capability( $system_info['capability_post'] ) ) ) return;

		
		require_once WORD_BALLOON_DIR . 'inc/settings/default_admin_settings.php';

		$admin_settings = get_option('word_balloon_admin_settings');

		if ( !$admin_settings ) $admin_settings = word_balloon_default_admin_settings();

		
		require_once WORD_BALLOON_DIR . 'inc/settings/default_type.php';
		$type_settings = word_balloon_default_type_settings();


		$load_setting = array_merge($admin_settings , $type_settings);

		word_balloon_admin_color_picker();

		
		wp_enqueue_script('word_balloon_base_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_base.min.js',array('word_balloon_balloon_custom_script'),WORD_BALLOON_VERSION,true);

		
		foreach ($load_setting['disable_balloon'] as $key => $value) {
			if($value === 'true')unset($load_setting['type_balloon'][$key]);
		}

		
		foreach ($load_setting['type_balloon'] as $balloon_type => $balloon_name) {
			wp_enqueue_style('word_balloon_skin_'.$balloon_type, WORD_BALLOON_URI . 'css/skin/word_balloon_'.$balloon_type.'.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);
			wp_enqueue_script('word_balloon_post_'.$balloon_type, WORD_BALLOON_URI . 'js/adjust/adjust_'.$balloon_type.'.min.js',array('word_balloon_balloon_custom_script'),WORD_BALLOON_VERSION,true);
		}

		

		if(!empty($load_setting['disable_effect'])){
			foreach ($load_setting['disable_effect'] as $key => $value) {
				if($value === 'true'){
					unset($load_setting['type_effect'][$key]);
				}
			}
		}

		if( isset($load_setting['type_effect']) ){
			foreach ($load_setting['type_effect'] as $effect_type => $effect_name) {
				wp_enqueue_style('word_balloon_effect_'.$effect_type, WORD_BALLOON_URI . 'css/effect/word_balloon_'.$effect_type.'.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);
			}
			
			wp_enqueue_script('word_balloon_effect_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_effect.min.js',array('word_balloon_balloon_custom_script'),WORD_BALLOON_VERSION,true);
		}


		

		if(!empty($load_setting['disable_filter'])){

			foreach ($load_setting['disable_filter'] as $key => $value) {
				if($value === 'true'){
					unset($load_setting['type_filter'][$key]);
				}
			}

		}

		if( isset($load_setting['type_filter']) ){
			foreach ($load_setting['type_filter'] as $filter_type => $filter_name) {
				wp_enqueue_style('word_balloon_filter_'.$filter_type, WORD_BALLOON_URI . 'css/filter/word_balloon_'.$filter_type.'.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);
			}
			
			wp_enqueue_script('word_balloon_filter_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_filter.min.js',array('word_balloon_balloon_custom_script'),WORD_BALLOON_VERSION,true);
		}

		
		$judge = false;
		if(empty($load_setting['disable_icon'])){
			$judge = true;
		}else{
			foreach ($load_setting['disable_icon'] as $key => $value) {
				if($value === 'true'){

				}else{
					$judge = true;
				}
			}
		}

		if($judge){
			
			wp_enqueue_script('word_balloon_icon_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_icon.min.js',array('word_balloon_balloon_custom_script'),WORD_BALLOON_VERSION,true);
			wp_enqueue_style('word_balloon_icon', WORD_BALLOON_URI . 'css/word_balloon_icon.min.css',array(),WORD_BALLOON_VERSION);
		}





		
		wp_enqueue_script('word_balloon_balloon_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_balloon.min.js',array('word_balloon_balloon_custom_script'),WORD_BALLOON_VERSION,true);

		
		wp_enqueue_script('word_balloon_avatar_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_avatar.min.js',array('word_balloon_balloon_custom_script'),WORD_BALLOON_VERSION,true);

		include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
		if(is_plugin_active( 'word-balloon-pro/word-balloon-pro.php' )):


			foreach ($load_setting['type_in_view'] as $in_view_type => $in_view_name) {
				wp_enqueue_style('word_balloon_in_view_'.$in_view_type, WORD_BALLOON_PRO_URI . 'css/in_view/word_balloon_in_view_'.$in_view_type.'.min.css',array('word_balloon_user_style'),WORD_BALLOON_PRO_VERSION);
			}


			
			wp_enqueue_script('word_balloon_in_view_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_in_view.min.js',array('word_balloon_balloon_custom_script'),WORD_BALLOON_VERSION,true);

			
			wp_enqueue_script('word_balloon_load_data_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_load_data.min.js',array('word_balloon_balloon_custom_script'),WORD_BALLOON_VERSION,true);

			wp_localize_script( 'word_balloon_load_data_script', 'word_balloon_ajax_data', array(
				'ajaxurl' => esc_url( admin_url( 'admin-ajax.php') ),
				'action' => 'word_balloon_call_ajax',
				'nonce' => wp_create_nonce( 'word_balloon_call_ajax' ),
			) );



			
			wp_enqueue_script('word_balloon_restore_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_restore.min.js',array('word_balloon_load_data_script'),WORD_BALLOON_VERSION,true);

		endif;

		
		wp_enqueue_script('word_balloon_status_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_status.min.js',array('word_balloon_balloon_custom_script'),WORD_BALLOON_VERSION,true);

		
		wp_enqueue_script('word_balloon_set_quote_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_set_quote.min.js',array('word_balloon_balloon_custom_script'),WORD_BALLOON_VERSION,true);

		
		wp_enqueue_script('word_balloon_post_script', WORD_BALLOON_URI . 'js/word_balloon_post.min.js',array('word_balloon_balloon_custom_script'),WORD_BALLOON_VERSION,true);





		wp_enqueue_style('word_balloon_admin', WORD_BALLOON_URI . 'css/word_balloon_admin.min.css',array('word_balloon_user_style'),WORD_BALLOON_VERSION);
		wp_enqueue_style('word_balloon_post', WORD_BALLOON_URI . 'css/word_balloon_post.min.css',array('word_balloon_admin'),WORD_BALLOON_VERSION);
		wp_enqueue_style('word_balloon_font', WORD_BALLOON_URI . 'css/font/style.min.css',array(),WORD_BALLOON_VERSION);

		
		$translations = word_balloon_script_translations();
		wp_localize_script( 'word_balloon_post_script', 'translations_word_balloon', $translations );

		
		add_editor_style( WORD_BALLOON_URI . 'css/word_balloon_user.min.css');
		

		require_once WORD_BALLOON_DIR . 'inc/admin/admin_post.php';
		add_action('admin_footer', 'word_balloon_post_page');

		word_balloon_user_styles();


		if($load_setting['enable_sound'] === 'true')
			wp_enqueue_script( 'word_balloon_action_sound_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_sound.min.js', array(), WORD_BALLOON_VERSION,true );

		add_action( 'admin_print_footer_scripts' , 'word_balloon_custom_edit_style' , 100);

		if( get_bloginfo('version') < 4.9){
			add_action( 'admin_print_footer_scripts', 'word_balloon_old_wp' , 99999 );
		}
	}
}
