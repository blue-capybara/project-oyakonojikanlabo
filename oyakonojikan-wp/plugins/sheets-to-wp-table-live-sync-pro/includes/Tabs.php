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
 * Responsible for managing tab functions.
 *
 * @since 2.12.15
 * @package SWPTLS
 */
class Tabs {

	/**
	 * Contains tab id.
	 *
	 * @var mixed
	 */
	public $id;

	/**
	 * Contains included bootstrap flag.
	 *
	 * @var mixed
	 */
	public $include_bootstrap = true;

	/**
	 * Contains is shortcode flag.
	 *
	 * @var mixed
	 */
	public $isShortcode = false;

	/**
	 * Show all the tables as tab card
	 *
	 * @return mixed
	 */
	public function showTabCards() {

		$tables = swptls()->database->fetchTables();

		if ( ! $tables ) {
			return null;
		}

		$html = '';

		foreach ( $tables as $key => $table ) {
			$html .= '<div class="ui cards table_cards">';
				$html .= '<div class="card draggable" data-table_id="' . esc_attr( $table->id ) . '">
					<div class="content">
						<i class="fas fa-times card_remover"></i>

						<div class="description d-flex justify-content-center align-items-center">
							<strong>
								#' . esc_html( $table->id ) . ' ' . esc_html( $table->table_name ) . '
							</strong>
						</div>
					</div>
				</div>';
			$html .= '</div>';
		}

		return $html;
	}

	/**
	 * Check if the current page is create-tab page and also and also its a update page
	 *
	 * @param string $nonce The nonce value to verify.
	 * @return int|bool
	 */
	public function tabUpdatePage( $nonce ) {
		if ( ! wp_verify_nonce( $nonce, 'swptls_tabs_nonce' ) ) {
			wp_die( esc_html__( 'Invalid action', 'sheetstowptable' ) );
		}

		if ( ! isset( $_GET['page'], $_GET['subpage'], $_GET['id'] ) || 'gswpts-manage-tab' !== $_GET['page'] || ! $_GET['subpage'] || ! $_GET['id'] ) {
			return false;
		}

		return absint( sanitize_text_field( $_GET['id'] ) );
	}

	/**
	 * Get the html template by ID
	 *
	 * @param  array $args The tab arguments.
	 * @return null
	 */
	public function getTabByID( $args ) {
		if ( ! isset( $args['id'] ) || ! $args['id'] ) {
			return;
		}

		$this->id = $args['id'];

		if ( isset( $args['include_bootstrap'] ) ) {
			$this->include_bootstrap = $args['include_bootstrap'];
		}

		if ( ! $this->id ) {
			return;
		}

		$tab = swptlspro()->database->tab->get( $this->id );

		if ( ! $tab ) {
			return false;
		}

		$tabName = $tab['tab_name'];
		$reverseMode = $tab['reverse_mode'];
		$tabSettings = null !== json_decode( $tab['tab_settings'] ) ? json_decode( $tab['tab_settings'], true ) : unserialize( $tab['tab_settings'] );

		$col = 'col-12';

		if ( ! $this->include_bootstrap ) {
			$col = null;
		}

		$arrowPostion = null;
		$containerPostion = null;

		if ( $reverseMode ) {
			$arrowPostion = 'down';
			$containerPostion = 'reverse';
		}

		$tabNameHtml = '
            <div class="ui labeled tab_name_box">
                <div class="ui label">
                    ' . esc_html( $tabName ) . '
                </div>
                <span class="tab_positon_btn ' . esc_attr( $arrowPostion ) . '">
                    <i class="fas fa-arrow-up"></i>
                </span>
            </div>
        ';

		if ( $this->isShortcode ) {
			if ( $tab['show_name'] ) {
				$tabNameHtml = '
                <div class="ui labeled tab_name_box">
                    <h3 class="ui label">
                        ' . esc_html( $tabName ) . '
                    </h3>
                </div>
            ';
			} else {
				$tabNameHtml = null;
			}
		}

		$html = '';

		$html .= '<div class="tab_bottom_side ' . $col . '" data-tabID="' . esc_attr( $this->id ) . '">';
		if ( ! $reverseMode && wp_validate_boolean( $tab['show_name'] ) ) {
			$html .= $tabNameHtml;
		}
		$html .= '</div>';

			$html .= '<div class="tabs_container ' . esc_attr( $containerPostion ) . '">

					<ul class="tabs" role="tablist">
							' . $this->listItems( $tabSettings, $this->id ) . '
					</ul>

					<div class="tab_contents">
							' . $this->getTabContents( $tabSettings, $this->id ) . '
					</div>

			</div>';
		$html .= '</div>';
		if ( $reverseMode && wp_validate_boolean( $tab['show_name'] ) ) {
			$html .= $tabNameHtml;
		}

				return $html;
	}

	/**
	 * Get the li items of tab
	 *
	 * @param  array $tabSettings The tab settings.
	 * @param  int   $tabID       The tab ID.
	 * @return mixed
	 */
	public function listItems( array $tabSettings, $tabID ) {
		if ( count( $tabSettings ) < 1 ) {
			return;
		}

		$itemHtml = '';

		if ( empty( $tabSettings ) ) {
			return;
		}

		foreach ( $tabSettings as $key => $item ) {
			$checked = 0 === $key ? 'checked' : '';

			$itemHtml .= '
            <li>
                <input
					 	' . $checked . '	
						type="radio"
						name="tabs' . esc_attr( $tabID ) . '"
						id="tab-' . esc_attr( $tabID ) . '-' . esc_attr( $key ) . '"
						data-id="tab-content-' . esc_attr( $tabID ) . '-' . esc_attr( $key ) . '"
						class="tab_hidden_input"
					/>
                <label class="tab_name_label unselectable" for="tab-' . esc_attr( $tabID ) . '-' . esc_attr( $key ) . '" role="tab">
                    <span class="tab_page_name">' . ( $item['name'] ) . '</span>
                </label>
            </li>
        ';
		}

		return $itemHtml;
	}

	/**
	 * Get tab contents.
	 *
	 * @param  array $tabSettings The tab settings.
	 * @param  array $tabID The tab settings.
	 * @return mixed
	 */
	public function getTabContents( array $tabSettings, $tabID ) {
		if ( count( $tabSettings ) < 1 ) {
			return '
				<b class="demo_content">
					Tab content #
				</b>
			';
		}

		$itemHtml = '';

		$innerContent = null;

		foreach ( $tabSettings as $key => $item ) {
			$active = 0 === $key ? 'active' : '';

			$tableIDs = ! empty( $item['tableID'] ) ? $item['tableID'] : 0;
			$tabPageID = $item['id'];

			if ( ! $tableIDs ) {
				$innerContent = "<b class=\"demo_content\">
					Tab content # {$tabPageID}
				</b>";
			} else {
				$innerContent = $this->getTablesShortcode( $tableIDs, $item['id'] );
			}

			$itemHtml .= '
                <div id="tab-content-' . esc_attr( $tabID ) . '-' . esc_attr( $key ) . '" class="tab-content droppable ' . $active . '">
                    ' . $innerContent . '
                </div>
            ';
		}

		return $itemHtml;
	}

	/**
	 * Get table shortcode.
	 *
	 * @param  array $tableIDs  The table IDs.
	 * @param  int   $tabPageID The tab page ID.
	 * @return mixed
	 */
	public function getTablesShortcode( array $tableIds, $tabPageID ) {
		if ( count( $tableIds ) < 1 ) {
			return '
				<b class="demo_content">
					Tab content #' . esc_html( $tabPageID ) . '
				</b>
			';
		}

		$output = '';

		foreach ( $tableIds as $id ) {
			$output .= do_shortcode( '[gswpts_table id=' . absint( $id ) . ']' );
		}

		return $output;
	}

	/**
	 * Get the table card for the tab content.
	 *
	 * @param  array $tableIDs The table IDs.
	 * @param  int   $tabPageID The tab page ID.
	 * @return mixed
	 */
	public function getTableCards( array $tableIDs, $tabPageID ) {
		if ( count( $tableIDs ) < 1 ) {
			return '
            <b class="demo_content">
                Tab content #' . esc_html( $tabPageID ) . '
            </b>
        ';
		}

		$cardHtml = '';

		foreach ( $tableIDs as $key => $tableID ) {
			$cardHtml .= '
            <div class="card draggable ui-draggable ui-draggable-handle dragging" data-table_id="' . esc_attr( $tableID ) . '" style="z-index: 2; min-width: 230px;">

                <div class="content">
                    <i class="fas fa-times card_remover" style="display: block;margin: 6px 8px 0px 0px;"></i>

                    <div class="description d-flex justify-content-center align-items-center">
                        <strong>
                            #' . esc_html( $tableID ) . ' Table #2
                        </strong>
                    </div>
                </div>

            </div>
        ';
		}

		return $cardHtml;
	}
}