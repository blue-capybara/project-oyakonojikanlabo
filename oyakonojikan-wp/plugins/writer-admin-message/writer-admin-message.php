<?php
/**
 * Plugin Name:     Writer Admin - Message
 * Text Domain:     writer-admin-message
 * Domain Path:     /languages
 * Version:         0.1.0
 *
 * @package         Writer_Admin_Message
 */

define( 'WA_MESSAGE_BASE_FILE', __FILE__ );
define( 'WA_MESSAGE_BASE_NAME', plugin_basename( WA_MESSAGE_BASE_FILE ) );
define( 'WA_MESSAGE_URL', plugin_dir_url( __FILE__ ) );
define( 'WA_MESSAGE_PATH', plugin_dir_path( __FILE__ ) );

include_once ABSPATH . 'wp-admin/includes/plugin.php';

if ( is_plugin_active( 'writer-admin/writer-admin.php' ) ) {
	add_action( 'iwf_loaded', function () {
		require_once WA_MESSAGE_PATH . 'lib/wa/message.php';

		WA_Message::get_instance();
	} );

} else {
	add_action( 'admin_notices', function () {
		printf( '<div class="notice notice-error"><p>[Writer Admin - Message] Writer Adminプラグインが有効化されていません。</p></div>' );
	} );
}