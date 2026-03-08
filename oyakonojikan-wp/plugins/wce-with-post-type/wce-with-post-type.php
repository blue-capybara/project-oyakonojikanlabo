<?php
/*
Plugin Name: WCE With Post Type
Plugin URI: http://www.kigurumi.asia
Description: This Add-on adds using post type for the WP CSV Exporter plugin.
Author: Nakashima Masahiro
Version: 1.0.1
Author URI: http://www.kigurumi.asia
License: GPLv2 or later
Text Domain: wce
Domain Path: /languages/
 */

define( 'WCE_WPT_VERSION', '1.0.1' );
define( 'WCE_WPT_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );
define( 'WCE_WPT_PLUGIN_NAME', trim( dirname( WCE_WPT_PLUGIN_BASENAME ), '/' ) );
define( 'WCE_WPT_PLUGIN_DIR', untrailingslashit( dirname( __FILE__ ) ) );
define( 'WCE_WPT_PLUGIN_URL', untrailingslashit( plugins_url( '', __FILE__ ) ) );

class WCE_With_Post_Type {
	protected $textdomain = 'wce';
	public $flg = 'true';
	public function __construct() {
		// プラグインが有効化されたときに実行されるメソッドを登録
		register_activation_hook( __FILE__, array( &$this, 'activationHook' ) );
		register_deactivation_hook( __FILE__, array( &$this, 'deactivationHook' ) );
	}

	/**
	 * 認証確認
	 */
	public function is_certified() {
		return true;
	}

	/**
	 * プラグインが有効化されたときに実行されるメソッド
	 *
	 * @return void
	 */
	public function activationHook() {
		$wce_options['post_type'] = true;
		update_option( 'wce_options', $wce_options );
	}

	/**
	 * 無効化ときに実行
	 */
	public function deactivationHook() {
		delete_option( 'wce_options' );
	}

}
$wce_with_post_type = new WCE_With_Post_Type();
