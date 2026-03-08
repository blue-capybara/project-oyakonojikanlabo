<?php

defined( 'ABSPATH' ) || exit;

include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
if(!is_plugin_active( 'word-balloon-pro/word-balloon-pro.php' )):

	
	function word_balloon_add_menu() {

		$system_info = word_balloon_system_settings_load();

		require_once WORD_BALLOON_DIR . 'inc/admin/admin_edit.php';

		$w_b_submenu_page = add_options_page(__('Setting Up Word Balloon','word-balloon'),'Word Balloon', word_balloon_capability( $system_info['capability_edit_avatar'] ), 'word-balloon','word_balloon_admin_page');
		add_action( "admin_print_scripts-$w_b_submenu_page", 'word_balloon_only_edit_page_scripts' );

	}
	add_action( 'admin_menu', 'word_balloon_add_menu' );

	
	
	register_activation_hook( WORD_BALLOON_PLUGIN_FILE, 'word_balloon_update_check' );

endif;


function word_balloon_update_db_check() {

	if ( get_option( 'word_balloon_version' ) !== WORD_BALLOON_VERSION ) {

		require_once WORD_BALLOON_DIR . 'inc/create_db.php';
		word_balloon_create_db();

	}

}


require_once WORD_BALLOON_DIR . 'inc/ajax_nonce.php';
add_action( 'wp_ajax_word_balloon_nonce_action_center', 'word_balloon_nonce_action_event' );



function word_balloon_only_edit_page_scripts() {




	
	wp_enqueue_media();

	wp_enqueue_style('word_balloon_admin', WORD_BALLOON_URI . 'css/word_balloon_admin.min.css',array(),WORD_BALLOON_VERSION);
	wp_enqueue_style('word_balloon_edit', WORD_BALLOON_URI . 'css/word_balloon_edit.min.css',array('word_balloon_admin'),WORD_BALLOON_VERSION);
	wp_enqueue_style('word_balloon_font', WORD_BALLOON_URI . 'css/font/style.min.css',array(),WORD_BALLOON_VERSION);
	//add_action( 'wp_enqueue_scripts', 'word_balloon_translations_edit' );
	
	wp_enqueue_script('word_balloon_base_script', WORD_BALLOON_URI . 'js/action/word_balloon_action_base.min.js',array(),WORD_BALLOON_VERSION,true);
	wp_register_script('word_balloon_edit', WORD_BALLOON_URI . 'js/word_balloon_edit.min.js',array('word_balloon_base_script'),WORD_BALLOON_VERSION,true);
	wp_enqueue_script('word_balloon_edit');
	wp_enqueue_script('word_balloon_avatar_register', WORD_BALLOON_URI . 'js/word_balloon_avatar_register.min.js',array('word_balloon_edit'),WORD_BALLOON_VERSION,true);
	
	$translations = word_balloon_script_translations();
	wp_localize_script( 'word_balloon_base_script', 'translations_word_balloon', $translations );
	
	wp_localize_script('word_balloon_base_script','word_balloon_nonce_ajax_object',array(
		'ajax_url' => admin_url('admin-ajax.php'),
		'action' => 'word_balloon_nonce_action_center',
		'nonce' => wp_create_nonce("word_balloon_nonce_action_center"),
		
	));


}





require_once WORD_BALLOON_DIR . 'inc/admin/admin_block.php';
add_action('enqueue_block_editor_assets', 'word_balloon_block_control_panel');



require_once WORD_BALLOON_DIR . 'inc/admin/admin_enqueue.php';
add_action( 'admin_enqueue_scripts', 'word_balloon_custom_enqueue' );


function word_balloon_tinymce_button() {
	//if ( current_user_can( 'edit_posts' )  ) {

	$system_info = word_balloon_system_settings_load();
	if( !current_user_can( word_balloon_capability( $system_info['capability_post'] ) ) ) return;


	add_filter( 'mce_buttons', 'word_balloon_register_tinymce_button' );
	add_filter( 'mce_external_plugins', 'word_balloon_tinymce_button_script' );
	//}
}
add_action( 'admin_init', 'word_balloon_tinymce_button' );


function word_balloon_register_tinymce_button( $buttons ) {
	array_push( $buttons, 'word_balloon_button' );
	array_push( $buttons, 'word_balloon_set_quote_button' );
	if( function_exists('word_balloon_pro_post_page_restore_add_quicktags') )
		array_push( $buttons, 'word_balloon_restore_button' );


	return $buttons;
}


function word_balloon_tinymce_button_script( $plugin_array ) {
	$plugin_array['word_balloon_script'] = WORD_BALLOON_URI . 'js/word_balloon_tinymce.min.js';
	return $plugin_array;
}


function word_balloon_custom_add_quicktags() {
	$system_info = word_balloon_system_settings_load();
	if( !current_user_can( word_balloon_capability( $system_info['capability_post'] ) ) ) return;

	global $hook_suffix;

	if ( ( 'post.php' == $hook_suffix || 'post-new.php' == $hook_suffix ) && wp_script_is('quicktags')){
		?>
		<script>
			function word_balloon_callback() { document.getElementById('w_b_modal_open').onclick(); }
			QTags.addButton( 'word_balloon', '<?php echo '&#xf0e6; '.esc_html_x('Word Balloon','text_button','word-balloon'); ?>', word_balloon_callback );
			function word_balloon_set_quote_callback() { document.getElementById('w_b_set_quote').onclick(); }
			QTags.addButton( 'word_balloon_set_quote', '<?php echo '&#xf27d; '.esc_html_x('Set quote','text_button','word-balloon'); ?>', word_balloon_set_quote_callback );
			<?php
			if(function_exists('word_balloon_pro_post_page_restore_add_quicktags') ) word_balloon_pro_post_page_restore_add_quicktags();
			?>
		</script>
		<?php
	}

}
add_action( 'admin_print_footer_scripts', 'word_balloon_custom_add_quicktags' );

function word_balloon_custom_edit_style(){
	echo '<style type="text/css" id="w_b_css"></style>';
}

function word_balloon_script_translations() {
	return array(
		'select_an_avatar' => __( 'Select an avatar', 'word-balloon' ),
		'select' => __( 'Select', 'word-balloon' ),
		'select_a_photo' => __( 'Select a photo', 'word-balloon' ),
		'do_you_want_to_delete' => __( 'Do you want to delete the avatar?', 'word-balloon' ),
		'really_remove_avatar' => __( 'Really remove avatar from the system?', 'word-balloon' ),
		'edit_avatar' => __( 'Edit Avatar', 'word-balloon' ),
		'edit_avatar_name' => __( 'Name', 'word-balloon' ),
		'edit_avatar_note' => __( 'Note', 'word-balloon' ),
		'edit_avatar_update' => __( 'Update', 'word-balloon' ),
		'edit_avatar_cancel' => __( 'Cancel', 'word-balloon' ),
		'edit_avatar_priority' => __( 'Priority', 'word-balloon' ),
		'anonymous' => __( 'John Doe', 'word-balloon' ),
		'select_a_sound' => __( 'Select a sound', 'word-balloon' ),
		'side_avatar' => __( 'side the avatar', 'word-balloon' ),
		'on_balloon' => __( 'on the balloon', 'word-balloon' ),
		'under_balloon' => __( 'under the balloon', 'word-balloon' ),
		'pop_up_shortcode_inserted' => __( 'Shortcode has been inserted', 'word-balloon' ),
		'pop_up_shortcode_copied' => __( 'Shortcode copied to clipboard', 'word-balloon' ),
		'pop_up_restore' => __( 'Restore successful', 'word-balloon' ),
		'pop_up_restore_fail' => __( 'Failed to restore', 'word-balloon' ),
		'pop_up_updated' => __( 'Updated', 'word-balloon' ),
		'pop_up_updating' => __( 'Updating...', 'word-balloon' ),
		'pop_up_copied' => __( 'Copied', 'word-balloon' ),
		'pop_up_select_avatar_checkbox' => __( 'Please select avatar checkbox.', 'word-balloon' ),
		'pop_up_select_bulk_action' => __( 'Please select bulk action.', 'word-balloon' ),
		'pop_up_select_text' => __( 'Please select text.', 'word-balloon' ),
		'pop_up_failed' => __( 'Failed:', 'word-balloon' ),
	);
}


function word_balloon_scriput_translations(){
	return word_balloon_script_translations();
}



function word_balloon_admin_color_picker() {
	

	wp_enqueue_style( 'wp-color-picker' );
	wp_enqueue_script( 'wp-color-picker' );



	wp_register_script( 'wp-color-picker-alpha', WORD_BALLOON_URI . 'js/wp-color-picker-alpha.min.js', array( 'wp-color-picker' ), WORD_BALLOON_VERSION, true );

	wp_add_inline_script(
		'wp-color-picker-alpha',
		'jQuery( function() { jQuery( ".color-picker" ).wpColorPicker(); } );'
	);
	wp_enqueue_script( 'wp-color-picker-alpha' );

	
	wp_enqueue_script('word_balloon_balloon_custom_script', WORD_BALLOON_URI . 'js/word_balloon_balloon_custom.min.js',array('wp-color-picker','jquery'),WORD_BALLOON_VERSION,true);
}











add_action( 'enqueue_block_editor_assets', 'word_balloon_user_styles' );




function word_balloon_extend_tiny_mce_before_init( $mce_init ) {
	$mce_init['cache_suffix'] = 'v='.time();
	return $mce_init;
}
add_filter( 'tiny_mce_before_init', 'word_balloon_extend_tiny_mce_before_init' );




if ( ! function_exists( 'word_balloon_pro_plugin_action_links' ) ) :
	function word_balloon_plugin_action_links($links, $file) {
		if ('word-balloon/word-balloon.php' == $file  && current_user_can( 'manage_options' )) {
			$settings_link = '<a href="' . admin_url( 'options-general.php?page=word-balloon' ) . '">'.__( 'Settings', 'word-balloon' ).'</a>';
			array_unshift($links, $settings_link);
		}
		return $links;
	}
	add_filter('plugin_action_links', 'word_balloon_plugin_action_links', 10, 2);
endif;

function word_balloon_old_wp() {
	echo '<style type="text/css" id="w_b_old_css">#w_b_overlay .wp-color-result {
		-webkit-box-sizing: content-box;
		-moz-box-sizing: content-box;
		-o-box-sizing: content-box;
		-ms-box-sizing: content-box;
		box-sizing: content-box;
	}</style>';

}


function word_balloon_update_check() {



	$old_version = get_option( 'word_balloon_version' );

	if ( $old_version === WORD_BALLOON_VERSION ) return;

	
	if(!$old_version)
		$old_version = WORD_BALLOON_VERSION;

	if (version_compare($old_version, '3.1.0', '<')) {
		
		
		require_once WORD_BALLOON_DIR . 'inc/save/convert_option.php';
		word_balloon_convert_options_under_3();
		$old_version = '4.0.0';
	}

	if (version_compare($old_version, '4.0.6', '<')) {
		
		
		require_once WORD_BALLOON_DIR . 'inc/save/convert_option.php';
		word_balloon_convert_options_under_4_0_5();
		$old_version = '4.1.0';
	}

	if (version_compare($old_version, '4.8.12', '<')) {
		
		
		require_once WORD_BALLOON_DIR . 'inc/save/convert_option.php';
		word_balloon_convert_options_under_4_8_11();
		$old_version = '4.8.12';
	}

	if (version_compare($old_version, '4.8.17', '<')) {
		
		
		require_once WORD_BALLOON_DIR . 'inc/save/convert_option.php';
		word_balloon_convert_options_under_4_8_16();
		$old_version = '4.8.17';
	}



	
	require_once WORD_BALLOON_DIR . 'inc/save/update_option.php';
	word_balloon_update_options();


	
	include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
	if( is_plugin_active( 'word-balloon-pro/word-balloon-pro.php' ) && defined("WORD_BALLOON_PRO_DIR") ){

		if ( file_exists(WORD_BALLOON_PRO_DIR . 'inc/save/build_style.php') ) {
			require_once WORD_BALLOON_PRO_DIR . 'inc/save/build_style.php';
			if ( function_exists( 'word_balloon_pro_build_css_file' ) ){
				if( version_compare(WORD_BALLOON_VERSION, '4.10.0', '>=') && version_compare(WORD_BALLOON_PRO_VERSION, '4.10.0', '>=') ){
					word_balloon_pro_build_css_file();
				}

			}
		}

	}else{

		word_balloon_update_db_check();

	}

	update_option( 'word_balloon_version', WORD_BALLOON_VERSION );

}
add_action( 'plugins_loaded', 'word_balloon_update_check' );


function word_balloon_textdomain_load() {
	load_plugin_textdomain( 'word-balloon', false, dirname( plugin_basename( WORD_BALLOON_PLUGIN_FILE ) ) .'/languages/' );
}
add_action( 'plugins_loaded', 'word_balloon_textdomain_load');


function word_balloon_dummy_shortcode(){
	return;
}

add_shortcode('word_balloon', 'word_balloon_dummy_shortcode');

add_shortcode('word_balloon_wallpaper', 'word_balloon_dummy_shortcode');

add_shortcode('word_balloon_side_by_side', 'word_balloon_dummy_shortcode');


function word_balloon_post_settings_load() {

	$post_settings = get_option('word_balloon_post_settings');

	if ( !$post_settings ){
		require_once WORD_BALLOON_DIR . 'inc/settings/default_post_settings.php';
		$post_settings = word_balloon_default_post_settings();
		update_option( 'word_balloon_post_settings', $post_settings );
	}

	return $post_settings;

}


function word_balloon_admin_settings_load() {

	$admin_settings = get_option('word_balloon_admin_settings');

	if ( !$admin_settings ){
		require_once WORD_BALLOON_DIR . 'inc/settings/default_admin_settings.php';
		$admin_settings = word_balloon_default_admin_settings();
		update_option( 'word_balloon_admin_settings', $admin_settings );
	}

	return $admin_settings;

}


function word_balloon_system_settings_load() {

	$system_settings = get_option('word_balloon_system_settings');

	if ( !$system_settings ){
		require_once WORD_BALLOON_DIR . 'inc/settings/default_system_settings.php';
		$system_settings = word_balloon_default_system_settings();
		update_option( 'word_balloon_system_settings', $system_settings );
	}

	return $system_settings;

}


function word_balloon_type_settings_load() {

	
	require_once WORD_BALLOON_DIR . 'inc/settings/default_type.php';
	return word_balloon_default_type_settings();

}



function word_balloon_full_option_load() {

	return array_merge(word_balloon_post_settings_load() , word_balloon_admin_settings_load() , word_balloon_type_settings_load());

}


function word_balloon_merge_option($old_option, $new_option){

	if (is_array($old_option)) {
		if (is_array($new_option)) {
			foreach ($new_option as $key => $value) {
				if (isset($old_option[$key]) && is_array($value) && is_array($old_option[$key])) {
					$old_option[$key] = word_balloon_merge_option($old_option[$key], $value);
				} else {
					$old_option[$key] = $value;
				}
			}
		}
	} elseif (! is_array($old_option) && ( strlen($old_option) == 0 || $old_option == 0 )) {
		$old_option = $new_option;
	}
	return $old_option;
}

function word_balloon_capability($capability){

	if('administrator' === $capability ){
		return 'manage_options';
	}elseif('editor' === $capability ){
		return 'moderate_comments';
	}elseif('author' === $capability ){
		return 'edit_published_posts';
	}elseif('contributor' === $capability ){
		return 'edit_posts';
	}

	return 'manage_options';

}



function word_balloon_restore_data_name(){

	
	
	

	return array(
		'avatar_position',
		'avatar_select',
		'avatar_size',
		'avatar_flip_h',
		'avatar_flip_v',
		'avatar_border_radius',
		'avatar_border',
		'avatar_shadow',
		'avatar_hide',
		'avatar_background_color',
		'avatar_border_color',
		'avatar_border_style',
		'avatar_border_width',
		'name_position',
		'avatar_name',
		'name_color',
		'name_font_size',

		'choice_balloon',
		'balloon_quote',
		'font_size',
		'text_align',
		'text_color',
		'balloon_background',
		'balloon_background_alpha',
		'balloon_border_color',
		'balloon_border_style',
		'balloon_border_width',
		'balloon_shadow_color',
		'balloon_shadow',
		'balloon_full_width',
		'box_center',
		'balloon_vertical_writing',
		'balloon_hide',
		'box_margin',
		'quote_effect',

		'icon_type',
		'icon_position',
		'icon_size',
		'icon_fill',
		'icon_stroke',
		'icon_stroke_width',
		'icon_flip_h',
		'icon_flip_v',

		'avatar_effect',
		'balloon_effect',
		'icon_effect',

		'avatar_effect_duration',
		'icon_effect_duration',
		'balloon_effect_duration',

		'avatar_filter',
		'balloon_filter',
		'icon_filter',

		'status',
		'status_color',
		'status_sound_filename',
		'status_sound_url',
		'status_sound_id',

		'balloon_m',
		'avatar_size_m',
		'name_position_m',
		'font_size_m',

		'avatar_in_view',
		'icon_in_view',
		'balloon_in_view',

		'avatar_in_view_duration',
		'icon_in_view_duration',
		'balloon_in_view_duration',

		'quote_effect',
		'quote_effect_speed',
		'quote_effect_minimum',

		'id',
		'font_color',
		'src',
		'sound',

	);
}


function word_balloon_ajax_get_sound_url(){

	if( check_ajax_referer( 'word_balloon_call_ajax', 'nonce', false ) ) {

		$sound_url = wp_get_attachment_url( $_POST['ID'] );

		if( $sound_url ){
			echo json_encode( array(
				"message" => "OK",
				"url" => $sound_url
			));
		}

	}

	wp_die();
}

add_action( 'wp_ajax_word_balloon_call_ajax', 'word_balloon_ajax_get_sound_url' );


add_action( 'customize_controls_enqueue_scripts' , function(){
	require_once WORD_BALLOON_DIR . 'inc/admin/admin_enqueue.php';
	word_balloon_custom_enqueue();
});

add_action( 'customize_controls_print_scripts' , function(){
	require_once WORD_BALLOON_DIR . 'inc/admin/admin_post.php';
	word_balloon_post_page();
});



add_action( 'customize_register', function(){
	require_once WORD_BALLOON_DIR . 'inc/admin/admin_block.php';
	word_balloon_block_control_panel();
});