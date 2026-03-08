<?php
/**
 * Plugin Name:       FlexTable Pro
 * Plugin URI:        https://wppool.dev/sheets-to-wp-table-live-sync/
 * Description:       Display Google Spreadsheet data to WordPress table in just a few clicks and keep the data always synced. Organize and display all your spreadsheet data in your WordPress quickly and effortlessly.
 * Version:           3.14.0
 * Requires at least: 5.0
 * Requires PHP:      5.4
 * Author:            WPPOOL
 * Author URI:        https://wppool.dev/
 * Text Domain:       sheetstowptable-pro
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 *
 * @package SWPTLSPRO
 */

// if direct access than exit the file.
defined( 'ABSPATH' ) || exit;

define( 'SWPTLS_PRO_VERSION', '3.14.0' );
define( 'SWPTLS_PRO_BASE_PATH', plugin_dir_path( __FILE__ ) );
define( 'SWPTLS_PRO_BASE_URL', plugin_dir_url( __FILE__ ) );
define( 'SWPTLS_PRO_PLUGIN_FILE', __FILE__ );
define( 'SWPTLS_PRO_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// Define the class and the function.
require_once dirname( __FILE__ ) . '/includes/SWPTLS.php';
swptlspro();