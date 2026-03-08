<?php
/**
 * Manages plugin assets.
 *
 * @since 2.12.15
 * @package SWPTLSPRO
 */

namespace SWPTLSPRO;

// If direct access than exit the file.
defined( 'ABSPATH' ) || exit;

/**
 * Manages plugin assets.
 *
 * @since 2.12.15
 * @package SWPTLSPRO
 */
class Assets {

	/**
	 * Class constructor.
	 *
	 * @since 2.13.1
	 */
	public function __construct() {
		add_action( 'gswpts_export_dependency_backend', [ $this, 'tableExportDependencies' ] );
		add_action( 'gswpts_export_dependency_frontend', [ $this, 'exportDependencyScripts' ] );
		add_action( 'gswpts_export_dependency_frontend', [ $this, 'addResponsiveCss' ] );
		add_action( 'wp_head', [ $this, 'printCss' ] );
	}

	/**
	 * Load table export dependencies on the backend.
	 *
	 * @since 2.13.1
	 */
	public function tableExportDependencies() {
		wp_enqueue_script(
			'GSWPTS-buttons',
			SWPTLS_PRO_BASE_URL . 'assets/public/common/DataTables/buttons.min.js',
			[ 'jquery' ],
			SWPTLS_PRO_VERSION,
			true
		);

		wp_enqueue_script(
			'GSWPTS-buttons-flash',
			SWPTLS_PRO_BASE_URL . 'assets/public/common/DataTables/button-flesh.min.js',
			[ 'jquery' ],
			SWPTLS_PRO_VERSION,
			true
		);

		wp_enqueue_script(
			'GSWPTS-jszip',
			SWPTLS_PRO_BASE_URL . 'assets/public/common/DataTables/jszip.min.js',
			[ 'jquery' ],
			SWPTLS_PRO_VERSION,
			true
		);

		wp_enqueue_script(
			'GSWPTS-vfs_fonts',
			SWPTLS_PRO_BASE_URL . 'assets/public/common/DataTables/vfs_fonts.js',
			[ 'jquery' ],
			SWPTLS_PRO_VERSION,
			true
		);

		wp_enqueue_script(
			'GSWPTS-buttons-html5',
			SWPTLS_PRO_BASE_URL . 'assets/public/common/DataTables/buttons.html5.min.js',
			[ 'jquery' ],
			SWPTLS_PRO_VERSION,
			true
		);

		wp_enqueue_script(
			'GSWPTS-buttons-print',
			SWPTLS_PRO_BASE_URL . 'assets/public/common/DataTables/buttons.print.min.js',
			[ 'jquery' ],
			SWPTLS_PRO_VERSION,
			true
		);
	}

	/**
	 * Load table export dependencies on the frontend.
	 *
	 * @since 2.13.1
	 */
	public function exportDependencyScripts() {
		wp_enqueue_script(
			'buttons.min.js',
			SWPTLS_PRO_BASE_URL . 'assets/public/common/DataTables/buttons.min.js',
			[ 'jquery' ],
			'1.10.22',
			true
		);

		wp_enqueue_script(
			'jszip.min.js',
			SWPTLS_PRO_BASE_URL . 'assets/public/common/DataTables/jszip.min.js',
			[ 'jquery' ],
			'3.1.3',
			true
		);

		wp_enqueue_script(
			'vfs_fonts.js',
			SWPTLS_PRO_BASE_URL . 'assets/public/common/DataTables/vfs_fonts.js',
			[ 'jquery' ],
			'3.1.3',
			true
		);

		wp_enqueue_script(
			'buttons.html5.min.js',
			SWPTLS_PRO_BASE_URL . 'assets/public/common/DataTables/buttons.html5.min.js',
			[ 'jquery' ],
			'1.3.3',
			true
		);

		wp_enqueue_script(
			'buttons.print.min.js',
			SWPTLS_PRO_BASE_URL . 'assets/public/common/DataTables/buttons.print.min.js',
			[ 'jquery' ],
			'1.3.3',
			true
		);
	}

	/**
	 * Load responsive css.
	 *
	 * @since 2.13.1
	 */
	public function addResponsiveCss() {
		wp_enqueue_style(
			'GSWPTS-table-responsive',
			SWPTLS_PRO_BASE_URL . 'assets/public/styles/frontend.min.css',
			[],
			SWPTLS_PRO_VERSION,
			'all'
		);
	}

	/**
	 * Print custom css on the head.
	 *
	 * @since 2.13.1
	 */
	public function printCss() {
		$css = get_option( 'css_code_value' );

		if ( $css ) {
			printf( '<style>%s</style>', esc_html( $css ) );
		}
	}
}