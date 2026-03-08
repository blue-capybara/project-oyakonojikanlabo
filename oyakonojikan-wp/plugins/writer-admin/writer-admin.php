<?php
/**
 * Plugin Name:     Writer Admin
 * Text Domain:     writer-admin
 * Domain Path:     /languages
 * Version:         0.1.0
 *
 * @package         Writer_Admin
 */

define( 'WA_BASE_FILE', __FILE__ );
define( 'WA_BASE_NAME', plugin_basename( WA_BASE_FILE ) );
define( 'WA_URL', plugin_dir_url( __FILE__ ) );
define( 'WA_PATH', plugin_dir_path( __FILE__ ) );
define( 'WA_ASSETS_URL', WA_URL . 'assets/' );
define( 'WA_TMPL_PATH', WA_PATH . 'templates/' );

require_once WA_PATH . 'iwf/iwf-loader.php';
require_once WA_PATH . 'lib/wa.php';
require_once WA_PATH . 'lib/wa/user.php';
require_once WA_PATH . 'lib/wa/post.php';
require_once WA_PATH . 'lib/wa/view.php';
require_once WA_PATH . 'lib/wa/topic.php';
require_once WA_PATH . 'lib/wa/notice.php';
require_once WA_PATH . 'lib/wa/content.php';
require_once WA_PATH . 'lib/wa/content/abstract.php';
require_once WA_PATH . 'vendor/autoload.php';

add_action( 'iwf_loaded', function () {
	WA::get_instance();
	WA_User::get_instance();
	WA_Post::get_instance();
	WA_Topic::get_instance();
	WA_Notice::get_instance();
	WA_Content::get_instance();
} );

IWF_Loader::init();