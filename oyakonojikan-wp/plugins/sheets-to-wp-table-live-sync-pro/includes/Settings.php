<?php
/**
 * Extending plugin settings & options.
 *
 * @since 2.12.15
 * @package SWPTLSPRO
 */

namespace SWPTLSPRO;

// If direct access than exit the file.
	defined( 'ABSPATH' ) || exit;

/**
 * Extending plugin settings & options.
 *
 * @since 2.12.15
 */
class Settings {

	/**
	 * Class constructor.
	 *
	 * @since 2.13.1
	 */
	public function __construct() {
		$license_status = function_exists( 'swptlspro' ) ? swptlspro()->license_status : false;

		if ( $license_status ) {
			add_filter( 'export_buttons_logo_backend', [ $this, 'loadIconsUrl' ] );
			add_filter( 'export_buttons_logo_frontend', [ $this, 'loadIconsUrl' ] );
			add_filter( 'gswpts_rows_per_page', [ $this, 'rowsPerPage' ] );
			add_filter( 'gswpts_allow_sheet_rows_fetching', [ $this, 'sheetsRowFetching' ] );
			add_filter( 'gswpts_display_settings_arr', [ $this, 'displaySettingsArray' ] );
			add_filter( 'gswpts_table_tools_settings_arr', [ $this, 'tableToolsArray' ] );
			add_filter( 'gswpts_table_settings', [ $this, 'getTableSettings' ], 10, 2 );
			add_filter( 'gswpts_table_scorll_height', [ $this, 'scrollHeightArray' ] );
			add_filter( 'gswpts_table_export_values', [ $this, 'tableExportValues' ] );
			add_filter( 'gswpts_cell_format', [ $this, 'cellFormattingArray' ] );
			add_filter( 'gswpts_general_settings', [ $this, 'generalSettingsArray' ] );
			add_filter( 'gswpts_redirection_types', [ $this, 'redirectionTypeArray' ] );
			add_filter( 'gswpts_url_constructor', [ $this, 'sheetURLConstructor' ], 10, 2 );
			add_filter( 'gswpts_table_styles', [ $this, 'tableStylesArray' ], 10 );
			add_filter( 'gswpts_table_styles', [ $this, 'tableStylesArray' ], 10 );
			add_filter( 'gswpts_table_styles_path', [ $this, 'tableStylesCssFile' ], 10 );
			add_filter( 'gswpts_responsive_styles', [ $this, 'responsiveStyle' ], 10 );
		}
	}

	/**
	 * Load icons with urls.
	 *
	 * @return array
	 */
	public function loadIconsUrl(): array {
		$icons = [
			'curlyBrackets' => esc_url( SWPTLS_PRO_BASE_URL . 'assets/public/icons/brackets-curly-update.svg' ),
			'copySolid'     => esc_url( SWPTLS_PRO_BASE_URL . 'assets/public/icons/copy-solid-update.svg' ),
			'fileCSV'       => esc_url( SWPTLS_PRO_BASE_URL . 'assets/public/icons/file-csv-solid-update.svg' ),
			'fileExcel'     => esc_url( SWPTLS_PRO_BASE_URL . 'assets/public/icons/file-excel-solid-update.svg' ),
			'filePdf'       => esc_url( SWPTLS_PRO_BASE_URL . 'assets/public/icons/file-pdf-solid-update.svg' ),
			'printIcon'     => esc_url( SWPTLS_PRO_BASE_URL . 'assets/public/icons/print-solid-update.svg' )
		];

		return $icons;
	}

	/**
	 * Returns rows per options available for pro.
	 *
	 * @return array
	 */
	public function rowsPerPage(): array {
		$rowsPerPage = [
			'1'   => [
				'val'   => 1,
				'isPro' => false
			],
			'5'   => [
				'val'   => 5,
				'isPro' => false
			],
			'10'  => [
				'val'   => 10,
				'isPro' => false
			],
			'15'  => [
				'val'   => 15,
				'isPro' => false
			],
			'25'  => [
				'val'   => 25,
				'isPro' => false
			],
			'50'  => [
				'val'   => 50,
				'isPro' => false
			],
			'100' => [
				'val'   => 100,
				'isPro' => false
			],
			'all' => [
				'val'   => 'All',
				'isPro' => false
			]
		];

		return $rowsPerPage;
	}

	/**
	 * Extend row fetching options.
	 *
	 * @param  array $rowFetching The options from plugin lite version.
	 * @return array
	 */
	public function sheetsRowFetching( array $rowFetching ): array {
		$rowFetching['unlimited'] = true;
		return $rowFetching;
	}

	/**
	 * Extend display options.
	 *
	 * @param  array $options The options from the plugin lite version.
	 * @return array
	 */
	public function displaySettingsArray( array $options ): array {
		$options['responsive_style']['is_pro'] = false;
		$options['vertical_scrolling']['is_pro'] = false;
		$options['cell_format']['is_pro'] = false;
		$options['table_style']['is_pro'] = false;
		$options['redirection_type']['is_pro'] = false;
		$options['import_styles']['is_pro'] = false;

		return $options;
	}

	/**
	 * Extend table tools options.
	 *
	 * @param  array $options The table tools options from the plugin lite version.
	 * @return array
	 */
	public function tableToolsArray( array $options ): array {
		$options['table_export']['is_pro'] = false;
		$options['table_cache']['is_pro'] = false;
		$options['hide_column']['is_pro'] = false;
		$options['hide_rows']['is_pro'] = false;
		$options['hide_cell']['is_pro'] = false;

		return $options;
	}

	/**
	 * Get table settings.
	 *
	 * @param  array $settings The table settings.
	 * @param  array $table_settings The settings to override with.
	 * @note Honestly I don't know what this method for? and why its force overriding table settings.
	 * @return array
	 */
	public function getTableSettings( array $settings, array $table_settings ): array {
		if ( isset( $table_settings['responsiveStyle'] ) ) {
			$settings['responsive_style'] = $table_settings['responsiveStyle'];
		}
		if ( isset( $table_settings['verticalScroll'] ) ) {
			$settings['vertical_scroll'] = $table_settings['verticalScroll'];
		}
		if ( isset( $table_settings['tableExport'] ) && null !== $table_settings['tableExport'] &&
			false !== $table_settings['tableExport'] ) {
			$settings['table_export'] = $table_settings['tableExport'];
		}
		if ( isset( $table_settings['cellFormat'] ) ) {
			$settings['cell_format'] = $table_settings['cellFormat'];
		}
		if ( isset( $table_settings['redirectionType'] ) ) {
			$settings['redirection_type'] = $table_settings['redirectionType'];
		}
		if ( isset( $table_settings['tableCache'] ) ) {
			$settings['table_cache'] = $table_settings['tableCache'];
		}
		if ( isset( $table_settings['tableStyle'] ) ) {
			$settings['table_style'] = $table_settings['tableStyle'];
		}
		if ( isset( $table_settings['hideColumn'] ) ) {
			$settings['hide_column'] = $table_settings['hideColumn'];
		}
		if ( isset( $table_settings['hideRows'] ) ) {
			$settings['hide_rows'] = $table_settings['hideRows'];
		}
		if ( isset( $table_settings['hideCell'] ) ) {
			$settings['hide_cell'] = $table_settings['hideCell'];
		}
		if ( isset( $table_settings['importStyles'] ) ) {
			$settings['import_styles'] = $table_settings['importStyles'];
		}
		return $settings;
	}

	/**
	 * Extend scroll height options.
	 *
	 * @param  array $heights The height options from the plugin lite version.
	 * @return array
	 */
	public function scrollHeightArray( array $heights ): array {
		$heights['default'] = [
			'val'   => 'Default Height',
			'isPro' => true
		];

		$heights = array_map(function ( $height ) {
			$height['isPro'] = false;
			return $height;
		}, $heights);

		return $heights;
	}

	/**
	 * Extend table export values.
	 *
	 * @param  array $export_values The table export values from the lite version of the plugin.
	 * @return array
	 */
	public function tableExportValues( array $export_values ): array {
		return array_map(function ( $value ) {
			$value['isPro'] = false;
			return $value;
		}, $export_values);
	}

	/**
	 * Extend cell format options.
	 *
	 * @param  array $formats The default cell format options.
	 * @return array
	 */
	public function cellFormattingArray( array $formats ): array {
		return array_map(function ( $value ) {
			$value['isPro'] = false;
			return $value;
		}, $formats);
	}

	/**
	 * Extend general settings.
	 *
	 * @param  array $options The general settings options from the lite version of the plugin.
	 * @return array
	 */
	public function generalSettingsArray( array $options ): array {
		$options['custom_css']['is_pro'] = false;

		return $options;
	}

	/**
	 * Extend redirection types.
	 *
	 * @param  array $redirection_types The redirection types from the lite version of the plugin.
	 * @return array
	 */
	public function redirectionTypeArray( array $redirection_types ): array {
		return array_map(function ( $types ) {
			$types['isPro'] = false;
			return $types;
		}, $redirection_types);
	}

	/**
	 * Sheet url constructor.
	 *
	 * @param  array  $constructorArray The constructor array.
	 * @param  string $url              The sheet url.
	 * @return array
	 */
	public function sheetURLConstructor( array $constructorArray, string $url ): array {
		$gID = $this->getGridID( $url );

		$constructorArray['gID'] = $gID;

		return $constructorArray;
	}

	/**
	 * Get grid id from the given sheet url.
	 *
	 * @param  string $url The sheet url.
	 * @return mixed
	 */
	public function getGridID( string $url ) {
		$gID = false;
		$pattern = '/gid=(\w+)/i';

		if ( preg_match_all( $pattern, $url, $matches ) ) {

			$matchedID = $matches[1][0];
			if ( $matchedID ) {
				$gID = $matchedID;
			}
		}
		return $gID;
	}

	/**
	 * Extend table styles.
	 *
	 * @param  array $styles The styles from the lite version of the plugin.
	 * @return array
	 */
	public function tableStylesArray( array $styles ): array {
		return array_map(function ( $style ) {
			$style['isPro'] = false;
			return $style;
		}, $styles);
	}

	/**
	 * Load table styles css files.
	 *
	 * @param  array $styles The styles from the lite version of the plugin.
	 * @return mixed
	 */
	public function tableStylesCssFile( array $styles ): array {
		foreach ( $styles as $key => $style ) {
			$styles[ $key ]['cssURL'] = SWPTLS_PRO_BASE_URL . 'assets/public/styles/' . $key . '.min.css';
			$styles[ $key ]['cssPath'] = SWPTLS_PRO_BASE_PATH . 'assets/public/styles/' . $key . '.min.css';
		}

		return $styles;
	}

	/**
	 * Extend responsive styles options.
	 *
	 * @param  array $responsive_styles The responsive styles from the lite version of the plugin.
	 * @return array
	 */
	public function responsiveStyle( array $responsive_styles ): array {
		$responsive_styles['collapse_style']['isPro'] = false;
		$responsive_styles['scroll_style']['isPro'] = false;

		return $responsive_styles;
	}
}