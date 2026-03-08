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
class Helpers {

	/**
	 * Checks for if the base plugin is installed.
	 *
	 * @return boolean
	 */
	public function isBasePluginActive(): bool {
		return defined( 'SWPTLS_PLUGIN_FILE' );
	}

	/**
	 * Checks for the plugin legacy.
	 *
	 * @return boolean
	 */
	public function check_for_legacy_plugin() {
		return defined( 'GSWPTS_VERSION' );
	}

	/**
	 * Checks for php version.
	 *
	 * @since 2.12.15
	 */
	public function version_check() {
		return version_compare( PHP_VERSION, '5.4' ) < 0;
	}

	/**
	 * Retrieve sheet styles.
	 *
	 * @param string $sheet_id The sheet id.
	 * @param int    $gid The sheet gid.
	 * @return mixed
	 */
	public function get_sheet_styles( string $sheet_id, int $gid ) {
		if ( empty( $sheet_id ) || '' === $gid ) {
			return new \WP_Error( 'feature_not_compatible', __( 'The feature is not compatible or something went wrong', '' ) );
		}

		// Retrieve the timeout value from the options table or set it to 30 if not defined.
		$timeout = get_option( 'timeout_values', 10 );
		$timeout = !empty( $timeout ) ? (int) $timeout : 30; 
		$args = array(
			'timeout' => $timeout,
		);
		
		$url = sprintf( 'https://script.google.com/macros/s/AKfycbz2lB2sri2hRmzITLtvtP0BdE-mYjXiz1WyGEeqpsEA_evkc6M8vxh7qHbeuDheDtXlAA/exec?sheetID=%1$s&gID=%2$d&action=getStyles', $sheet_id, $gid );

		
		
		$response = wp_remote_get( $url, $args );

		if ( is_wp_error( $response ) ) {
			return '';
		}

		$code     = wp_remote_retrieve_response_code( $response );
		$body     = wp_remote_retrieve_body( $response );

		return 200 === $code ? json_decode( $body, true ) : $response;
	}

	/**
	 * Retrieve merged styles.
	 *
	 * @param string $sheet_id The sheet id.
	 * @param int    $gid The sheet gid.
	 * @return mixed
	 */

	public function get_merged_styles( string $sheet_id, int $gid ) {
		if ( empty( $sheet_id ) || '' === $gid ) {
			return new \WP_Error( 'feature_not_compatible', __( 'The feature is not compatible or something went wrong', '' ) );
		}

		// Retrieve the timeout value from the options table or set it to 30 if not defined.
		$timeout = get_option( 'timeout_values', 10 );
		$timeout = !empty( $timeout ) ? (int) $timeout : 30; 
		$args = array(
			'timeout' => $timeout,
		);

		$url = sprintf( 'https://script.google.com/macros/s/AKfycbz2lB2sri2hRmzITLtvtP0BdE-mYjXiz1WyGEeqpsEA_evkc6M8vxh7qHbeuDheDtXlAA/exec?sheetID=%1$s&gID=%2$d&action=getMergedCells', $sheet_id, $gid );

		$response = wp_remote_get( $url, $args );

		if ( is_wp_error( $response ) ) {
			return '';
		}

		$code     = wp_remote_retrieve_response_code( $response );
		$body     = wp_remote_retrieve_body( $response );

		return 200 === $code ? json_decode( $body, true ) : $response;
	}


	/**
	 * Loads data based on the condition.
	 *
	 * @param string $sheet_url    The condition sheet_url.
	 * @param int    $table_id The table table_id.
	 * @param bool   $editor_mode The table editor.
	 * @return mixed
	 */

	 public function load_table_data(string $sheet_url, int $table_id, $editor_mode = false) {
		$response = [];
		$tableId = absint($table_id);
		$table = swptls()->database->table->get($tableId);
	
		// Decode JSON settings.
		$tableSettings = !empty($table['table_settings']) ? json_decode(wp_unslash($table['table_settings']), true) : [];
		$tableCache = isset($tableSettings['table_cache']) ? wp_validate_boolean($tableSettings['table_cache']) : false;
		$import_styles = isset($tableSettings['import_styles']) ? wp_validate_boolean($tableSettings['import_styles']) : false;
		
		$merged_support = isset($tableSettings['merged_support']) ? wp_validate_boolean($tableSettings['merged_support']) : false; 

		$table_img_support = isset($tableSettings['table_img_support']) ? wp_validate_boolean($tableSettings['table_img_support']) : false;
		$table_link_support = isset($tableSettings['table_link_support']) ? wp_validate_boolean($tableSettings['table_link_support']) : false;
	
		$sheet_id = swptls()->helpers->get_sheet_id($sheet_url);
		$sheet_gid = swptls()->helpers->get_grid_id($sheet_url);
	
		// Helper functions to get data.
		$getCSVData = function () use ($sheet_url, $sheet_id, $sheet_gid) {
			return swptls()->helpers->get_csv_data($sheet_url, $sheet_id, $sheet_gid);
		};

		if ($import_styles) {
			$getSheetStyles = function () use ($sheet_id, $sheet_gid) {
				return $this->get_sheet_styles($sheet_id, $sheet_gid);
			};
		}
		if ($merged_support) {
			$getMergedStyle = function () use ($sheet_id, $sheet_gid) {
				return $this->get_merged_styles($sheet_id, $sheet_gid);
			};
		}

		if ($table_img_support) {
			$getImagesData = function () use ($sheet_id, $sheet_gid) {
				return $this->get_images_data($sheet_id, $sheet_gid);
			};
		}

		if ($table_link_support) {
			$getLinksData = function () use ($sheet_id, $sheet_gid) {
				return $this->get_links_data($sheet_id, $sheet_gid);
			};
		}	
	
		/**
		 * Cache not active: Direct fetch data from Google Sheets. 
		 */
		
		if (!$tableCache) {

			$response['sheet_data'] = $getCSVData();

			if ($import_styles) {
				$response['sheet_styles'] = $getSheetStyles();
			}
			if ($merged_support) {
				$response['sheet_merged_data'] = $getMergedStyle();
			}
			

			if ($table_img_support) {
				$response['sheet_images'] = $getImagesData();
			}
			if ($table_link_support) {
				$response['sheet_links'] = $getLinksData();
			}
			
			return $response;
		}
	
		$isSheetUpdated = swptlspro()->cache->is_updated($tableId, $sheet_url);
		$isUrlUpdated = esc_url($sheet_url) !== esc_url($table['source_url']);
	
		if ($isSheetUpdated || $editor_mode) {
			swptlspro()->cache->set_last_updated_time($tableId, $sheet_url);
	
			// Get and cache data.
			$csv_data = $getCSVData();
			$response['sheet_data'] = $csv_data;
			swptlspro()->cache->saveSheetData($tableId, $csv_data);
	
			if ($import_styles) {
				$sheet_styles = $getSheetStyles();
				$response['sheet_styles'] = $sheet_styles;
				swptlspro()->cache->saveSheetStyles($tableId, $sheet_styles);
			}

			if ($merged_support) {
				$sheet_merged_data = $getMergedStyle();
				$response['sheet_merged_data'] = $sheet_merged_data;
				swptlspro()->cache->saveMergedStyles($tableId, $sheet_merged_data);
			}
	
			if ($table_img_support) {
				$sheet_images = $getImagesData();
				$response['sheet_images'] = $sheet_images;
				swptlspro()->cache->saveSheetImages($tableId, $sheet_images);
			}

			if ($table_link_support) {
				$sheet_links = $getLinksData();
				$response['sheet_links'] = $sheet_links;
				swptlspro()->cache->saveSheetLink($tableId, $sheet_links);
			}

			return $response;
		}
	
		// Retrieve cached data.
		$response['sheet_data'] = swptlspro()->cache->get_saved_sheet_data($tableId, $sheet_url);
		
		if ($import_styles) {
			$response['sheet_styles'] = swptlspro()->cache->getSavedSheetStyles($tableId, $sheet_url);
		}
		if ($merged_support) {
			$response['sheet_merged_data'] = swptlspro()->cache->getSavedMergeStyles($tableId, $sheet_url);
		}
		
		if ($table_img_support) {
			$response['sheet_images'] = swptlspro()->cache->getSavedSheetImages($tableId, $sheet_url, $sheet_gid);
		}
		if ($table_link_support) {
			$response['sheet_links'] = swptlspro()->cache->getSavedSheetLinkStyles($tableId, $sheet_url, $sheet_gid);
		}

		return $response;
	}

	/**
	 * Loads data based on the condition.
	 *
	 * @param int $sheet_id  The condition arguments.
	 * @param int $sheet_gid The condition arguments.
	 *
	 * @return mixed
	 */
	public function loadStylesByCondition( $sheet_id, $sheet_gid ) {
		$response = $this->get_sheet_styles( $sheet_id, $sheet_gid );

		// Organize the sheet styles as an object.
		if ( $response ) {
			$response = [
				'bgColors'             => property_exists( $response, 'bgColors' ) ? $response->bgColors : '',
				'fontColors'           => property_exists( $response, 'fontColors' ) ? $response->fontColors : '',
				'fontFamily'           => property_exists( $response, 'fontFamily' ) ? $response->fontFamily : '',
				'fontSize'             => property_exists( $response, 'fontSize' ) ? $response->fontSize : '',
				'fontWeights'          => property_exists( $response, 'fontWeights' ) ? $response->fontWeights : '',
				'fontStyles'           => property_exists( $response, 'fontStyles' ) ? $response->fontStyles : '',
				'textDecoration'       => property_exists( $response, 'textDecoration' ) ? $response->textDecoration : '',
				'horizontalAlignments' => property_exists( $response, 'horizontalAlignments' ) ? $response->horizontalAlignments : ''
			];
		}

		return $response;
	}

	/**
	 * Return css inline style so that it can be added as inline style value
	 *
	 * @param  mixed $style Embedded cell style.
	 * @return mixed
	 */
	
	public function embedCellStyle($style) {
		$styleText = '';
	
		// Define style properties and their corresponding keys in $style.
		$styleProperties = [
			'bgColors' => 'background-color',
			'fontColors' => 'color',
			'fontFamily' => 'font-family',
			'fontSize' => function ($value) {
				return 'font-size: ' . (intval($value) + 7) . 'px;';
			},
			'fontWeights' => 'font-weight',
			'fontStyles' => 'font-style',
			// 'textDecoration' => 'text-decoration',
		];
	
		foreach ($styleProperties as $styleKey => $cssProperty) {
			if (!empty($style[$styleKey])) {
				$value = $style[$styleKey][$style['rowIndex']][$style['cellIndex']];
				if (is_callable($cssProperty)) {
					// Handle font-size separately.
					$styleText .= call_user_func($cssProperty, $value);
				} else {
					$styleText .= $cssProperty . ': ' . $value . ';';
				}
			}
		}
	
		// Handle horizontal alignment separately.
		if (!empty($style['horizontalAlignments'])) {
			$styleText .= 'text-align: ' . $this->getCellAlignment($style['horizontalAlignments'][$style['rowIndex']][$style['cellIndex']]) . ';';
		}
	
		return $styleText;
	}

	/**
	 * Performs format cells.
	 *
	 * @return mixed
	 */
	public function embedCellFormatClass(): string {
		return 'expanded_style';
	}

	/**
	 * Get cell alignment.
	 *
	 * @param string $alignment The cell alignment.
	 * @return string The corresponding CSS text-align property.
	 */
	public function getCellAlignment( string $alignment ): string {
		switch ( strtolower( $alignment ) ) {
			case 'general-right':
			case 'right':
				return 'right';
			case 'General-left':
			case 'left':
				return 'left';
			case 'center':
				return 'center';
			default:
				return 'left';
		}
	}

	/**
	 * Transform boolean values based on the sheet logic.
	 *
	 * @param  string $cellValue The cell value.
	 * @return string
	 */
	public function transformBooleanValues( $cellValue ) {
		$filteredCellValue = '';

		switch ( $cellValue ) {
			case 'TRUE':
				$filteredCellValue = '&#10004;';
				break;
			case 'FALSE':
				$filteredCellValue = '&#10006;';
				break;
			default:
				$filteredCellValue = $cellValue;
				break;
		}

		return $filteredCellValue;
	}

	/**
	 * Transform boolean values based on the sheet logic.
	 *
	 * @param  string $cellValue The cell value.
	 * @return string
	 */
	public function transformCheckboxValues( $cellValue ) {
		$class_name = '';
		$is_checked = '';
		$hidden_value = '0';
	
		// Determine the values based on the cell value.
		switch ( $cellValue ) {
			case 'TRUE':
				$class_name = 'checked';       // Add 'checked' class for true.
				$is_checked = 'checked';       // Set the checkbox as checked.
				$hidden_value = '1';           // Set hidden value to '1'.
				break;
			case 'FALSE':
				$class_name = 'unchecked';     // Add 'unchecked' class for false.
				$is_checked = '';              // Checkbox is not checked.
				$hidden_value = '0';           // Set hidden value to '0'.
				break;
			default:
				// For other values, return the cell value as is.
				return $cellValue;
		}
	
		// Return the constructed HTML for the checkbox and hidden value.
		return '<input type="checkbox" class="flexsync-checkbox flexsync-pro ' . $class_name . '" ' . $is_checked . '>'
			 . '<p style="visibility: hidden; display: none;">' . $hidden_value . '</p>';
	}


	/**
	 * Transforms links.
	 *
	 * @param  array  $matchedLink The matched links.
	 * @param  string $string The url.
	 * @param  string $linkText The link text.
	 * @param  string $holderText The link text to hold.
	 * @return string redirection_type The redirection link to hold.
	 */
	public function transformLinks( array $matchedLink, string $string, $redirection_type, $linkText = '', $holderText = '' ): string {
		$replacedString = $string;

		// If link text is empty load default link as link text.
		if ( '' === $linkText ) {
			$linkText = $this->checkHttpsInString( $matchedLink[0], true );
		}
		$replacedString = str_replace( $holderText, '', $replacedString );
		$replacedString = str_replace( $matchedLink[0], '<a href="' . $this->checkHttpsInString( $matchedLink[0], true ) . '" class="swptls-table-link" target="' . $redirection_type . '">' . $linkText . '</a>', $replacedString );

		return (string) $replacedString;
	}

	/**
	 * Check if the https is in the URL.
	 *
	 * @param string  $string The url string.
	 * @param boolean $addHttp  Flag to add http on the url or not.
	 * @return array
	 */
	public function checkHttpsInString( string $string, $addHttp = false ): string {
		$pattern = '/((https|ftp|file)):\/\//i';
		if ( ! preg_match_all( $pattern, $string, $matches ) ) {
			if ( $addHttp ) {
				return 'http://' . $string;
			} else {
				return $string;
			}
		} else {
			return $string;
		}
		return $string;
	}

	/**
	 * Check if the link is already exists.
	 *
	 * @param  string $string The url.
	 * @param  string $settings The url.
	 * @return mixed
	 */
	
	public function checkLinkExists($string, $settings) {
		$link_support = get_option('link_support_mode', 'smart_link'); 
		
		$redirection_type = !empty($settings['redirection_type']) ? sanitize_text_field($settings['redirection_type']) : '_blank';
		
		if (!is_string($string)) {
			return;
		}
		
		$imgMatchingRegex = '/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg))/i';
	
		// Check for image URLs and return the image tag.
		if (filter_var($string, FILTER_VALIDATE_URL) && preg_match($imgMatchingRegex, $string)) {
			return '<img src="' . $string . '" alt="' . $string . '"/>';
		}

		// Check for iframe or img tags and return the original string if found.
		if (preg_match('/<iframe|<img/i', $string)) {
			return $string;
		}

		$linkPattern = '/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/i';

		$pattern = '/\[(.*?)\]\s*([^\[\]]+)/i';
	
		if (preg_match_all($pattern, $string, $matches, PREG_SET_ORDER)) {
			$replacement = array();
			foreach ($matches as $match) {
				$linkText = $match[1];
				$linkData = $match[2];
	
				// Split the $linkData into text and URL.
				if (preg_match('/^\s*([^[]+)\s*(.*)$/i', $linkData, $urlMatch)) {
					$linkURL = $urlMatch[1];
					// Check if the linkURL starts with "http://" or "https://".
					if (!preg_match('/^https?:\/\//i', $linkURL)) {
						// If it doesn't, add "http://" by default.
						$linkURL = 'http://' . $linkURL;
					}
					// Create the formatted anchor tag.
					$formattedLink = '<a href="' . $linkURL . '" target="' . $redirection_type . '">' . $linkText . '</a>' . ' ';
					// Store the replacement in an array.
					$replacement[$match[0]] = $formattedLink;
				}
			}
	
			// Replace the original [text] url with the formatted links in the string.
			if( $link_support === 'pretty_link' ){
				$string = strtr($string, $replacement);
			}

		}
		elseif (preg_match_all($linkPattern, $string, $matches)) {
			if( $link_support === 'pretty_link' ){
				return $this->transformLinks($matches[0], $string, '', '', $redirection_type);
			}
		}

	
		return $string;
	}

	/**
	 * Perform hide cells operation.
	 *
	 * @param array  $hidden_fields The saved hidden cells list.
	 * @param string $cell       The cells index.
	 */
	public function hideCells( array $hidden_fields, string $cell ) {
		return in_array( $cell, $hidden_fields, true );
	}

	/**
	 * Generate css by given styles row index and cell index.
	 *
	 * @param array $styles    The sheet styles.
	 * @param int   $rowIndex  The table row index.
	 * @param int   $cellIndex The table cell index.
	 */
	
	private function generateCSS($styles, $rowIndex, $cellIndex) {

		if ( ! $styles ) {
			return '';
		}
	
		$css = '';
	
		$css .= isset($styles['bgColors'][$rowIndex][$cellIndex]) ? ' background-color: ' . $styles['bgColors'][$rowIndex][$cellIndex] . ';' : '';
		$css .= isset($styles['fontColors'][$rowIndex][$cellIndex]) ? ' color: ' . $styles['fontColors'][$rowIndex][$cellIndex] . ';' : '';
		$css .= isset($styles['fontFamily'][$rowIndex][$cellIndex]) ? ' font-family: ' . $styles['fontFamily'][$rowIndex][$cellIndex] . ';' : '';
		$css .= isset($styles['fontSize'][$rowIndex][$cellIndex]) ? ' font-size: ' . $styles['fontSize'][$rowIndex][$cellIndex] . 'px;' : '';
		$css .= isset($styles['fontWeights'][$rowIndex][$cellIndex]) ? ' font-weight: ' . $styles['fontWeights'][$rowIndex][$cellIndex] . ';' : '';
		$css .= isset($styles['fontStyles'][$rowIndex][$cellIndex]) ? ' font-style: ' . $styles['fontStyles'][$rowIndex][$cellIndex] . ';' : '';
		// $css .= isset($styles['textDecoration'][$rowIndex][$cellIndex]) ? ' text-decoration: ' . $styles['textDecoration'][$rowIndex][$cellIndex] . ';' : '';
	
		if (isset($styles['horizontalAlignments'][$rowIndex][$cellIndex])) {
			switch ($styles['horizontalAlignments'][$rowIndex][$cellIndex]) {
				case 'general-left':
					$css .= "  text-align: left;\n";
					break;
				case 'general-right':
					$css .= "  text-align: right;\n";
					break;
				case 'center':
					$css .= "  text-align: center;\n";
					break;
			}
		}
	
		return $css;
	}

	

	/**
	 * Get the images from google sheet
	 *
	 * @param  string $sheet_id The google sheet id.
	 * @param number $gid      The google sheet grid id.
	 * @return array
	 */
	public function get_images_data( $sheet_id, $gid ) {
		
		// Retrieve the timeout value from the options table or set it to 30 if not defined.
		$timeout = get_option( 'timeout_values', 10 );
		$timeout = !empty( $timeout ) ? (int) $timeout : 30; 
		$args = array(
			'timeout' => $timeout,
		);

		$rest_url = sprintf(
			'https://script.google.com/macros/s/AKfycbz2lB2sri2hRmzITLtvtP0BdE-mYjXiz1WyGEeqpsEA_evkc6M8vxh7qHbeuDheDtXlAA/exec?sheetID=%s&gID=%s&action=getImages',
			$sheet_id,
			$gid
		);

		$response = wp_remote_get( $rest_url, $args );

		return ! is_wp_error( $response ) ? wp_remote_retrieve_body( $response ) : [];
	}


	/**
	 * Get the sheets embeed links from google sheet
	 *
	 * @param  string $sheet_id The google sheet id.
	 * @param number $gid      The google sheet grid id.
	 * @return array
	 */
	
	public function get_links_data( $sheet_id, $gid ) {

		// Retrieve the timeout value from the options table or set it to 30 if not defined.
		$timeout = get_option( 'timeout_values', 10 );
		$timeout = !empty( $timeout ) ? (int) $timeout : 30; 
		$args = array(
			'timeout' => $timeout,
		);
		
		$rest_url = sprintf(
			'https://script.google.com/macros/s/AKfycbz2lB2sri2hRmzITLtvtP0BdE-mYjXiz1WyGEeqpsEA_evkc6M8vxh7qHbeuDheDtXlAA/exec?sheetID=%s&gID=%s&action=getLinks',
			$sheet_id,
			$gid
		);

		// $response = wp_remote_get( $rest_url ); // skipped. 
		$response = wp_remote_get( $rest_url, $args );

		return ! is_wp_error( $response ) ? wp_remote_retrieve_body( $response ) : [];
	}


	/**
	 * Get organized images data for each cell.
	 *
	 * @param string $index      The string index to pickup the images data.
	 * @param array  $images_data The images data retrieved from the sheet.
	 * @param mixed  $cell_data   The current cell data.
	 */
	
	public function getOrganizedImageData( $index, $images_data, $cell_data ) {
		$images_data = ! is_array( $images_data ) ? json_decode( $images_data, 1 ) : null;

		if ( ! $images_data ) {
			return $cell_data;
		}

		if ( isset( $images_data[ $index ] ) ) {

			$imgUrl = $images_data[ $index ]['imgUrl'][0];
			$width = $images_data[ $index ]['width'];
			$height = $images_data[ $index ]['height'];

			return '<img src="' . $imgUrl . '" alt="swptls-pro-image"  style="width: ' . ( floatval( $width ) + 50 ) . 'px; height: ' . ( floatval( $height ) + 50 ) . 'px" />';
		}

		return $cell_data;
	}

	

	/**
	 * Get sheets embeed link data for each cell.
	 *
	 * @param string $index      The string index to pickup the images data.
	 * @param array  $linkData The images data retrieved from the sheet.
	 * @param mixed  $cell_data   The current cell data.
	 */
	
	public function getTransformSimpleLinkValues($index, $linkData, $cell_data, $settings) {
		$linkData = !is_array($linkData) ? json_decode($linkData, true) : null;
	
		if (!$linkData) {
			return $cell_data;
		}
	
		$redirection_type = !empty($settings['redirection_type']) ? sanitize_text_field($settings['redirection_type']) : '_blank';
	
		if (isset($linkData[$index]['cellData'])) {
			$cellData = $linkData[$index]['cellData'];
			$result = '';
			
			foreach ($cellData as $linkItem) {
				// $linkUrl = htmlspecialchars($linkItem['linkUrl']);
				$linkUrl = isset($linkItem['linkUrl']) ? htmlspecialchars($linkItem['linkUrl']) : null;
				$linkText = $linkItem['linkText'];
	
				if (! preg_match('/^\[(.*?)\](.*?)$/', $linkText, $matches)) {
					if (!empty($linkUrl)) {
						$result .= '<a href="' . $linkUrl . '" class="swptls-table-link" target="' . $redirection_type . '">' . $linkText . '</a>'. ' ';
					} else {	
						// Treat linkUrl as null and add as normal text.
						$result .= '<span class="swptls-table-normal-text">' . $linkText . '</span>';
					}
					
				}
	
			}
	
			return $result;
		} 
		
		return $cell_data;
	}
	

	/**
	 * Generate the table.
	 *
	 * @param string $response The remote sheet data.
	 * @param array  $settings  The table settings.
	 * @param string $name The table name.
	 * @param array  $styles The sheet styles.
	 * @param array  $images The images.
	 * @param bool   $from_block The request context type.
	 *
	 * @return mixed
	 */

	 public function generate_html( $name, $settings, $table_data, $from_block = false ) {
		$table = '';

		$hidden_fields = [
			'hide_column' => ($settings['hide_on_desktop_col'] === true) ? ($settings['hide_column'] ?? []) : [],
			'hide_column_mobile' => ($settings['hide_on_mobile_col'] === true) ? ($settings['hide_column_mobile'] ?? []) : [],
			'hide_rows'   => ($settings['hide_on_desktop_rows'] === true) ? ($settings['hide_rows'] ?? []) : [],
			'hide_rows_mobile'   => ($settings['hide_on_mobile_rows'] === true) ? ($settings['hide_rows_mobile'] ?? []) : [],
			'hide_cell'   => ($settings['hide_on_desktop_cell'] === true) ? ($settings['hide_cell'] ?? []) : [],
			'hide_cell_mobile'   => ($settings['hide_on_mobile_cell'] === true) ? ($settings['hide_cell_mobile'] ?? []) : [],
		];

		$is_hidden_column = $is_hidden_row = $is_hidden_cell = '';
		
		$import_styles = (isset($settings['import_styles']) && wp_validate_boolean($settings['import_styles'])) ?? false;
		$show_title = isset($settings['show_title']) ? wp_validate_boolean($settings['show_title']) : false;
		
		$show_description = isset($settings['show_description']) ? wp_validate_boolean($settings['show_description']) : false;
		$description_position = isset($settings['description_position']) && in_array($settings['description_position'], ['above', 'below']) ? $settings['description_position'] : 'above';
		$description = isset($settings['table_description']) ? sanitize_text_field($settings['table_description']) : '';

		$merged_support = (isset($settings['merged_support']) && wp_validate_boolean($settings['merged_support'])) ?? false; 
		$checkbox_support = ( isset($settings['checkbox_support']) && wp_validate_boolean($settings['checkbox_support']) ) ?? false;

		$enable_fixed_columns = ( isset($settings['enable_fixed_columns']) && wp_validate_boolean($settings['enable_fixed_columns']) ) ?? false;
		$left_columns = ( isset($settings['left_columns']) && wp_validate_boolean($settings['left_columns']) ) ?? '1';
		$right_columns = ( isset($settings['right_columns']) && wp_validate_boolean($settings['right_columns']) ) ?? '0';

		$enable_fixed_headers = ( isset($settings['fixed_headers']) && wp_validate_boolean($settings['fixed_headers']) ) ?? false;
		$header_offset = ( isset($settings['header_offset']) && wp_validate_boolean($settings['header_offset']) ) ?? '1';


		$link_support = get_option('link_support_mode', 'smart_link'); 

		/**
		 * Extract theme data based on table_style.
		 */
		$theme_data = [];
		$table_style = isset($settings['table_style']) ? $settings['table_style'] : 'default-style';
		$import_styles_theme_colors = isset($settings['import_styles_theme_colors']) ? $settings['import_styles_theme_colors'] : [];

		if (isset($import_styles_theme_colors[$table_style])) {
			$theme_data = $import_styles_theme_colors[$table_style];
		}

		/**
		 * Set CSS variables for table styles
		 */
		$header_background_color = isset($theme_data['headerBGColor']) ? $theme_data['headerBGColor'] : '#ffffff';
		$header_text_color = isset($theme_data['headerTextColor']) ? $theme_data['headerTextColor'] : '#000000';
		
		$body_background_color = isset($theme_data['bodyBGColor']) ? $theme_data['bodyBGColor'] : '#ffffff';
		$body_text_color = isset($theme_data['bodyTextColor']) ? $theme_data['bodyTextColor'] : '#000000';
		$hover_color = isset($theme_data['hoverBGColor']) ? $theme_data['hoverBGColor'] : '#ffffff';
		$hover_text_color = isset($theme_data['hoverTextColor']) ? $theme_data['hoverTextColor'] : '#ffffff';
		
		$column_even_body_background_color = isset($theme_data['bodyBGColorEven']) ? $theme_data['bodyBGColorEven'] : '#ffffff';
		$column_odd_body_background_color = isset($theme_data['bodyBGColorOdd']) ? $theme_data['bodyBGColorOdd'] : '#ffffff';
		
		$row_even_body_background_color = isset($theme_data['bodyBGColorEven']) ? $theme_data['bodyBGColorEven'] : '#ffffff';
		$row_odd_body_background_color = isset($theme_data['bodyBGColorOdd']) ? $theme_data['bodyBGColorOdd'] : '#ffffff';

		$body_text_color_col_1 = isset($theme_data['bodyTextColorCol_1']) ? $theme_data['bodyTextColorCol_1'] : '#333333';
		$body_text_color_col_rest = isset($theme_data['bodyTextColorColRest']) ? $theme_data['bodyTextColorColRest'] : '#6b6b6b';

		$border_color = isset($theme_data['borderColor']) ? $theme_data['borderColor'] : '#000000';
		$outside_border_color = isset($theme_data['outsideborderColor']) ? $theme_data['outsideborderColor'] : '#ffffff';
		$borderType = isset($theme_data['borderType']) ? $theme_data['borderType'] : 'solid';
		$borderRadius = isset($theme_data['borderRadius']) ? $theme_data['borderRadius'] : '';

		$active_row_column_mode = (isset($theme_data['activeRowColumnMode']) && wp_validate_boolean($theme_data['activeRowColumnMode'])) ?? false;
		$active_column_color = (isset($theme_data['activeColumnColor']) && wp_validate_boolean($theme_data['activeColumnColor'])) ?? false;
		$active_row_color = (isset($theme_data['activeRowColor']) && wp_validate_boolean($theme_data['activeRowColor'])) ?? false;
		
		$hover_mode_none = (isset($theme_data['hoverModeNone']) && wp_validate_boolean($theme_data['hoverModeNone'])) ?? false;
		$hover_mode_row = (isset($theme_data['hoverModeRow']) && wp_validate_boolean($theme_data['hoverModeRow'])) ?? false;
		$hover_mode_column = (isset($theme_data['hoverModeColumn']) && wp_validate_boolean($theme_data['hoverModeColumn'])) ?? false;
		
		$pagination_center = (isset($theme_data['pagination_center']) && wp_validate_boolean($theme_data['pagination_center'])) ?? false;
		$pagination_acive_btn_color = isset($theme_data['paginationAciveBtnColor']) ? $theme_data['paginationAciveBtnColor'] : '#2F80ED';

		$table .= sprintf('<h3 class="swptls-table-title%s" id="swptls-table-title">%s</h3>', $show_title ? '' : ' hidden', $name );
		
		if($description_position === 'above' && $show_description !== false ){
			$table .= sprintf('<p class="swptls-table-description%s" id="swptls-table-description">%s</p>', $show_description ? '' : ' hidden', $description );
		}

		/**
		 * Generate table with dynamic styles.
		 * 
		*/ 
		$table .= '<table id="create_tables" class="ui celled display table gswpts_tables" style="width:100%;';
		// Header colors.
		$table .= "--header-bg-color: $header_background_color;";
		$table .= "--header-text-color: $header_text_color;";
		// Background colors.
		$table .= "--body-bg-color-even: $column_even_body_background_color;";
		$table .= "--body-bg-color-odd: $column_odd_body_background_color;";
		$table .= "--column-color-active: $active_column_color;";

		$table .= "--body-bg-color-even: $row_even_body_background_color;";
		$table .= "--body-bg-color-odd: $row_odd_body_background_color;";
		$table .= "--row-color-active: $active_row_color;";

		$table .= "--active-row-column-mode: $active_row_column_mode;";

		$table .= "--body-bg-color: $body_background_color;";
		// Outline color.
		$table .= "--outside-border-color: $outside_border_color;";	

		// Sticky.
		$table .= "--enable-fixed-columns: $enable_fixed_columns;";	
		$table .= "--left-columns: $left_columns;";	
		$table .= "--right-columns: $right_columns;";	

		$table .= "--enable-fixed-headers: $enable_fixed_headers;";	
		$table .= "--header-offset: $header_offset;";	
		
				
		//Border radius.
		if($borderType === 'rounded'){
			$table .= "--border-radius: $borderRadius;";	
		}
		// Hover mode.
		if($hover_mode_row){
			$table .= "--hover-mode-row: $hover_mode_row;";	
		} elseif($hover_mode_column){
			$table .= "--hover-mode-col: $hover_mode_column;";	
		}else{
			$table .= "--hover-mode-none: $hover_mode_none;";
		}
		
		$table .= "--hover-bg-color: $hover_color;";
		$table .= "--hover-text-color: $hover_text_color;";
		$table .= "--body-text-color-col-1: $body_text_color_col_1;";
		$table .= "--body-text-color-rest: $body_text_color_col_rest;";
		$table .= "--body-text-color: $body_text_color;";
		$table .= "--border-color: $border_color;";
		$table .= "--border-radius: $borderRadius;";
		$table .= "--border-type: $borderType;";
		$table .= "--pagination_center: $pagination_center;";	
		$table .= "--pagination-colors: $pagination_acive_btn_color;";
		$table .= '">';

		$tbody = str_getcsv($table_data['sheet_data'], "\n");
		$head = array_shift($tbody);
		$thead = str_getcsv($head, ',');

		$table .= '<thead><tr>';
		$total_count = count($thead);

		if (isset($settings['hide_column']) && $settings['hide_on_desktop_col'] === true) {
			$hidden_columns = array_flip((array)$settings['hide_column']);
		} else {
			$hidden_columns = [];
		}
		if (isset($settings['hide_column_mobile']) && $settings['hide_on_mobile_col'] === true) {
			$hidden_columns_mobile = array_flip((array)$settings['hide_column_mobile']);
		} else {
			$hidden_columns_mobile = [];
		}

		$row_index = 0; 

		for ($k = 0; $k < $total_count; $k++) {
			$is_hidden_column = isset($hidden_columns[$k]) ? 'hidden-column-desktop' : '';
			$is_hidden_mobile = isset($hidden_columns_mobile[$k]) ? 'hidden-column-mobile' : '';

			$th_style = $import_styles ? $this->generateCSS($table_data['sheet_styles'], 0, $k) : '';

			$mergetd = '';
			$isMergedCell = false;
			

			//Header merge. 
			if ($merged_support && !empty($table_data['sheet_merged_data'])) {
				
				foreach ($table_data['sheet_merged_data'] as $mergedCell) {
					$mergedRow = $mergedCell['startRow'];
					$startCol = $mergedCell['startCol'];
					$numRows = $mergedCell['numRows'];
					$numCols = $mergedCell['numCols'];
		
					// Check if the current cell is part of a merged range.
					$isMergedCell = (
						$row_index == $mergedRow && $k + 1 == $startCol
					);
		
					// If the current cell is part of a merged range.
					if ($isMergedCell) {
						// Add classes based on merged cell information.
						if ($row_index == $mergedRow && $k + 1 == $startCol) {
							$mergetd = 'data-merge="[' . $startCol . ',' . $numCols . ']"'; 
						}               
						// Break the loop to prevent duplicated attributes.
						break;
					}
				}
			}

			$table .= sprintf(
				'<th style="%s" class="thead-item %s %s" %s>',
				$th_style,
				$is_hidden_column,
				$is_hidden_mobile,
				$mergetd
			);

			$thead_value = $this->transformBooleanValues($this->checkLinkExists($thead[$k], $settings));
			$table .= $thead_value;

			$table .= '</th>';
		}
		$table .= '</tr></thead>';

		$table .= '<tbody>';
		$count = count($tbody);

		for ($i = 0; $i < $count; $i++) {
			$row_data = str_getcsv($tbody[$i], ',');
			$row_index = ($i + 1);
			
			$is_hidden_row = isset($settings['hide_rows']) && in_array($row_index, (array)$settings['hide_rows']) && isset($settings['hide_on_desktop_rows']) && $settings['hide_on_desktop_rows'] ? 'hidden-row' : '';
			
			$is_hidden_row_mobile = isset($settings['hide_rows_mobile']) && in_array($row_index, (array)$settings['hide_rows_mobile']) && isset($settings['hide_on_mobile_rows']) && $settings['hide_on_mobile_rows'] ? 'hidden-row-mobile' : '';

			$table .= sprintf(
				'<tr class="gswpts_rows row_%1$d %2$s  %3$s" data-index="%1$d">',
				$row_index,
				$is_hidden_row,
				$is_hidden_row_mobile
			);

			for ($j = 0; $j < $total_count; ++$j) {
				$cell_index = ($j + 1);
				$cIndex = "row_{$row_index}_col_{$j}";

				$cell_data = ($row_data[$j] === '') ? '' : $row_data[$j];
				
				if (!empty($table_data['sheet_images'])) {
					$cell_data = $this->getOrganizedImageData($cIndex, $table_data['sheet_images'], $cell_data);
				}

				if($link_support === 'smart_link'){
					if (!empty($table_data['sheet_links'])) {
						$cell_data = $this->getTransformSimpleLinkValues($cIndex, $table_data['sheet_links'], $cell_data, $settings);
					}
				}

				if ($checkbox_support ) {
					$cell_data = $this->transformCheckboxValues($this->checkLinkExists($cell_data, $settings));
				}else{
					$cell_data = $this->transformBooleanValues($this->checkLinkExists($cell_data, $settings));
				}


				$is_hidden_column = isset($settings['hide_column']) && $settings['hide_on_desktop_col'] === true && in_array($j, (array)$settings['hide_column']) ? 'hidden-column' : ''; 

				$is_hidden_column_mobile = isset($settings['hide_column_mobile']) && $settings['hide_on_mobile_col'] === true && in_array($j, (array)$settings['hide_column_mobile']) ? 'hidden-column-mobile' : ''; 

				
				$to_check = sprintf('[%s,%s]', $cell_index, $row_index);
				
				$is_hidden_cell = isset($hidden_fields['hide_cell']) && $settings['hide_on_desktop_cell'] === true && in_array($to_check, (array)$hidden_fields['hide_cell']) ? 'hidden-cell' : '';
				
				$is_hidden_cell_mobile = isset($hidden_fields['hide_cell_mobile']) && $settings['hide_on_mobile_cell'] === true && in_array($to_check, (array)$hidden_fields['hide_cell_mobile']) ? 'hidden-cell-mobile' : '';
				
				$responsive_class = 'wrap_style';
				$cell_style = isset($settings['cell_format']) ? sanitize_text_field($settings['cell_format']) : 'wrap';

				if ('expand' === $cell_style) {
					$responsive_class = 'expanded_style';
				} elseif ('clip' === $cell_style) {
					$responsive_class = 'clip_style';
				}
				
				$cell_style_attribute = $import_styles ? $this->generateCSS($table_data['sheet_styles'], $row_index, $j) : '';
				
				//Merged support checked.
				$mergetd = '';
				$isMergedCell = false;

				if ($merged_support && !empty($table_data['sheet_merged_data'])) {
					foreach ($table_data['sheet_merged_data'] as $mergedCell) {
						$mergedRow = $mergedCell['startRow'];
						$mergedCol = $mergedCell['startCol'];
						$numRows = $mergedCell['numRows'];
						$numCols = $mergedCell['numCols'];
			
						// Check if the current cell is part of a merged range.
						$isMergedCell = (
							$row_index == $mergedRow && $j + 1 == $mergedCol
						);
			
						// If the current cell is part of a merged range.
						if ($isMergedCell) {
							// Apply colspan and rowspan attributes.
							$mergetd .= '  colspan="' . $numCols . '"';
							$mergetd .= '  rowspan="' . $numRows . '"';
							// Add classes based on merged cell information
							if ($row_index == $mergedRow && $j + 1 == $mergedCol) {
								$mergetd .= ' class=" parentCellstart"'; 
								$mergetd .= ' data-merge="[' . $numCols .',' . $numRows . ']"'; 
							}               
							// Break the loop to prevent duplicated attributes.
							break;
						}
					}
				}
				
				$table .= sprintf(
					'<td %10$s data-index="%1$s" data-column="%5$s" data-content="%2$s" class="cell_index_%3$s %6$s %12$s %7$s %11$s %8$s" style="%4$s" data-row="%9$s">',
					$to_check,
					"$thead[$j]: &nbsp;",
					($cell_index) . '-' . $row_index,
					$cell_style_attribute,
					$j,
					$is_hidden_column,
					
					$is_hidden_cell,
					$responsive_class,
					$row_index,
					$mergetd,
					$is_hidden_cell_mobile,
					$is_hidden_column_mobile
				);

				if ($isMergedCell) {
					// Check if it's the starting cell.
					if ($j + 1 == $mergedCol) {
						// Starting cell.
						$table .= '<div class="cell_div mergeCellStart">' . $cell_data . '</div>';
					} else {
						// Non-starting cell within a merged range.
						$table .= '<div class="cell_div">' . $cell_data . '</div>';
					}
				} else {
					// Normal cells.
					$table .= '<div class="cell_div">' . $cell_data . '</div>';
				}

				$table .= '</td>';
			}

			$table .= '</tr>';
		}

		$table .= '</tbody>';
		$table .= '</table>';

		$table .= ' <input type="hidden" class="swptls-extra-settings" paging-align-data-id="' . esc_attr( $pagination_center ) . '" paging-color-data-id="' . esc_attr( $pagination_acive_btn_color ) . '">';


		if($description_position === 'below' && $show_description !== false ){
			$table .= sprintf('<p class="swptls-table-description%s" id="swptls-table-description">%s</p>', $show_description ? '' : ' hidden', $description );
		}
		
		return $table;
	}


	/**
	 * Pluck multiple fields from a list and get a new array.
	 *
	 * @param  array $list The item list.
	 * @param  array $fields The fields to pick from the list.
	 * @return array
	 */
	public function swptls_list_pluck_multiple( array $list, array $fields ): array {
		$bucket = [];

		foreach ( $fields as $pick ) {
			if ( isset( $list [ $pick ] ) ) {
				$bucket[ $pick ] = $list [ $pick ];
			} else {
				continue;
			}
		}

		return $bucket;
	}

	/**
	 * A wrapper method to escape data with post allowed html including input field.
	 *
	 * @param string $content The content to escape.
	 * @return string
	 */
	public function swptls_escape_list_item( $content ) {
		$allowed_tags = wp_kses_allowed_html( 'post' );

		$allowed_tags['input'] = [
			'id'          => true,
			'type'        => true,
			'name'        => true,
			'value'       => true,
			'placeholder' => true,
			'class'       => true,
			'data-*'      => true,
			'style'       => true,
			'checked'     => true
		];

		return wp_kses( $content, $allowed_tags );
	}
}