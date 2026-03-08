<?php
defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) || ! WP_UNINSTALL_PLUGIN ||
	dirname( WP_UNINSTALL_PLUGIN ) != dirname( plugin_basename( __FILE__ ) ) ) {

	exit;
}

$load_setting = get_option('word_balloon_system_settings');

if( isset($load_setting['delete_db']) && $load_setting['delete_db'] === 'true' ){

	global $wpdb;
	$table_name = $wpdb->prefix . 'word_balloon';
	$sql = "DROP TABLE IF EXISTS $table_name";
	$wpdb->query($sql);
	delete_option("word_balloon_db_version");

}

if(isset($load_setting['delete_option']) && $load_setting['delete_option'] === 'true' ){

	delete_option("word_balloon_version");
	delete_option("word_balloon_admin_settings");
	delete_option("word_balloon_system_settings");
	delete_option("word_balloon_post_settings");
	delete_option("word_balloon_favorite_settings");
	delete_option("word_balloon_wallpaper_settings");

}

