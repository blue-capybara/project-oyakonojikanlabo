<?php
/**
 * Responsible for managing plugin notices.
 *
 * @since   2.13.1
 * @package SWPTLSPRO
 */

namespace SWPTLSPRO;

// If direct access than exit the file.
defined( 'ABSPATH' ) || exit;

/**
 * Manages notices.
 *
 * @since 2.13.1
 */
class Notices {

	/**
	 * Display's base plugin missing notice.
	 *
	 * @since 2.13.1
	 */
	public function base_plugin_notice() {
		$link = sprintf(
			'<b><a href="%s">%s</a></b>',
			esc_url( self_admin_url( 'plugin-install.php?s=Sheets+to+WP+Table+Live+Sync+WPPOOL&tab=search&type=term' ) ),
			esc_html__( 'FlexTable', 'sheetstowptable-pro' )
		);

		printf(
			'<div class="notice notice-error is-dismissible">
				<h3><strong>%s %s </strong></h3>
				<p>%s</p>
			</div>',
			esc_html( 'FlexTable Pro' ),
			esc_html__( 'Plugin', 'sheetstowptable-pro' ),
			wp_kses_post(
				wp_sprintf(
					// translators: %s: The plugin installation link.
					__( 'cannot be activated - requires the base plugin %s to be activated. ', 'sheetstowptable-pro' ),
					$link
				)
			)
		);
	}


	/**
	 * Display legacy plugin notice.
	 *
	 * @since 2.14.0
	 */
	public function legacy_plugin_notice() {
		$link = sprintf(
			'<b><a href="%s">%s</a></b>',
			esc_url( self_admin_url( 'plugin-install.php?s=Sheets+to+WP+Table+Live+Sync+WPPOOL&tab=search&type=term' ) ),
			esc_html__( 'FlexTable', 'sheetstowptable-pro' )
		);

		printf(
			'<div class="notice notice-error is-dismissible">
				<h3><strong>%s %s </strong></h3>
				<p>%s</p>
			</div>',
			esc_html( 'FlexTable Pro' ),
			esc_html__( 'Plugin', 'sheetstowptable-pro' ),
			wp_kses_post(
				wp_sprintf(
					// translators: %s: The plugin installation link.
					__( 'cannot be activated - requires the base plugin %s needs to be updated. ', 'sheetstowptable-pro' ),
					$link
				)
			)
		);
	}

	/**
	 * Display license activation message notice.
	 *
	 * @return void
	 */
	public function licenseNotice() {
		$link = sprintf( '<strong style="font-size: 15px;"><a href="%s">Here</a></strong>', esc_url( admin_url( 'admin.php?page=sheets_to_wp_table_live_sync_pro_settings' ) ) );

		printf('
			<div class="notice notice-info">
				<p><strong>%s</strong></p>
				<p>%s</p>
			</div>',
			esc_html__( 'FlexTable Pro License is not activated.', '' ),
			wp_kses_post(
				// translators: %s: The license activation link.
				wp_sprintf( __( 'Please activate the Pro plugin by entering a valid license %s', 'sheetstowptable-pro' ), $link )
			)
		);
	}

	/**
	 * Display's notice for php version warning.
	 *
	 * @return void
	 */
	public function show_notice() {
		printf(
			'<div class="notice notice-error is-dismissible"><h3><strong>%s %s </strong></h3><p>%s</p></div>',
			esc_html( 'FlexTable Pro' ),
			esc_html__( 'Plugin', 'sheetstowptable-pro' ),
			esc_html__( 'cannot be activated - requires at least PHP 5.4. Plugin automatically deactivated.', 'sheetstowptable-pro' )
		);
	}
}