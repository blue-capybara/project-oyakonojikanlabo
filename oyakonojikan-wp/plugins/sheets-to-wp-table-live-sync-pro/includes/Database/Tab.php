<?php
/**
 * Managing database operations for tables.
 *
 * @since 3.0.0
 * @package SWPTLS
 */

namespace SWPTLSPRO\Database;

// If direct access than exit the file.
defined( 'ABSPATH' ) || exit;

/**
 * Manages plugin database operations.
 *
 * @since 3.0.0
 */
class Tab {

	/**
	 * Get the tab by its id value.
	 *
	 * @param  int $id The tab ID.
	 * @return mixed
	 */
	public function get( $id ) {
		global $wpdb;
		$table  = $wpdb->prefix . 'gswpts_tabs';
		$result = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table WHERE id=%d", absint( $id ) ), ARRAY_A ); // phpcs:ignore

		return $result;
	}

	/**
	 * Delete table data from the DB.
	 *
	 * @param string $table The table name.
	 * @param int    $id    The table id to delete.
	 * @return int|false
	 */
	public function delete( int $id ) {
		global $wpdb;
		$table = $wpdb->prefix . 'gswpts_tabs';

		return $wpdb->delete( $table, [ 'id' => $id ], [ '%d' ] );
	}


	/**
	 * Copied table data from the DB.
	 *
	 * @param int $id  The table id to copied.
	 * @return int|false
	 */
	public function copied_table( int $id ) {
		global $wpdb;
		$table = $wpdb->prefix . 'gswpts_tabs';

		// Retrieve the row with the given ID
		$original_row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM $table WHERE id = %d",
				$id
			),
			ARRAY_A // Return as associative array.
		);

		if ( null === $original_row ) {
			return new WP_Error( 'no_row_found', 'No row found with the given ID' );
		}

		// Modify the tab_name.
		$original_row['tab_name'] = 'copy of ' . $original_row['tab_name'];

		// Remove the id field to insert a new row.
		unset($original_row['id']);

		// Insert the modified row back into the table.
		$inserted = $wpdb->insert(
			$table,
			$original_row
		);

		if ( false === $inserted ) {
			return new WP_Error( 'insert_failed', 'Failed to insert the copied row' );
		}

		return $wpdb->insert_id;
	}
	

	/**
	 * Responsible for handling table data.
	 *
	 * @return mixed
	 */
	public function get_all() {
		global $wpdb;
		$table = $wpdb->prefix . 'gswpts_tabs';

		return $wpdb->get_results( "SELECT * FROM $table" ); //phpcs:ignore
	}

	/**
	 * Saves tab changes by given data.
	 *
	 * @param string $data The data to insert.
	 * @since 2.12.15
	 */
	public function insert( $data ) {
		global $wpdb;

		$table  = $wpdb->prefix . 'gswpts_tabs';
		$format = [ '%s', '%s', '%s', '%s' ];

		$wpdb->insert( $table, $data, $format );
		return $wpdb->insert_id;
	}

	/**
	 * Updates tab changes by given data.
	 *
	 * @param array $data The data to insert.
	 * @return int|false
	 */
	public function update( $data ) {
		global $wpdb;
		$table = $wpdb->prefix . 'gswpts_tabs';

		$response = $wpdb->update(
			$table,
			[
				'tab_name'     => sanitize_text_field( $data['tab_name'] ),
				'show_name'    => wp_validate_boolean( $data['show_name'] ),
				'reverse_mode' => wp_validate_boolean( $data['reverse_mode'] ),
				'tab_settings' => wp_json_encode( $data['tab_settings'] )

			],
			[ 'id' => absint( $data['id'] ) ],
			[ '%s', '%d', '%d', '%s' ],
			[ '%d' ]
		);

		return $response;
	}

	/**
	 * Update tab name.
	 *
	 * @param  int    $id The tab id.
	 * @param  string $name The tab name.
	 * @return int|false
	 */
	public function update_name( $id, $name ) {
		global $wpdb;
		$table = $wpdb->prefix . 'gswpts_tabs';

		$response = $wpdb->update(
			$table,
			[ 'show_name' => $name ],
			[ 'id' => $id ],
			[ '%d' ],
			[ '%d' ]
		);

		return $response;
	}
}