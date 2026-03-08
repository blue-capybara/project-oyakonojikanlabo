<?php
/**
 * Plugin Name:     Writer Admin - 親子の時間研究所
 * Text Domain:     writer-admin-oyako
 * Domain Path:     /languages
 * Version:         0.1.0
 *
 * @package         Writer_Admin_Oyako
 */

define( 'WA_OYAKO_BASE_FILE', __FILE__ );
define( 'WA_OYAKO_BASE_NAME', plugin_basename( WA_OYAKO_BASE_FILE ) );
define( 'WA_OYAKO_URL', plugin_dir_url( __FILE__ ) );
define( 'WA_OYAKO_PATH', plugin_dir_path( __FILE__ ) );

include_once ABSPATH . 'wp-admin/includes/plugin.php';

if ( is_plugin_active( 'writer-admin/writer-admin.php' ) ) {
	add_action( 'iwf_loaded', function () {
		require_once WA_OYAKO_PATH . 'lib/wa/oyako.php';
		require_once WA_OYAKO_PATH . 'lib/wa/oyako/user.php';
		require_once WA_OYAKO_PATH . 'lib/wa/oyako/post.php';
		require_once WA_OYAKO_PATH . 'lib/wa/oyako/invoice.php';
		require_once WA_OYAKO_PATH . 'vendor/autoload.php';

		WA_Oyako::get_instance();
		WA_Oyako_Invoice::get_instance();
		WA_Oyako_User::get_instance();
		WA_Oyako_Post::get_instance();
	} );

} else {
	add_action( 'admin_notices', function () {
		printf( '<div class="notice notice-error"><p>[Writer Admin - 親子の時間研究所] Writer Adminプラグインが有効化されていません。</p></div>' );
	} );
}