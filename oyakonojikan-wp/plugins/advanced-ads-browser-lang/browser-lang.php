<?php
/**
 * Advanced Ads Slider
 *
 * Plugin Name:       Advanced Ads – Browser Language
 * Plugin URI:        https://wpadvancedads.com/manual/display-ads-based-on-browser-language/
 * Description:       Display ads based on the browser language of your visitor.
 * Version:           1.0.0
 * Author:            Thomas Maier
 * Author URI:        https://wpadvancedads.com/
 * Text Domain:       advads-browser-lang
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// only load if not already existing (maybe within another plugin I created)
if(!class_exists('Advanced_Ads_Browser_Lang_Plugin')) {

// load basic path and url to the plugin
define('AABL_BASE_PATH', plugin_dir_path(__FILE__));
define('AABL_BASE_URL', plugin_dir_url(__FILE__));

// plugin slug and textdoamin
define('AABL_SLUG', 'advads-browser-lang');

include_once( plugin_dir_path( __FILE__ ) . 'plugin.php' );
new Advanced_Ads_Browser_Language();

}