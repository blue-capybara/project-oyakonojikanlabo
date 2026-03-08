<?php
/**
 * Contains the plugin helper methods.
 *
 * @since 2.13.1
 * @package SWPTLSPRO
 */

namespace SWPTLSPRO;

// If direct access than exit the file.
defined( 'ABSPATH' ) || exit;

/**
 * Contains the plugin helper methods.
 *
 * @since 2.13.1
 */
class Admin {

	/**
	 * Displays tab page.
	 *
	 * @return void
	 */
	public static function tabPage() {
		load_template( SWPTLS_PRO_BASE_PATH . 'templates/manage_tab.php', true );
	}
}