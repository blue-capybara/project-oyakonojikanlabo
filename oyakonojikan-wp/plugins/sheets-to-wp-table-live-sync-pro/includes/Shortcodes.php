<?php
/**
 * Registering WordPress shortcode for the plugin.
 *
 * @since 2.12.15
 * @package SWPTLS
 */

namespace SWPTLSPRO;

// If direct access than exit the file.
defined( 'ABSPATH' ) || exit;

/**
 * Responsible for registering shortcode.
 *
 * @since 2.12.15
 * @package SWPTLS
 */
class Shortcodes {

	/**
	 * Class constructor.
	 *
	 * @since 2.12.15
	 */
	public function __construct() {
		add_shortcode( 'gswpts_tab', [ $this, 'display' ] );
	}


	/**
	 * Displays table data.
	 *
	 * @param  array $atts The table data attributes.
	 * @return HTML
	 */
	public function display( $atts ) {
		$output = '<h5><b>' . __( 'Tab maybe deleted or can\'t be displayed.', 'sheetstowptable' ) . '</b></h5><br>';

		$id  = absint( $atts['id'] );
		$tab = swptlspro()->helpers->swptls_escape_list_item( swptlspro()->tabs->getTabByID([
			'id'                => $id,
			'include_bootstrap' => false,
			'isShortcode'       => true
		]));

		if ( ! $tab ) {
			return $output;
		}

		$output = '<div class="create_tab_content">';
			$output .= $tab;
		$output .= '</div>';

		return $output;
	}
}