<?php
/**
 * XO Security plugin for WordPress
 *
 * @package xo-security
 * @author  ishitaka
 * @license GPL-2.0-or-later
 *
 * @wordpress-plugin
 * Plugin Name:       XO Security
 * Plugin URI:        https://xakuro.com/wordpress/xo-security/
 * Description:       XO Security is a plugin to enhance login related security.
 * Version:           3.10.4
 * Requires at least: 4.9
 * Requires PHP:      5.6
 * Author:            Xakuro
 * Author URI:        https://xakuro.com/
 * License:           GPL v2 or later
 * Text Domain:       xo-security
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'XO_SECURITY_VERSION', '3.10.4' );
define( 'XO_SECURITY_URL', plugins_url( '', __FILE__ ) );
define( 'XO_SECURITY_DIR', __DIR__ );

require_once __DIR__ . '/inc/class-xo-security.php';

$xo_security = new XO_Security();

register_activation_hook( __FILE__, 'XO_Security::activation' );
register_uninstall_hook( __FILE__, 'XO_Security::uninstall' );
register_deactivation_hook( __FILE__, 'XO_Security::deactivation' );
