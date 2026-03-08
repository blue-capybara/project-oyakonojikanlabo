<?php
/**
 * Responsible for managing ajax endpoints.
 *
 * @since 2.12.15
 * @package SWPTLS
 */

namespace SWPTLSPRO\Ajax;

// If direct access than exit the file.
defined( 'ABSPATH' ) || exit;

/**
 * Responsible for handling table operations.
 *
 * @since 2.12.15
 * @package SWPTLS
 */
class Tabs {

	/**
	 * Class constructor.
	 *
	 * @since 2.12.15
	 */
	public function __construct() {
		add_action( 'wp_ajax_gswpts_tab_changes', [ $this, 'tabChanges' ] );
		add_action( 'wp_ajax_gswpts_manage_tab', [ $this, 'manage_tabs' ] );

		add_action( 'wp_ajax_swptls_create_tab', [ $this, 'create' ] );
		add_action( 'wp_ajax_swptls_get_tab', [ $this, 'get' ] );
		add_action( 'wp_ajax_swptls_delete_tab', [ $this, 'delete' ] );
		add_action( 'wp_ajax_swptls_save_tab', [ $this, 'save' ] );
		add_action( 'wp_ajax_swptls_get_tabs', [ $this, 'get_all' ] );
		add_action( 'wp_ajax_swptls_copy_tab', [ $this, 'copy_tab' ] );
	}

	/**
	 * Get all tabs.
	 *
	 * @since 3.0.0
	 */
	public function get_all() {
		if ( ! wp_verify_nonce( $_POST['nonce'], 'swptls-admin-app-nonce-action' ) ) {
			wp_send_json_error([
				'message' => __( 'Invalid nonce.', '' )
			]);
		}

		$tables = swptls()->database->table->get_all();
		$tabs = swptlspro()->database->tab->get_all();

		wp_send_json_success([
			'tabs'         => $tabs,
			'tabs_count'   => count( $tabs ),
			'tables'       => $tables,
			'tables_count' => count( $tables )
		]);
	}

	/**
	 * Handles creating tabs.
	 *
	 * @since 3.0.0
	 */
	public function create() {
		if ( ! wp_verify_nonce( $_POST['nonce'], 'swptls-admin-app-nonce-action' ) ) {
			wp_send_json_error([
				'response_type' => 'invalid_action',
				'output'        => __( 'Action is invalid', 'sheetstowptable' )
			]);
		}

		$tab_data = ! empty( $_POST['tab'] ) ? json_decode( wp_unslash( $_POST['tab'] ), true ) : [];

		$data = [
			'tab_name'     => ! empty( $tab_data['tab_name'] ) ? sanitize_text_field( $tab_data['tab_name'] ) : __( 'Untitled', 'sheetstowptable' ),
			'show_name'    => wp_validate_boolean( $tab_data['show_name'] ),
			'reverse_mode' => false,
			'tab_settings' => wp_json_encode( $tab_data['tab_settings'] )
		];

		$response = swptlspro()->database->tab->insert( $data );

		wp_send_json_success([
			'type'   => 'saved',
			'id'     => absint( $response ),
			'output' => esc_html__( 'Tab saved successfully', 'sheetstowptable' )
		]);
	}

	/**
	 * Fetch tab by id.
	 *
	 * @since 3.0.0
	 */
	public function get() {
		if ( ! wp_verify_nonce( $_POST['nonce'], 'swptls-admin-app-nonce-action' ) ) {
			wp_send_json_error([
				'response_type' => 'invalid_action',
				'output'        => __( 'Action is invalid', 'sheetstowptable' )
			]);
		}

		$id = ! empty( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;

		if ( ! $id ) {
			wp_send_json_error([
				'message' => __( 'Invalid table to edit.', '' )
			]);
		}

		$tab = swptlspro()->database->tab->get( $id );

		if ( ! $tab ) {
			wp_send_json_error([
				'type'   => 'invalid_request',
				'output' => esc_html__( 'Request is invalid', 'sheetstowptable' )
			]);
		}

		if ( ! empty( $tab['tab_settings'] ) ) {
			$tab['tab_settings'] = json_decode( $tab['tab_settings'], true );
		} else {
			$tab['tab_settings'] = [];
		}

		wp_send_json_success([
			'id'  => absint( $id ),
			'tab' => $tab
		]);
	}

	/**
	 * Delete tab by id.
	 *
	 * @since 3.0.0
	 */
	public function delete() {
		if ( ! wp_verify_nonce( $_POST['nonce'], 'swptls-admin-app-nonce-action' ) ) {
			wp_send_json_error([
				'response_type' => 'invalid_action',
				'output'        => __( 'Action is invalid', 'sheetstowptable' )
			]);
		}

		$id = ! empty( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;

		if ( ! $id ) {
			wp_send_json_error([
				'message' => __( 'Invalid tab to delete.', '' )
			]);
		}

		$tab = swptlspro()->database->tab->delete( $id );

		wp_send_json_success([
			'message'      => __( 'Successfully deleted.', '' ),
			'updated_tabs' => swptlspro()->database->tab->get_all()
		]);
	}

	/**
	 * Save tab.
	 *
	 * @since 3.0.0
	 */
	public function save() {
		if ( ! wp_verify_nonce( $_POST['nonce'], 'swptls-admin-app-nonce-action' ) ) {
			wp_send_json_error([
				'response_type' => 'invalid_action',
				'output'        => __( 'Action is invalid', 'sheetstowptable' )
			]);
		}

		$tab = ! empty( $_POST['tab'] ) ? json_decode( wp_unslash( $_POST['tab'] ), true ) : false;

		if ( ! $tab ) {
			wp_send_json_error([
				'response_type' => 'invalid_action',
				'output'        => __( 'Invalid data to save.', 'sheetstowptable' )
			]);
		}

		$response = swptlspro()->database->tab->update( $tab );

		wp_send_json_success([
			'message' => __( 'Tab updated successfully', 'sheetstowptable' )
		]);
	}

	/**
	 * Handle tab changes.
	 *
	 * @since 2.12.15
	 */
	public function tabChanges() {
		if ( ! wp_verify_nonce( $_POST['nonce'], 'swptls_tabs_nonce' ) ) {
			wp_send_json_error([
				'response_type' => 'invalid_action',
				'output'        => __( 'Action is invalid', 'sheetstowptable' )
			]);
		}

		// Sanitize the incoming data.
		$data = $this->sanitizeData( $_POST['fragments'] );

		if ( ! $data ) {
			wp_send_json_error([
				'response_type' => 'invalid_action',
				'output'        => __( 'Invalid data to save.', 'sheetstowptable' )
			]);
		}

		$action_type = sanitize_text_field( $_POST['type'] );

		switch ( $action_type ) {
			case 'create':
				$this->saveChanges( $data );
				break;
			case 'update':
				$this->updateChanges( $data );
				break;
			default:
				wp_send_json_error([
					'response_type' => 'invalid_action',
					'output'        => __( 'Action is invalid', 'sheetstowptable' )
				]);
		}
	}

	/**
	 * Handle save changes.
	 *
	 * @param array $data The data to save.
	 * @return void
	 */
	public function saveChanges( $data ) {
		$result = swptls()->database->save_tab_changes( $data );

		if ( $result ) {
			wp_send_json_success([
				'response_type' => 'success',
				'output'        => __( 'Data saved successfully', 'sheetstowptable' )
			]);
		} else {
			wp_send_json_error([
				'response_type' => 'error',
				'output'        => __( 'Database insertion error', 'sheetstowptable' )
			]);
		}
	}

	/**
	 * Handle update changes.
	 *
	 * @param array $data The data to updated with.
	 * @since 2.12.15
	 */
	public function updateChanges( $data ) {
		$response = swptls()->database->update_tab_changes( $data );

		if ( $response ) {
			wp_send_json_success([
				'response_type' => 'success',
				'output'        => __( 'Tab updated successfully', 'sheetstowptable' )
			]);
		} else {
			wp_send_json_error([
				'response_type' => 'error',
				'output'        => __( 'Could not update tabs.', 'sheetstowptable' )
			]);
		}
	}

	/**
	 * Prepare insertion string from given array data.
	 *
	 * @param array $data The data to prepare.
	 * @since 2.12.15
	 */
	public function prepare_data_before_save( $data ) {
		$array = [];

		foreach ( $data as $key => $singleTabData ) {
			$reverseMode = wp_validate_boolean( $singleTabData['reverseMode'] );
			$array[]     = "('" . esc_sql( $singleTabData['tabName'] ) . "','" . $reverseMode . "','" . esc_sql( wp_json_encode( $singleTabData['tabSettings'] ) ) . "')";
		}

		return implode( ',', $array );
	}

	/**
	 * Responsible for sanitizing data.
	 *
	 * @param  array $unSanitizedData The data to sanitize.
	 * @return array
	 */
	public function sanitizeData( array $unSanitizedData ) {
		return array_map(function ( $data ) {
			return is_array( $data ) ? $this->sanitizeData( $data ) : sanitize_text_field( $data );
		}, $unSanitizedData);
	}

	/**
	 * Responsible for managing tabs.
	 *
	 * @since 2.12.15
	 */
	public function manage_tabs() {
		if ( ! wp_verify_nonce( $_POST['nonce'], 'swptls_tabs_nonce' ) ) {
			wp_send_json_error([
				'output'        => __( 'Action is invalid', 'sheetstowptable' ),
				'response_type' => 'invalid_action'
			]);
		}

		$page_slug = sanitize_text_field( $_POST['page_slug'] );

		if ( ! $page_slug ) {
			wp_send_json_error([
				'output'        => __( 'Action is invalid', 'sheetstowptable' ),
				'response_type' => 'invalid_action'
			]);
		}

		$table_data = swptls()->database->tabTableData();
		$table_html = $this->table_html( $table_data );

		wp_send_json_success([
			'response_type' => 'success',
			'output'        => $table_html,
			'no_data'       => ! $table_data
		]);
	}


	/**
	 * Copy tab by id.
	 *
	 * @since 3.0.0
	 */
	public function copy_tab() {
		if ( ! wp_verify_nonce( $_POST['nonce'], 'swptls-admin-app-nonce-action' ) ) {
			wp_send_json_error([
				'response_type' => 'invalid_action',
				'output'        => __( 'Action is invalid', 'sheetstowptable' )
			]);
		}

		$id = ! empty( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;

		if ( ! $id ) {
			wp_send_json_error([
				'message' => __( 'Invalid tab to copied.', '' )
			]);
		}

		$tab = swptlspro()->database->tab->copied_table( $id );

		wp_send_json_success([
			'message'      => __( 'Successfully copied.', '' ),
			'updated_tabs' => swptlspro()->database->tab->get_all()
		]);
	}

	

	/**
	 * Populates table html.
	 *
	 * @param  object $table_data The table data from db.
	 * @return mixed
	 */
	public function table_html( $table_data ) {
		$table = '<table id="manage_tabs" class="ui celled table">
			<thead>
				<tr>
					<th class="text-center">
						<input data-show="false" type="checkbox" name="manage_tab_main_checkbox" id="manage_tab_checkbox">
					</th>
					<th class="text-center">' . esc_html__( 'Show Name', 'sheetstowptable' ) . '</th>
					<th class="text-center">' . esc_html__( 'Shortcode', 'sheetstowptable' ) . '</th>
					<th class="text-center">' . esc_html__( 'Tab Name', 'sheetstowptable' ) . '</th>
					<th class="text-center">' . esc_html__( 'Delete', 'sheetstowptable' ) . '</th>
				</tr>
			</thead>
		<tbody>';

		if ( $table_data ) {
			foreach ( $table_data as $key => $data ) {

				$checked = $data->show_name ? 'checked' : '';

				$table .= '
                <tr>
                    <td class="text-center" style="vertical-align: middle">
                        <input type="checkbox" value="' . esc_attr( $data->id ) . '" name="manage_tab_checkbox" class="manage_tab_checkbox">
                    </td>

                    <td class="text-center" style="vertical-align: middle">
                        <div class="ui toggle checkbox mt-2 manage_tab_name_toggle">
                            <input type="checkbox" name="public" ' . $checked . ' data-id="' . esc_attr( $data->id ) . '">
                            <label style="margin-bottom: 0"></label>
                        </div>
                    </td>

                    <td class="text-center" style="display: flex; justify-content: center; align-items: center; height: 35px;">
                            <input type="hidden" class="tab_copy_sortcode" value="[gswpts_tab id=' . esc_attr( $data->id ) . ']">
                            <span class="gswpts_tab_sortcode_copy" style="display: flex; align-items: center; white-space: nowrap; margin-right: 12px">[gswpts_tab id=' . esc_attr( $data->id ) . ']</span>
                            <i class="fas fa-copy gswpts_sortcode_copy" style="font-size: 20px;color: #b7b8ba; cursor: copy"></i>
                    </td>

                    <td class="text-center">
                        <div style="line-height: 38px;">

                            <div class="ui input tab_name_hidden">
                                <input type="text" class="tab_name_hidden_input" value="' . esc_attr( $data->tab_name ) . '" />
                            </div>

                            <a
                            style="margin-right: 5px; padding: 5px 15px;white-space: nowrap;"
                            class="tab_name"
                            href="' . esc_url( admin_url( 'admin.php?page=gswpts-manage-tab&subpage=create-tab&id=' . esc_attr( $data->id ) . '' ) ) . '">
                            ' . esc_html( $data->tab_name ) . '
                            </a>
                            <button type="button" value="edit" class="copyToken ui right icon button gswpts_edit_tab ml-1" id="' . esc_attr( $data->id ) . '" style="width: 50px;height: 38px;">
                                <img src="' . SWPTLS_BASE_URL . 'assets/public/icons/rename.svg" width="24px" height="15px" alt="rename-icon"/>
                            </button>
                        </div>
                    </td>

                    <td class="text-center">
						<button data-id="' . esc_attr( $data->id ) . '" id="tab-' . esc_attr( $data->id ) . '" class="negative ui button gswpts_tab_delete_btn">' . esc_html__( 'Delete', 'sheetstowptable' ) . ' &nbsp; <i class="fas fa-trash"></i>
						</button></td>
                </tr>';
			}
		}

		$table .= '</tbody>
		</table>';

		return $table;
	}
}