<?php
/**
 * Handles plugin table caching.
 *
 * @since 3.0.0
 * @package SWPTLSPRO
 */

namespace SWPTLSPRO;

// If direct access than exit the file.
defined( 'ABSPATH' ) || exit;
/**
 * Manages plugin Cache.
 *
 * @since 2.12.15
 * @package SWPTLSPRO
 */
class Cache {

	/**
	 * Get sheet last updated timestamp.
	 *
	 * @param  string $sheet_id The sheet ID.
	 * @return mixed
	 */
	public function get_last_sheet_updated_timestamp( string $sheet_id ) {
		$url = 'https://script.google.com/macros/s/AKfycbxFQqs02vfk887crE4jEK_i9SXnFcaWYpb9qNnvDZe09YL-DmDkFqVELaMB2F7EhzXeFg/exec';
		$args = [
			'timeout' => 10, // Set a reasonable timeout value.
			'headers' => [
				'Content-Type' => 'application/json',
			],
			'body'    => [
				'sheetID' => $sheet_id,
				'action'  => 'lastUpdatedTimestamp',
			],
		];

		$response = wp_remote_get( $url, $args );

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		$body          = json_decode( wp_remote_retrieve_body( $response ) );

		if ( 200 !== $response_code || ! isset( $body->lastUpdatedTimestamp ) ) {
			return false;
		}

		return $body->lastUpdatedTimestamp;
	}

	/**
	 * Get last sheet updated time.
	 *
	 * @param  string $url The sheet url.
	 * @return string
	 */
	public function get_last_sheet_updated_time( string $url ): string {
		$sheet_id     = swptls()->helpers->get_sheet_id( $url );
		$updated_time = $this->get_last_sheet_updated_timestamp( $sheet_id );

		if ( ! $updated_time ) {
			return false;
		}

		return strtotime( $updated_time );
	}


	/**
	 * Set last updated time.
	 *
	 * @param int    $tableID The table ID.
	 * @param string $url The sheet url.
	 */
	public function set_last_updated_time( int $tableID, string $url ) {

		if ( ! $url ) {
			return false;
		}

		$lastUpdatedTimestamp = $this->get_last_sheet_updated_time( $url );

		if ( ! $lastUpdatedTimestamp ) {
			return false;
		}

		$option_key      = sprintf( 'gswpts_sheet_updated_time_%d', $tableID );
		$saved_timestamp = get_option( $option_key );

		if ( $saved_timestamp && ( $saved_timestamp !== $lastUpdatedTimestamp ) ) {
			update_option( $option_key, $lastUpdatedTimestamp );
		} else {
			update_option( $option_key, $lastUpdatedTimestamp );
		}
	}

	/**
	 * Save sheet data in transient.
	 *
	 * @param int    $tableID The table ID.
	 * @param string $sheetResponse The sheet data to save.
	 * @return void
	 */
	public function saveSheetData( int $tableID, $sheetResponse ) {
		set_transient( 'gswpts_sheet_data_' . $tableID . '', $sheetResponse, ( time() + 86400 * 30 ), '/' );
	}

	/**
	 * Get the data from transient.
	 *
	 * @param int $table_id The table id.
	 * @return mixed
	 */
	public function get_saved_sheet_data( int $table_id ) {
		$transient_key = sprintf( 'gswpts_sheet_data_%d', $table_id );
		$saved         = get_transient( $transient_key ) ? get_transient( $transient_key ) : null;

		if ( ! $saved ) {
			$table     = swptls()->database->table->get( $table_id );
			$sheet_id  = swptls()->helpers->get_sheet_id( $table['source_url'] );
			$sheet_gid = swptls()->helpers->get_grid_id( $table['source_url'] );
			$response  = swptls()->helpers->get_csv_data( $table['source_url'], $sheet_id, $sheet_gid );

			// Save sheet data to local storage.
			$this->saveSheetData( $table_id, $response );

			// Update the last updated time.
			$this->set_last_updated_time( $table_id, $table['source_url'] );

			return $response;
		}

		return $saved;
	}

	/**
	 * Checks if the sheet has any changes.
	 *
	 * @param  int    $table_id The table id.
	 * @param  string $url The sheet url.
	 * @return boolean
	 */
	public function is_updated( int $table_id, string $url ): bool {
		$updated_timestamp = $this->get_last_sheet_updated_time( $url );
		$saved_timestamp   = get_option( sprintf( 'gswpts_sheet_updated_time_%s', $table_id ) );

		return $saved_timestamp !== $updated_timestamp;
	}

	/**
	 * Get saved sheet styles.
	 *
	 * @param  int    $table_id The table id.
	 * @param  string $sheet_url The sheet url.
	 * @return mixed
	 */
	public function getSavedSheetStyles( int $table_id, string $sheet_url ) {
		$table_id = absint( $table_id );
		$sheet_id = swptls()->helpers->get_sheet_id( $sheet_url );
		$sheet_gid = swptls()->helpers->get_grid_id( $sheet_url );

		$sheetStyles = null;

		$sheetStyles = get_transient( 'gswpts_sheet_styles_' . $table_id . '' ) ? get_transient( 'gswpts_sheet_styles_' . $table_id . '' ) : null;

		if ( ! $sheetStyles ) {
			$sheetStyles = swptlspro()->helpers->get_sheet_styles( $sheet_id, $sheet_gid );

			// Save sheet data to local storage.
			$this->saveSheetStyles( $table_id, $sheetStyles );
		}

		return $sheetStyles;
	}


	/**
	 * Get saved sheet styles.
	 *
	 * @param  int    $table_id The table id.
	 * @param  string $sheet_url The sheet url.
	 * @return mixed
	 */
	public function getSavedMergeStyles( int $table_id, string $sheet_url ) {
		$table_id = absint( $table_id );
		$sheet_id = swptls()->helpers->get_sheet_id( $sheet_url );
		$sheet_gid = swptls()->helpers->get_grid_id( $sheet_url );

		$sheetMergedata = null;

		$sheetMergedata = get_transient( 'gswpts_sheet_merged_' . $table_id . '' ) ? get_transient( 'gswpts_sheet_merged_' . $table_id . '' ) : null;

		if ( ! $sheetMergedata ) {
			$sheetMergedata = swptlspro()->helpers->get_merged_styles( $sheet_id, $sheet_gid );

			// Save sheet merge data to local storage.
			$this->saveMergedStyles( $table_id, $sheetMergedata );
		}

		return $sheetMergedata;
	}


	/**
	 * Save the table styles in WordPress transient.
	 *
	 * @param  int    $tableID The table ID.
	 * @param  string $sheetStyles The sheet styles.
	 * @return void
	 */
	public function saveSheetStyles( int $tableID, $sheetStyles ) {
		set_transient( 'gswpts_sheet_styles_' . $tableID . '', $sheetStyles, ( time() + 86400 * 30 ), '/' );
	}


	/**
	 * Save the table merge in WordPress transient.
	 *
	 * @param  int    $tableID The table ID.
	 * @param  string $sheetMergedata The sheet merge data.
	 * @return void
	 */
	public function saveMergedStyles( int $tableID, $sheetMergedata ) {
		set_transient( 'gswpts_sheet_merged_' . $tableID . '', $sheetMergedata, ( time() + 86400 * 30 ), '/' );
	}


	/**
	 * @param int        $tableID
	 * @param $imagesData
	 */
	public function saveSheetImages( int $tableID, $imagesData ) {
		set_transient( 'gswpts_sheet_images_' . $tableID . '', $imagesData, ( time() + 86400 * 30 ), '/' );
	}

	/**
	 * @param int $tableID
	 * @param $linkData
	 */
	public function saveSheetLink( int $tableID, $linkData ) {
		set_transient( 'gswpts_sheet_link_' . $tableID . '', $linkData, ( time() + 86400 * 30 ), '/' );
	}

	/**
	 * @param  $args
	 * @return mixed
	 */
	public function getSavedSheetImages( $table_id, $sheet_url ) {
		$imagesData = null;

		$imagesData = get_transient( 'gswpts_sheet_images_' . $table_id . '' ) ? get_transient( 'gswpts_sheet_images_' . $table_id . '' ) : null;

		if ( ! $imagesData ) {
			$sheet_id = swptls()->helpers->get_sheet_id( $sheet_url );
			$sheet_gid = swptls()->helpers->get_grid_id( $sheet_url );
			$imagesData = swptlspro()->helpers->get_images_data( $sheet_id, $sheet_gid );

			// save sheet data to local storage
			$this->saveSheetImages( $table_id, $imagesData );
			// update the last updated time
			$this->set_last_updated_time( $table_id, $sheet_url );
		}

		return $imagesData;
	}
	

	/**
	 * @param  $args
	 * @return mixed
	 */
	public function getSavedSheetLinkStyles( $table_id, $sheet_url ) {
		$linkData = null;

		$linkData = get_transient( 'gswpts_sheet_link_' . $table_id . '' ) ? get_transient( 'gswpts_sheet_link_' . $table_id . '' ) : null;

		if ( ! $linkData ) {
			$sheet_id = swptls()->helpers->get_sheet_id( $sheet_url );
			$sheet_gid = swptls()->helpers->get_grid_id( $sheet_url );
			$linkData = swptlspro()->helpers->get_links_data( $sheet_id, $sheet_gid );

			// save sheet data to local storage
			$this->saveSheetLink( $table_id, $linkData );
			// update the last updated time
			$this->set_last_updated_time( $table_id, $sheet_url );
		}

		return $linkData;
	}
}