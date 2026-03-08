<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_update_options(){

	
	$default_settings = $load_setting = array();

	require_once WORD_BALLOON_DIR . 'inc/settings/default_post_settings.php';
	$default_settings = word_balloon_default_post_settings();

	$load_setting = get_option('word_balloon_post_settings');

	if ( $load_setting ) {



		

		$load_setting = word_balloon_merge_option($default_settings, $load_setting);



	}else{

		
		$load_setting = $default_settings;

	}

	update_option( 'word_balloon_post_settings', $load_setting );



	
	$default_settings = $load_setting = array();


	require_once WORD_BALLOON_DIR . 'inc/settings/default_balloon_style.php';
	require_once WORD_BALLOON_DIR . 'inc/settings/default_icon_style.php';

	require_once WORD_BALLOON_DIR . 'inc/settings/default_admin_settings.php';

	$default_settings = word_balloon_default_admin_settings();

	$load_setting = get_option('word_balloon_admin_settings');

	if ( $load_setting ) {


		$load_setting = word_balloon_merge_option($default_settings, $load_setting);



	}else{

		
		$load_setting = $default_settings;

	}

	update_option( 'word_balloon_admin_settings', $load_setting );

	
	$default_settings = $load_setting = array();

	require_once WORD_BALLOON_DIR . 'inc/settings/default_system_settings.php';
	$default_settings = word_balloon_default_system_settings();

	$load_setting = get_option('word_balloon_system_settings');

	if ( $load_setting ) {

		$load_setting = word_balloon_merge_option($default_settings, $load_setting);

	}else{

		
		$load_setting = $default_settings;

	}

	update_option( 'word_balloon_system_settings', $load_setting );

}


