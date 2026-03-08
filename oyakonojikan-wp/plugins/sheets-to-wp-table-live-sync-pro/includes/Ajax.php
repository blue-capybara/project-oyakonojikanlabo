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
class Ajax {

	/**
	 * Contains tab ajax functionality.
	 *
	 * @var \SWPTLSPRO\Ajax\Tabs
	 */
	public $tabs;

	/**
	 * Class constructor.
	 *
	 * @since 2.13.1
	 */
	public function __construct() {
		$this->tabs = new \SWPTLSPRO\Ajax\Tabs();
	}
}