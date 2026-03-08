<?php
/**
 * Managing database operations for the plugin.
 *
 * @since 3.0.0
 * @package SWPTLS
 */

namespace SWPTLSPRO;

// If direct access than exit the file.
defined( 'ABSPATH' ) || exit;

/**
 * Manages plugin database operations.
 *
 * @since 3.0.0
 */
final class Database {

	/**
	 * Contains tabs related database operations.
	 *
	 * @var \SWPTLS\Database\Tab
	 */
	public $tab;

	/**
	 * Class constructor.
	 *
	 * @since 3.0.0
	 */
	public function __construct() {
		$this->tab = new \SWPTLSPRO\Database\Tab();
	}
}