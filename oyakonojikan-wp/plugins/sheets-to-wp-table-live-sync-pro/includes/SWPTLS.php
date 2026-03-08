<?php
/**
 * Represents as plugin base file.
 *
 * @since 2.12.15
 * @package SWPTLSPRO
 */

namespace SWPTLSPRO {

	// If direct access than exit the file.
	defined( 'ABSPATH' ) || exit;

	/**
	 * Represents as plugin base file.
	 *
	 * @since 2.12.15
	 * @package SWPTLSPRO
	 */
	final class SWPTLS {

		/**
		 * Holds the instance of the plugin currently in use.
		 *
		 * @since 1.0.0
		 *
		 * @var SWPTLSPRO\SWPTLS
		 */
		private static $instance = null;

		/**
		 * Contains plugin pro version license status.
		 *
		 * @var bool
		 */
		public $license_status;

		/**
		 * Contains plugin pro version admin functionalities.
		 *
		 * @var SWPTLSPRO\Admin
		 */
		public $admin;

		/**
		 * Contains plugin cache functionalities.
		 *
		 * @var SWPTLSPRO\Cache
		 */
		public $cache;

		/**
		 * Contains plugin tab functionalities.
		 *
		 * @var SWPTLSPRO\Tabs
		 */
		public $tabs;

		/**
		 * Contains plugin pro version ajax functionalities.
		 *
		 * @var SWPTLSPRO\Ajax
		 */
		public $ajax;

		/**
		 * Contains helper methods.
		 *
		 * @var SWPTLSPRO\Helpers
		 */
		public $helpers;

		/**
		 * Contains plugin notices.
		 *
		 * @var SWPTLSPRO\Notices
		 */
		public $notices;

		/**
		 * Contains plugin assets.
		 *
		 * @var SWPTLSPRO\Assets
		 */
		public $assets;

		/**
		 * Contains plugin settings.
		 *
		 * @var SWPTLSPRO\Settings
		 */
		public $settings;

		/**
		 * Contains elementor widget.
		 *
		 * @var SWPTLSPRO\Elementor
		 */
		public $elementor;

		/**
		 * Contains the plugin pro shortcodes.
		 *
		 * @var SWPTLSPRO\Shortcodes
		 */
		public $shortcodes;

		/**
		 * Contains the plugin database helpers.
		 *
		 * @var SWPTLSPRO\Database
		 */
		public $database;

		/**
		 * Main Plugin Instance.
		 *
		 * Insures that only one instance of the addon exists in memory at any one
		 * time. Also prevents needing to define globals all over the place.
		 *
		 * @since  1.0.0
		 * @return SWPTLS\SWPTLSPRO
		 */
		public static function getInstance() {
			if ( null === self::$instance || ! self::$instance instanceof self ) {
				self::$instance = new self();

				self::$instance->init();
			}

			return self::$instance;
		}

		/**
		 * Class constructor.
		 *
		 * @since 2.12.15
		 */
		public function init() {
			$this->includes();
			$this->pre_loader();
			$this->loader();
		}

		/**
		 * Instantiate plugin available classes.
		 *
		 * @since 2.12.15
		 */
		public function includes() {
			$dependencies = [
				'/vendor/autoload.php',
			];
		
			// Only include if the class is not already defined.
			if (!class_exists('\SWPTLSPro\Appsero\Client')) {
				$dependencies[] = '/lib/appsero-client-extended/src/Client.php';
				
			}
			// Only include if the class is not already defined.
			if (!class_exists('\SWPTLSPro\Appsero\Updater')) {
				$dependencies[] = '/lib/appsero-client-extended/src/Updater.php';
				
			}
		
			foreach ($dependencies as $path) {
				if (!file_exists(SWPTLS_PRO_BASE_PATH . $path)) {
					status_header(500);
					wp_die(esc_html__('Plugin is missing required dependencies. Please contact support for more information.', 'sheetstowptable'));
				}
		
				require SWPTLS_PRO_BASE_PATH . $path;
			}
		}
		
		

		/**
		 * Preloads the required actions.
		 *
		 * @since 2.13.1
		 */
		private function pre_loader() {
			register_activation_hook( SWPTLS_PRO_PLUGIN_FILE, [ $this, 'activation' ] );
			register_deactivation_hook( SWPTLS_PRO_PLUGIN_FILE, [ $this, 'deactivation' ] );
		}

		/**
		 * Load plugin classes.
		 *
		 * @since  2.12.15
		 * @return void
		 */
		private function loader() {
			$client = $this->appseroInit();
			$this->license_status = $client->license()->is_valid();

			add_action( 'admin_init', [ $this, 'redirection' ] );

			$this->notices    = new \SWPTLSPRO\Notices();
			$this->database   = new \SWPTLSPRO\Database();
			$this->admin      = new \SWPTLSPRO\Admin();
			$this->cache      = new \SWPTLSPRO\Cache();
			$this->helpers    = new \SWPTLSPRO\Helpers();
			$this->assets     = new \SWPTLSPRO\Assets();
			$this->settings   = new \SWPTLSPRO\Settings();
			$this->tabs       = new \SWPTLSPRO\Tabs();
			$this->ajax       = new \SWPTLSPRO\Ajax();
			$this->shortcodes = new \SWPTLSPRO\Shortcodes();

			add_action( 'admin_init', [ $this, 'process_activation' ] );

			// IF license is not valid then show notice or else return true.
			if ( ! $this->license_status ) {
				add_action( 'admin_notices', [ $this->notices, 'licenseNotice' ] );
				update_option( 'custom_css', false );
			}
		}

		/**
		 * Process the plugin activation.
		 *
		 * @since 2.13.1
		 */
		public function process_activation() {
			if ( $this->helpers->check_for_legacy_plugin() ) {
				deactivate_plugins( 'sheets-to-wp-table-live-sync-pro/sheets-to-wp-table-live-sync-pro.php' );
				add_action( 'admin_notices', [ $this->notices, 'legacy_plugin_notice' ] );
			}

			if ( ! $this->helpers->isBasePluginActive() ) {
				deactivate_plugins( 'sheets-to-wp-table-live-sync-pro/sheets-to-wp-table-live-sync-pro.php' );
				add_action( 'admin_notices', [ $this->notices, 'base_plugin_notice' ] );
			}

			if ( $this->helpers->version_check() ) {
				deactivate_plugins( 'sheets-to-wp-table-live-sync-pro/sheets-to-wp-table-live-sync-pro.php' );
				add_action( 'admin_notices', [ $this->notices, 'show_notice' ] );
			}
		}

		/**
		 * Runs on the plugin activation.
		 *
		 * @since 2.13.1
		 */
		public function activation() {
			if ( ! $this->helpers->isBasePluginActive() || $this->helpers->check_for_legacy_plugin() || SWPTLS_PRO_VERSION < '3.0.0' ) {
				return;
			}

			add_option( 'gswpts_activation_pro_redirect', true );
			flush_rewrite_rules();
		}

		/**
		 * Runs on the plugin deactivation.
		 *
		 * @since 2.13.1
		 */
		public function deactivation() {
			flush_rewrite_rules();
			update_option( 'custom_css', false );
			update_option( 'is-sheets-to-wp-table-pro-active', false );
		}

		/**
		 * Redirect to admin page on plugin activation
		 *
		 * @since 1.0.0
		 */
		public function redirection() {
			if ( get_option( 'gswpts_activation_pro_redirect', false ) ) {
				delete_option( 'gswpts_activation_pro_redirect' );
				wp_safe_redirect( admin_url( 'admin.php?page=sheets_to_wp_table_live_sync_pro_settings' ) );
			}
		}

		/**
		 * Initialize appsero plugin.
		 *
		 * @since 2.12.15
		 */
		public function appseroInit() {
			$client = new \SWPTLSPro\Appsero\Client(
				'b82905c5-b807-47a0-a2cf-a7d3792f362f',
				__( 'FlexTable Premium', 'sheetstowptable-pro' ),
				SWPTLS_PRO_PLUGIN_FILE
			);

			// Hide the notice.
			$client->insights()
				->hide_notice()
				->init();

			// Active automatic updater.
			if (!class_exists('\SWPTLSPro\Appsero\Updater')) {
				\SWPTLSPro\Appsero\Updater::init($client);
			}


			// Active license page and checker.
			$args = [
				'type'        => 'submenu',
				'menu_title'  => __( 'License Activation', 'sheetstowptable-pro' ),
				'page_title'  => __( 'FlexTable License', 'sheetstowptable-pro' ),
				'menu_slug'   => 'sheets_to_wp_table_live_sync_pro_settings',
				'parent_slug' => 'gswpts-dashboard',
				'position'    => 5
			];

			$client->license()->add_settings_page( $args );

			return $client;
		}
	}
}

namespace {
	// if direct access than exit the file.
	defined( 'ABSPATH' ) || exit;

	/**
	 * This function is responsible for running the main plugin.
	 *
	 * @since  2.12.15
	 * @return object SWPTLSPRO\SWPTLS The plugin instance.
	 */
	function swptlspro() {
		return \SWPTLSPRO\SWPTLS::getInstance();
	}
}