<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_convert_options_under_3(){

	$load_setting = get_option('word_balloon');
	if ( !$load_setting ) return;

	$instance = array();
	$old_settings = array();

	$old_settings = array(
		'avatar_size',
		'avatar_border_radius',
		'name_position',
		'avatar_position',
		'balloon_m',
		'avatar_size_m',
		'name_position_m',
		'font_size_m',
		'status_color',
		'name_color',
		'icon_size',

		'custom_balloon',
		'custom_icon',

		'disable_balloon',
		'disable_icon',
		'disable_effect',
		'disable_filter',

		'template',

		'custom_avatar_shadow',
		'custom_balloon_shadow',
		'custom_balloon_drop_shadow',
		'custom_avatar_border',

		'avatar_hide',
		'balloon_shadow',
		'avatar_shadow',
		'avatar_border',

		'keep_mystery_men',

		'enable_sound',
		'box_center',
		'balloon_full_width',
		'balloon_vertical_writing',
		'side_by_side',

		'avatar_priority',
		'balloon_drop_shadow',
		'balloon_box_drop_shadow',

	);

	foreach ($old_settings as $key) {
		if(isset($load_setting[$key])){
			$instance[$key] = $load_setting[$key];
		}

	}

	if(isset($load_setting['easy_mode_hidden'])){
		$instance['panel_type_hidden'] = $load_setting['easy_mode_hidden'];
	}

	require_once WORD_BALLOON_DIR . 'inc/settings/default_admin_settings.php';

	update_option('word_balloon_admin_settings', word_balloon_merge_option(word_balloon_default_admin_settings() ,$instance) );


	$instance = array();
	$old_settings = array();


	$old_settings = array(
		'avatar_custom_size',
		'icon_custom_size',
		'amp_balloon_base',
		'amp_balloon',
		'amp_balloon_think',
		'fade_balloon',
		'inview',
		'amp_enable',
	);

	foreach ($old_settings as $key) {
		if(isset($load_setting[$key])){
			$instance[$key] = $load_setting[$key];
		}
	}

	require_once WORD_BALLOON_DIR . 'inc/settings/default_post_settings.php';

	update_option( 'word_balloon_post_settings', word_balloon_merge_option(word_balloon_default_post_settings() ,$instance) );


	$instance = array();
	$old_settings = array();


	$old_settings = array(
		'delete_db',
	);

	foreach ($old_settings as $key) {
		if(isset($load_setting[$key])){
			$instance[$key] = $load_setting[$key];
		}
	}

	require_once WORD_BALLOON_DIR . 'inc/settings/default_system_settings.php';

	update_option( 'word_balloon_system_settings', word_balloon_merge_option(word_balloon_default_system_settings() ,$instance) );



	$instance = array();
	if( isset($load_setting['favorite']) ){

		$instance = $load_setting['favorite'];

	}
	update_option('word_balloon_favorite_settings', $instance );


	$instance = array();
	if( isset($load_setting['wallpaper']) ){

		$instance = $load_setting['wallpaper'];

	}
	update_option('word_balloon_wallpaper_settings', $instance );


}


function word_balloon_convert_options_under_4_0_5(){

	$load_setting = get_option('word_balloon_post_settings');

	
	unset($load_setting['box_margin']);

	update_option( 'word_balloon_post_settings', $load_setting );

}

function word_balloon_convert_options_under_4_8_11(){

	$load_setting = get_option('word_balloon_admin_settings');

	if( isset($load_setting['default_icon']) ){
		$instance = $load_setting['default_icon'];
		foreach ($instance as $icon_type => $icon_key) {
			$load_setting['default_icon'][$icon_type]['stroke-width'] = 1;
		}
	}

	if( isset($load_setting['custom_icon']) ){
		$instance = $load_setting['custom_icon'];
		foreach ($instance as $icon_type => $icon_key) {
			$load_setting['custom_icon'][$icon_type]['stroke-width'] = 1;
		}
	}


	update_option( 'word_balloon_admin_settings', $load_setting );

}


function word_balloon_convert_options_under_4_8_16(){

	$load_setting = get_option('word_balloon_post_settings');

	
	$load_setting['amp_balloon_3'] = $load_setting['amp_balloon'];
	unset($load_setting['amp_balloon']);

	update_option( 'word_balloon_post_settings', $load_setting );

	
	$load_setting = get_option('word_balloon_admin_settings');
	unset($load_setting['name_position']);

	update_option( 'word_balloon_admin_settings', $load_setting );

}

