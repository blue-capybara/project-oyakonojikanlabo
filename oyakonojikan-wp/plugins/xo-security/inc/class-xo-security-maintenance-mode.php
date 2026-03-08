<?php
/**
 * XO Security maintenance mode.
 *
 * @package xo-security
 * @since 3.8.0
 */

/**
 * XO Security maintenance mode class.
 *
 * @since 3.8.0
 */
class XO_Security_Maintenance_Mode {
	/**
	 * Parent object.
	 *
	 * @var XO_Security
	 */
	private $parent;

	/**
	 * Construction.
	 *
	 * @since 3.8.0
	 *
	 * @param XO_Security $parent_object XO_Security object.
	 */
	public function __construct( $parent_object ) {
		$this->parent = $parent_object;
		add_action( 'plugins_loaded', array( $this, 'setup' ) );
	}

	/**
	 * Plugin setup.
	 *
	 * @since 3.8.0
	 */
	public function setup() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_admin_bar_styles' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_bar_styles' ) );
		add_action( 'admin_bar_menu', array( $this, 'admin_bar_menu' ), 100 );
		add_action( 'wp_loaded', array( $this, 'maintenance_mode' ) );
	}

	/**
	 * Enqueues inline style to hide the admin bar when printing.
	 *
	 * @since 3.8.0
	 */
	public function enqueue_admin_bar_styles() {
		$style = '
			#wpadminbar #wp-admin-bar-xo-security > .ab-item::before { content: "\f107"; top: 2px; }
			#wpadminbar #wp-admin-bar-xo-security > .ab-item { background-color: #b60; }
			#wpadminbar #wp-admin-bar-xo-security > .ab-item:hover,
			#wpadminbar #wp-admin-bar-xo-security > .ab-item:focus { color: #eee; background-color: #a25800; }
			#wpadminbar #wp-admin-bar-xo-security > .ab-item:hover::before,
			#wpadminbar #wp-admin-bar-xo-security > .ab-item:focus::before { color: #eee; }
			@media screen and (max-width: 782px) {
				#wpadminbar #wp-admin-bar-xo-security { display: block !important; }
				#wpadminbar #wp-admin-bar-xo-security > .ab-item { text-indent: 100%; white-space: nowrap; overflow: hidden; width: 52px; padding: 0; color: #a7aaad; position: relative; }
				#wpadminbar #wp-admin-bar-xo-security > .ab-item::before { display: block; text-indent: 0; font: normal 32px/1 dashicons; speak: never; top: 7px; width: 52px; text-align: center; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
			}
		';
		wp_add_inline_style( 'admin-bar', $style, 'after' );
	}

	/**
	 * Add items to the admin bar.
	 *
	 * @since 3.8.0
	 *
	 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
	 */
	public function admin_bar_menu( $wp_admin_bar ) {
		$wp_admin_bar->add_menu(
			array(
				'id'     => 'xo-security',
				'parent' => null,
				'href'   => admin_url( 'options-general.php?page=xo-security-settings&tab=maintenance-page' ),
				'title'  => __( 'Maintenance mode', 'xo-security' ),
			)
		);
	}

	/**
	 * Render maintenance page.
	 *
	 * @since 3.8.0
	 */
	public function maintenance_mode() {
		global $pagenow;

		if ( 'admin-ajax.php' === $pagenow ) {
			return;
		}

		if ( ( defined( 'DOING_CRON' ) && DOING_CRON ) || 'cli' === PHP_SAPI ) {
			return;
		}

		if ( isset( $_SERVER['REQUEST_URI'] ) ) {
			list( $path ) = explode( '?', wp_unslash( $_SERVER['REQUEST_URI'] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

			$admin_login_paths = array(
				home_url( 'dashboard', 'relative' ),
				home_url( 'admin', 'relative' ),
				home_url( 'wp-admin', 'relative' ),
				site_url( 'dashboard', 'relative' ),
				site_url( 'admin', 'relative' ),
				site_url( 'wp-admin', 'relative' ),

				home_url( 'wp-login.php', 'relative' ),
				home_url( 'login.php', 'relative' ),
				home_url( 'login', 'relative' ),
				site_url( 'wp-login.php', 'relative' ),
				site_url( 'login.php', 'relative' ),
				site_url( 'login', 'relative' ),
			);

			if ( isset( $this->parent->options['login_page'] ) && $this->parent->options['login_page'] ) {
				if ( isset( $this->parent->options['login_page_name'] ) ) {
					$admin_login_paths[] = home_url( $this->parent->options['login_page_name'] . '.php', 'relative' );
					$admin_login_paths[] = site_url( $this->parent->options['login_page_name'] . '.php', 'relative' );
				}
			}

			if ( in_array( untrailingslashit( $path ), $admin_login_paths, true ) ) {
				return;
			}
		}

		if ( is_user_logged_in() && current_user_can( 'manage_options' ) ) {
			return;
		}

		remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		$template_file = get_stylesheet_directory() . '/maintenance-page.php';
		if ( ! file_exists( $template_file ) ) {
			$template_file = XO_SECURITY_DIR . '/templates/maintenance-page.php';
		}

		status_header( 503 );
		nocache_headers();
		include_once $template_file;
		exit();
	}
}
