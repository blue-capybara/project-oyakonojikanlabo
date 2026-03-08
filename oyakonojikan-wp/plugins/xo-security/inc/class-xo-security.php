<?php
/**
 * XO Security main.
 *
 * @package xo-security
 */

/**
 * XO Security main class.
 */
class XO_Security {
	const LOGIN_TYPE_UNKNOWN    = 0;
	const LOGIN_TYPE_LOGIN_PAGE = 1;
	const LOGIN_TYPE_XMLRPC     = 2;

	const MAX_LOGIN_LOG_RECORDS = 10000;

	/**
	 * Options.
	 *
	 * @var array
	 */
	public $options;

	/**
	 * WordPress version hash.
	 *
	 * @var string
	 */
	private $hash_version;

	/**
	 * Construction.
	 *
	 * @since 1.0.0
	 *
	 * @global wpdb $wpdb WordPress database abstraction object.
	 */
	public function __construct() {
		load_plugin_textdomain( 'xo-security' );

		if ( is_admin() ) {
			require_once __DIR__ . '/class-xo-login-log-list-table.php';
			require_once __DIR__ . '/class-xo-security-admin.php';
			new XO_Security_Admin( $this );
		}

		$this->options = get_option( 'xo_security_options' );
		if ( false === $this->options ) {
			$this->activation();
			$this->options = get_option( 'xo_security_options' );
		} elseif ( ! isset( $this->options['plugin_version'] ) || version_compare( $this->options['plugin_version'], XO_SECURITY_VERSION, '<' ) ) {
			$this->activation();
			$this->options = get_option( 'xo_security_options' );
		}

		if ( defined( 'XMLRPC_REQUEST' ) ) {
			if (
				( isset( $this->options['xmlrpc'] ) && $this->options['xmlrpc'] )
				&& ( isset( $this->options['pingback'] ) && $this->options['pingback'] )
			) {
				$blocked_tarpit = isset( $this->options['blocked_tarpit'] ) ? (int) $this->options['blocked_tarpit'] : 0;
				if ( $blocked_tarpit > 0 ) {
					sleep( $blocked_tarpit );
				}

				if ( ! headers_sent() ) {
					nocache_headers();
				}

				header( 'HTTP/1.1 403 Forbidden' );
				die();
			}
		}

		if ( isset( $this->options['delete_readme'] ) && $this->options['delete_readme'] ) {
			add_action( '_core_updated_successfully', array( $this, 'core_updated_successfully' ) );
		}

		if ( isset( $this->options['maintenance_mode'] ) && $this->options['maintenance_mode'] ) {
			require_once __DIR__ . '/class-xo-security-maintenance-mode.php';
			new XO_Security_Maintenance_Mode( $this );
		}

		if ( isset( $this->options['two_factor'] ) && $this->options['two_factor'] ) {
			require_once __DIR__ . '/class-xo-security-two-factor.php';
			new XO_Security_Two_Factor( $this );
		}

		add_action( 'plugins_loaded', array( $this, 'setup' ), 99999 );
	}

	/**
	 * Plugin activation.
	 *
	 * @since 1.0.0
	 *
	 * @global wpdb $wpdb WordPress database abstraction object.
	 *
	 * @return void
	 */
	public static function activation() {
		global $wpdb;

		$options = get_option( 'xo_security_options' );
		if ( $options ) {
			if ( version_compare( $options['plugin_version'], '3.4.5', '<=' ) ) {
				$wpdb->query( 'DROP TABLE IF EXISTS ' . $wpdb->prefix . 'xo_security_loginlog' ); // phpcs:ignore WordPress.DB
			}
		}

		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$wpdb->prefix}xo_security_loginlog (
			id bigint(20) unsigned NOT NULL auto_increment,
			success boolean NOT NULL DEFAULT '0',
			login_time datetime NOT NULL default '0000-00-00 00:00:00',
			ip_address varchar(46) default NULL,
			login_type tinyint(1) default '0',
			lang varchar(5) default NULL,
			user_agent varchar(255) default NULL,
			user_name varchar(100) default NULL,
			PRIMARY KEY (id),
			KEY success (success),
			KEY login_time (login_time),
			KEY ip_address (ip_address),
			KEY user_name (user_name)
			) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );

		if ( $options ) {
			$options['plugin_version'] = XO_SECURITY_VERSION;
		} else {
			$options = self::get_default_options();
		}
		update_option( 'xo_security_options', $options );

		if ( isset( $options['delete_readme'] ) && $options['delete_readme'] ) {
			self::delete_readme_file();
		}
	}

	/**
	 * Plugin uninstall by site.
	 *
	 * @since 3.1.0
	 *
	 * @global wpdb $wpdb WordPress database abstraction object.
	 */
	public static function uninstall_site() {
		global $wpdb;

		$wpdb->query( 'DROP TABLE IF EXISTS ' . $wpdb->prefix . 'xo_security_loginlog' ); // phpcs:ignore WordPress.DB

		$options = get_option( 'xo_security_options' );

		if ( isset( $options['login_page'] ) && $options['login_page'] ) {
			if ( isset( $options['login_page_name'] ) ) {
				$filename = ABSPATH . $options['login_page_name'] . '.php';
				if ( file_exists( $filename ) ) {
					wp_delete_file( $filename );
				}
			}
		}

		delete_option( 'xo_security_options' );
	}

	/**
	 * Plugin uninstall.
	 *
	 * @since 1.0.0
	 *
	 * @global wpdb $wpdb WordPress database abstraction object.
	 */
	public static function uninstall() {
		global $wpdb;

		if ( is_multisite() ) {
			$site_ids = get_sites( array( 'fields' => 'ids' ) );
			foreach ( $site_ids as $site_id ) {
				switch_to_blog( $site_id );
				self::uninstall_site();
			}
			restore_current_blog();
		} else {
			self::uninstall_site();
		}
	}

	/**
	 * Plugin deactivation.
	 *
	 * @since 3.6.0
	 */
	public static function deactivation() {
		wp_clear_scheduled_hook( 'xo_security_optimize_table' );
	}

	/**
	 * Get default options data.
	 *
	 * @since 1.7.0
	 *
	 * @return array default options data.
	 */
	public static function get_default_options() {
		$default_options = array(
			// phpcs:disable Squiz.PHP.CommentedOutCode.Found
			'plugin_version'       => XO_SECURITY_VERSION,
			'interval'             => 0,
			'limit_count'          => 4,
			'blocked_tarpit'       => 10,
			'failed_tarpit'        => 1,
			'login_page'           => false,
			'login_page_name'      => '',
			'ms_common_login_page' => true,
			'two_factor'           => false,
			'two_factor_roles'     => array( 'administrator', 'editor', 'author' ),
			'password_reset'       => true,
			'login_site_link'      => true,
			'comment_spam'         => false,
			'comment_spam_email'   => false,
			'comment_spam_action'  => 'block',   // 'block', 'spam' or 'trash'.
			'comment_bat'          => false,
			'xmlrpc'               => false,
			'pingback'             => false,
			'rest'                 => false,
			'rest_rename'          => false,     // Deprecation.
			'rest_name'            => '',        // Deprecation.
			'author_archive'       => false,
			'edit_author_slug'     => false,
			'edit_author_base'     => false,
			'author_base'          => '',        // '': Default ('author').
			'comment_author_class' => false,
			'oembed_author'        => false,
			'disable_feed'         => false,
			'remove_version'       => false,
			'delete_readme'        => false,
			'error_login_message'  => false,
			'login_id_type'        => '',        // '', 'username' or 'email'.
			'ip_mode'              => '',        // '': Auto, 'http_x_real_ip', 'remote_addr' or etc.
			'auto_truncate'        => 365,
			'log_default_status'   => '',        // '': All, '0': Failure or '1': Success.
			'dashboard_widget'     => true,
			'maintenance_mode'     => false,
			'captcha_type'         => 'default', // 'default': Default, 'chokokutai': Chokokutai font, 'auto': Auto mode.
			// phpcs:enable
		);
		return $default_options;
	}

	/**
	 * Plugin setup.
	 *
	 * @since 1.0.0
	 *
	 * @global string $wp_version The WordPress version string.
	 */
	public function setup() {
		global $wp_version;

		if ( ! is_main_site() ) {
			switch_to_blog( 1 );
			$options = get_option( 'xo_security_options' );
			restore_current_blog();

			$this->options['ms_common_login_page'] = isset( $options['ms_common_login_page'] ) ? $options['ms_common_login_page'] : false;
			if ( $this->options['ms_common_login_page'] ) {
				$this->options['login_page']      = isset( $options['login_page'] ) ? $options['login_page'] : false;
				$this->options['login_page_name'] = isset( $options['login_page_name'] ) ? $options['login_page_name'] : '';
			}
		}

		add_filter( 'authenticate', array( $this, 'authenticate' ), 100, 2 );
		add_action( 'wp_login', array( $this, 'handler_wp_login' ), 0, 2 );
		add_action( 'xmlrpc_call', array( $this, 'handler_xmlrpc_call' ) );
		add_filter( 'xmlrpc_login_error', array( $this, 'xmlrpc_login_error_message' ) );
		add_action( 'login_init', array( $this, 'login_init' ) );
		add_filter( 'login_errors', array( $this, 'login_error_message' ) );
		add_filter( 'shake_error_codes', array( $this, 'login_failure_shake' ) );

		if ( isset( $this->options['login_page'] ) && $this->options['login_page'] ) {
			add_filter( 'site_url', array( $this, 'site_url' ), 10, 4 );
			add_filter( 'network_site_url', array( $this, 'network_site_url' ), 10, 3 );
			add_filter( 'wp_redirect', array( $this, 'login_page_wp_redirect' ) );
			add_filter( 'template_redirect', array( $this, 'recreate_login_file' ) );
		}

		if ( isset( $this->options['author_archive'] ) && $this->options['author_archive'] ) {
			add_filter( 'author_rewrite_rules', array( $this, 'author_rewrite_rules' ) );
			add_action( 'init', array( $this, 'author_rewrite' ) );
			add_filter( 'wp_sitemaps_add_provider', array( $this, 'remove_author_sitemap_provider' ), 10, 2 );
		}

		if ( isset( $this->options['comment_author_class'] ) && $this->options['comment_author_class'] ) {
			add_filter( 'comment_class', array( $this, 'remove_comment_author_class' ) );
		}

		if ( isset( $this->options['oembed_author'] ) && $this->options['oembed_author'] ) {
			add_filter( 'oembed_response_data', array( $this, 'filter_oembed_response_data' ) );
		}

		if ( isset( $this->options['xmlrpc'] ) && $this->options['xmlrpc'] ) {
			add_filter( 'xmlrpc_enabled', array( $this, 'xmlrpc_enabled' ) );
		}

		if ( isset( $this->options['pingback'] ) && $this->options['pingback'] ) {
			add_filter( 'xmlrpc_methods', array( $this, 'remove_pingback' ) );
			add_filter( 'wp_headers', array( $this, 'remove_x_pingback' ) );
		}

		if ( isset( $this->options['rest'] ) && $this->options['rest'] ) {
			if ( version_compare( $wp_version, '4.7' ) >= 0 ) {
				add_filter( 'rest_endpoints', array( $this, 'rest_endpoints' ), 10, 1 );
			} else {
				$this->disable_rest();
			}
		}

		if ( isset( $this->options['rest_rename'] ) && $this->options['rest_rename'] ) {
			if ( has_action( 'wp_head', 'rest_output_link_wp_head' ) ) {
				remove_action( 'wp_head', 'rest_output_link_wp_head', 10 );
			}
			add_filter( 'rest_url_prefix', array( $this, 'rest_url_prefix' ) );
		}

		$login_captcha   = isset( $this->options['login_captcha'] ) ? $this->options['login_captcha'] : '';
		$comment_captcha = isset( $this->options['comment_captcha'] ) ? $this->options['comment_captcha'] : '';

		if (
			( ! is_admin() || ( defined( 'DOING_AJAX' ) && DOING_AJAX && ! is_user_logged_in() ) )
			&& ( '' !== $login_captcha || '' !== $comment_captcha )
		) {
			$this->session_start();
		}

		if ( '' !== $login_captcha ) {
			add_filter( 'login_form', array( $this, 'login_form' ) );
			add_filter( 'wp_authenticate_user', array( $this, 'authenticate_user_by_captcha' ), 9, 1 );
			add_filter( 'shake_error_codes', array( $this, 'shake_error_codes' ), 10, 1 );

			add_action( 'woocommerce_login_form', array( $this, 'login_form' ) );
		}

		if ( '' !== $comment_captcha ) {
			if ( ! is_user_logged_in() ) {
				add_action( 'comment_form_after_fields', array( $this, 'comment_form_captcha_field' ), 1 );
				add_action( 'comment_form_logged_in_after', array( $this, 'comment_form_captcha_field' ), 1 );
				add_action( 'comment_form', array( $this, 'comment_form_captcha' ) );
				add_filter( 'preprocess_comment', array( $this, 'preprocess_comment_captcha' ) );
			}
		}

		if ( isset( $this->options['comment_bot'] ) && $this->options['comment_bot'] ) {
			if ( ! is_user_logged_in() ) {
				add_action( 'comment_form_after_fields', array( $this, 'comment_form_bot_field' ), PHP_INT_MAX );
				add_action( 'comment_form_logged_in_after', array( $this, 'comment_form_bot_field' ), PHP_INT_MAX );
				add_action( 'comment_form', array( $this, 'comment_form_bot' ) );
				add_filter( 'preprocess_comment', array( $this, 'preprocess_comment_bot' ) );
			}
		}

		if (
			( isset( $this->options['comment_spam'] ) && $this->options['comment_spam'] )
			|| ( isset( $this->options['comment_spam_email'] ) && $this->options['comment_spam_email'] )
		) {
			add_filter( 'comment_form_field_comment', array( $this, 'comment_form_field_comment_spam' ) );
			add_filter( 'preprocess_comment', array( $this, 'preprocess_comment_spam' ) );
			add_filter( 'pre_comment_approved', array( $this, 'pre_comment_approved' ), 99999, 2 );
		}

		if ( isset( $this->options['login_id_type'] ) ) {
			if ( 'username' === $this->options['login_id_type'] ) {
				remove_filter( 'authenticate', 'wp_authenticate_email_password', 20 );
				add_filter( 'login_form_defaults', array( $this, 'login_form_defaults' ) );
				add_filter( 'gettext', array( $this, 'gettext_login_id_username' ), 20, 3 );
			} if ( 'email' === $this->options['login_id_type'] ) {
				add_filter( 'authenticate', array( $this, 'authenticate_email' ), 20, 2 );
				add_filter( 'gettext', array( $this, 'gettext_login_id_email' ), 20, 3 );
			}
		}

		if ( isset( $this->options['password_reset'] ) && ! $this->options['password_reset'] ) {
			if ( version_compare( $wp_version, '6.1.0' ) >= 0 ) {
				add_filter( 'lost_password_html_link', array( $this, 'lost_password_html_link' ) );
			} else {
				add_filter( 'gettext', array( $this, 'gettext_password_reset' ), 10, 3 );
			}
		}

		if ( isset( $this->options['login_site_link'] ) && ! $this->options['login_site_link'] ) {
			if ( version_compare( $wp_version, '5.7.0' ) >= 0 ) {
				add_filter( 'login_site_html_link', array( $this, 'login_site_html_link' ) );
			} else {
				add_filter( 'gettext_with_context', array( $this, 'gettext_login_site_link' ), 10, 4 );
			}
		}

		if ( isset( $this->options['remove_version'] ) && $this->options['remove_version'] ) {
			remove_action( 'wp_head', 'wp_generator' );

			$this->hash_version = hash_hmac( 'md5', $wp_version, wp_salt( 'nonce' ) );
			add_filter( 'style_loader_src', array( $this, 'remove_meta_tag_version' ) );
			add_filter( 'script_loader_src', array( $this, 'remove_meta_tag_version' ) );
		}

		if ( isset( $this->options['edit_author_base'] ) && $this->options['edit_author_base'] ) {
			add_action( 'init', array( $this, 'rewrite_author_base' ), 8 );
		}

		if ( isset( $this->options['disable_feed'] ) && $this->options['disable_feed'] ) {
			add_action( 'init', array( $this, 'disable_feed' ) );
		}

		add_filter( 'cron_schedules', array( $this, 'cron_schedules' ) );
		add_action( 'xo_security_optimize_table', array( $this, 'optimize_table' ) );
		add_action( 'init', array( $this, 'init' ) );
	}

	/**
	 * Get login type.
	 *
	 * @return string Login type.
	 */
	private function get_login_type_value() {
		if ( isset( $_SERVER['SCRIPT_NAME'] ) ) {
			$type = ( 'xmlrpc.php' === basename( esc_url_raw( wp_unslash( $_SERVER['SCRIPT_NAME'] ) ) ) ) ? self::LOGIN_TYPE_XMLRPC : self::LOGIN_TYPE_LOGIN_PAGE;
		} else {
			$type = self::LOGIN_TYPE_LOGIN_PAGE;
		}
		return $type;
	}

	/**
	 * Start session.
	 */
	private function session_start() {
		if ( ! session_id() ) {
			if ( ! defined( 'XMLRPC_REQUEST' ) ) {
				set_error_handler( function() {}, E_NOTICE | E_WARNING ); // phpcs:ignore
				session_cache_limiter( 'private_no_expire' );
				session_start();
				restore_error_handler();
			}
		}
	}

	/**
	 * The default login form output arguments.
	 *
	 * @param array $defaults An array of default login form arguments.
	 */
	public function login_form_defaults( $defaults ) {
		$defaults['label_username'] = __( 'Username' );
		return $defaults;
	}

	/**
	 * Filter for gettext.
	 *
	 * @param string $translation Translated text.
	 * @param string $text        Text to translate.
	 * @param string $domain      Text domain. Unique identifier for retrieving translated strings.
	 */
	public function gettext_login_id_username( $translation, $text, $domain ) {
		if ( 'wp-login.php' === $GLOBALS['pagenow'] ) {
			if ( 'default' === $domain && 'Username or Email Address' === $text ) {
				$translation = __( 'Username' );
			}
		}
		return $translation;
	}

	/**
	 * Filter for gettext.
	 *
	 * @param string $translation Translated text.
	 * @param string $text        Text to translate.
	 * @param string $domain      Text domain. Unique identifier for retrieving translated strings.
	 */
	public function gettext_login_id_email( $translation, $text, $domain ) {
		if ( 'wp-login.php' === $GLOBALS['pagenow'] ) {
			if ( 'default' === $domain && 'Username or Email Address' === $text ) {
				$translation = __( 'Email', 'xo-security' );
			}
		}
		return $translation;
	}

	/**
	 * Filter for rest_endpoints.
	 *
	 * @param array $endpoints The available endpoints.
	 */
	public function rest_endpoints( $endpoints ) {
		if ( ! is_user_logged_in() ) {
			$s = isset( $this->options['rest_disable_endpoints'] ) ? $this->options['rest_disable_endpoints'] : '';
			if ( '' !== $s ) {
				$disable_endpoints = explode( ',', $s );
				foreach ( $disable_endpoints as $disable_endpoint ) {
					foreach ( $endpoints as $key => $value ) {
						if ( $key === $disable_endpoint ) {
							unset( $endpoints[ $key ] );
						}
					}
				}
			}
		}
		return $endpoints;
	}

	/**
	 * Disable REST API.
	 */
	public function disable_rest() {
		remove_action( 'xmlrpc_rsd_apis', 'rest_output_rsd' );
		if ( has_action( 'wp_head', 'rest_output_link_wp_head' ) ) {
			remove_action( 'wp_head', 'rest_output_link_wp_head', 10 );
		}
		remove_action( 'template_redirect', 'rest_output_link_header', 11, 0 );

		// REST API 1.x.
		add_filter( 'json_enabled', '__return_false' );
		add_filter( 'json_jsonp_enabled', '__return_false' );

		// REST API 2.x.
		add_filter( 'rest_enabled', '__return_false' );
		add_filter( 'rest_jsonp_enabled', '__return_false' );
	}

	/**
	 * Filter for rest_url_prefix.
	 */
	public function rest_url_prefix() {
		if ( ! empty( $this->options['rest_name'] ) ) {
			return $this->options['rest_name'];
		}
	}

	/**
	 * Filter for authenticate.
	 *
	 * @param null|WP_User|WP_Error $user     WP_User if the user is authenticated.
	 * @param string                $username Username or email address.
	 */
	public function authenticate( $user, $username ) {
		if ( ! empty( $username ) ) {
			if ( ! $this->is_login_ok() ) {
				$blocked_tarpit = isset( $this->options['blocked_tarpit'] ) ? (int) $this->options['blocked_tarpit'] : 0;
				if ( $blocked_tarpit > 0 ) {
					sleep( $blocked_tarpit );
				}
				$user = new WP_Error( 'limit_login', __( 'We restrict the login right now.', 'xo-security' ) );
			}
			if ( empty( $user ) || is_wp_error( $user ) ) {
				$this->failed_login( $username );
				$failed_tarpit = isset( $this->options['failed_tarpit'] ) ? (int) $this->options['failed_tarpit'] : 0;
				if ( $failed_tarpit > 0 ) {
					sleep( $failed_tarpit );
				}
			}
		}
		return $user;
	}

	/**
	 * Filter for wp_login.
	 *
	 * @param string  $user_login Username.
	 * @param WP_User $user       WP_User object of the logged-in user.
	 */
	public function handler_wp_login( $user_login, $user ) {
		if ( '' === $user->user_login ) {
			return;
		}
		$this->successful_login( $user, $this->get_login_type_value() );
	}

	/**
	 * Filter for xmlrpc_call.
	 */
	public function handler_xmlrpc_call() {
		$current_user = wp_get_current_user();
		if ( '' === $current_user->user_login ) {
			return;
		}
		$this->successful_login( $current_user, self::LOGIN_TYPE_XMLRPC );
	}

	/**
	 * Filter for wp_authenticate_user.
	 *
	 * @param string $user User.
	 */
	public function authenticate_user_by_captcha( $user ) {
		if ( ! is_wp_error( $user ) ) {
			if ( ! empty( $_SESSION['xo_security_captcha_login'] ) ) {
				if ( ! empty( $_REQUEST['xo_security_captcha'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
					if ( $_SESSION['xo_security_captcha_login'] !== $_REQUEST['xo_security_captcha'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
						$user = new WP_Error( 'captcha_login', __( '<strong>Error:</strong> The CAPTCHA code is wrong.', 'xo-security' ) );
					}
				} else {
					$user = new WP_Error( 'captcha_login', __( '<strong>Error:</strong> Please enter the CAPTCHA code.', 'xo-security' ) );
				}
			} elseif ( isset( $this->options['login_captcha'] ) && ! empty( $this->options['login_captcha'] ) ) {
				$user = new WP_Error( 'captcha_login', __( '<strong>Error:</strong> The session is unavailable. ', 'xo-security' ) );
			}
		}
		return $user;
	}

	/**
	 * Filter for authenticate.
	 *
	 * @param WP_User|Mixed $user user object if authenticated.
	 * @param String        $username username.
	 * @return WP_User|Mixed authenticated user or error.
	 */
	public function authenticate_email( $user, $username ) {
		if ( null !== $user && ! is_wp_error( $user ) && $user->user_email !== $username ) {
			$user = new WP_Error( 'invalid_username', __( '<strong>Error:</strong> There is no account with that email address.', 'xo-security' ) );
		}
		return $user;
	}

	/**
	 * Filter for login_errors.
	 *
	 * @param string $error Login error message.
	 */
	public function login_error_message( $error ) {
		global $errors;

		if ( ! $this->is_login_ok() ) {
			$blocked_tarpit = isset( $this->options['blocked_tarpit'] ) ? (int) $this->options['blocked_tarpit'] : 0;
			if ( $blocked_tarpit > 0 ) {
				sleep( $blocked_tarpit );
			}
			return __( '<strong>Error:</strong> We restrict the login right now.', 'xo-security' );
		}

		if ( is_wp_error( $errors ) ) {
			$err_codes = $errors->get_error_codes();
			if ( in_array( 'captcha_login', $err_codes, true ) ) {
				return $error;
			}
		}

		if ( isset( $this->options['error_login_message'] ) && $this->options['error_login_message'] ) {
			return __( '<strong>Error:</strong> Username or password is incorrect.', 'xo-security' );
		}

		return $error;
	}

	/**
	 * Filter for login_init.
	 */
	public function login_init() {
		// phpcs:ignore WordPress.Security.NonceVerification
		if ( isset( $_GET['action'] ) && in_array( $_GET['action'], array( 'postpass', 'confirmaction', 'logout' ), true ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification
		if ( isset( $_GET['checkemail'] ) && 'confirm' === $_GET['checkemail'] ) {
			return;
		}

		if ( is_user_logged_in() ) {
			return;
		}

		if ( defined( 'XO_SECURITY_LANGUAGE_WHITE_LIST' ) && XO_SECURITY_LANGUAGE_WHITE_LIST !== '' ) {
			$lang       = strtolower( substr( $this->get_language(), 0, 2 ) );
			$whitelangs = explode( ',', strtolower( XO_SECURITY_LANGUAGE_WHITE_LIST ) );
			if ( ! in_array( $lang, $whitelangs, true ) ) {
				$blocked_tarpit = isset( $this->options['blocked_tarpit'] ) ? (int) $this->options['blocked_tarpit'] : 0;
				if ( $blocked_tarpit > 0 ) {
					sleep( $blocked_tarpit );
				}
				$this->redirect_404();
				exit;
			}
		}

		if ( ! $this->is_login_ok() ) {
			$this->redirect_404();
			exit;
		}

		if ( isset( $this->options['login_page'] ) && $this->options['login_page'] ) {
			$login_page_name = ( isset( $this->options['login_page_name'] ) ? $this->options['login_page_name'] : '' );
			if ( ! isset( $_SERVER['REQUEST_URI'] ) || false === strpos( $_SERVER['REQUEST_URI'], $login_page_name ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
				$this->redirect_404();
				exit;
			}
		}
	}

	/**
	 * Redirect to 404.
	 *
	 * @param bool $redirect Redirect type.
	 */
	private function redirect_404( $redirect = true ) {
		if ( $redirect ) {
			wp_safe_redirect( home_url( '/404' ) );
		} else {
			global $wp_query;

			status_header( 404 );
			if ( function_exists( 'nocache_headers' ) ) {
				nocache_headers();
			}
			$wp_query->set_404();
			$page_404 = get_404_template();
			if ( 1 < strlen( $page_404 ) ) {
				include $page_404;
			} else {
				include get_query_template( 'index' );
			}
		}
	}

	/**
	 * Get the login URL.
	 *
	 * @param string $url       URL.
	 * @param string $loginfile Login filename.
	 */
	private function get_login_url( $url, $loginfile ) {
		if ( is_user_logged_in() ) {
			return str_replace( 'wp-login.php', $loginfile, $url );
		}

		if ( empty( $_SERVER['REQUEST_URI'] ) ) {
			return $url;
		}

		if ( false !== strpos( $_SERVER['REQUEST_URI'], $loginfile ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
			$url = str_replace( 'wp-login.php', $loginfile, $url );
		} elseif ( false !== strpos( $_SERVER['REQUEST_URI'], '/wp-activate.php' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput

			// phpcs:disable WordPress.Security.NonceVerification, WordPress.Security.ValidatedSanitizedInput -- <https://core.trac.wordpress.org/ticket/35370>.
			if ( isset( $_GET['key'] ) && isset( $_POST['key'] ) && $_GET['key'] !== $_POST['key'] ) {  // phpcs:ignore
				return $url;
			} elseif ( ! empty( $_GET['key'] ) ) {
				$key = $_GET['key'];
			} elseif ( ! empty( $_POST['key'] ) ) {
				$key = $_POST['key'];
			}
			if ( $key ) {
				$result = wpmu_activate_signup( $key );
			}
			// phpcs:enable

			$activate_cookie = 'wp-activate-' . COOKIEHASH;
			if ( null === $result && isset( $_COOKIE[ $activate_cookie ] ) ) {
				$result = wpmu_activate_signup( $_COOKIE[ $activate_cookie ] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
			}

			if ( null !== $result ) {
				if ( is_wp_error( $result ) ) {
					$error_code = $result->get_error_code();
				}
				if ( isset( $error_code ) || 'user_already_exists' === $error_code || 'already_active' === $error_code ) {
					$url = str_replace( 'wp-login.php', $loginfile, $url );
				}
			}
		}
		return $url;
	}

	/**
	 * Filter for site_url.
	 *
	 * @param string $url     URL.
	 * @param string $path    Path.
	 * @param string $scheme  Scheme.
	 * @param int    $blog_id Blog id.
	 */
	public function site_url( $url, $path, $scheme, $blog_id ) {
		if ( isset( $this->options['login_page_name'] ) ) {
			$loginfile     = $this->options['login_page_name'] . '.php';
			$formated_path = '/' . ltrim( $path, '/' );
			if ( '/wp-login.php' === $formated_path || preg_match( '#/wp-login\.php\?action=\w+#', $formated_path ) ) {
				$url = $this->get_login_url( $url, $loginfile );
			} elseif ( is_multisite() && ! is_subdomain_install() ) {
				$blog = get_site( $blog_id );
				if ( $blog->path . 'wp-login.php' === $formated_path || preg_match( '#' . $blog->path . 'wp-login\.php\?action=\w+#', $formated_path ) ) {
					$url = $this->get_login_url( $url, $loginfile );
				}
			}
		}
		return $url;
	}

	/**
	 * Filter for network_site_url.
	 *
	 * @param string $url     URL.
	 * @param string $path    Path.
	 * @param string $scheme  Scheme.
	 */
	public function network_site_url( $url, $path, $scheme ) {
		return $this->site_url( $url, $path, $scheme, get_current_blog_id() );
	}

	/**
	 * Filter for wp_redirect.
	 *
	 * @param string $location The path or URL to redirect to.
	 */
	public function login_page_wp_redirect( $location ) {
		if ( isset( $this->options['login_page_name'] ) ) {
			$loginfile = $this->options['login_page_name'] . '.php';
			if ( isset( $_SERVER['REQUEST_URI'] ) && false !== strpos( $_SERVER['REQUEST_URI'], $loginfile ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
				$location = str_replace( 'wp-login.php', $loginfile, $location );
			}
		}
		return $location;
	}

	/**
	 * Filter for template_redirect.
	 */
	public function recreate_login_file() {
		global $wp, $wp_filesystem;

		$login_page_filename = ( isset( $this->options['login_page_name'] ) ? $this->options['login_page_name'] . '.php' : '' );
		if ( $wp->request === $login_page_filename ) {
			$path = ABSPATH . $login_page_filename;
			if ( ! file_exists( $path ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
				if ( WP_Filesystem() ) {
					$loginfile_content = "<?php require_once './wp-login.php'; ?>";
					if ( $wp_filesystem->put_contents( $path, stripslashes( $loginfile_content ), FS_CHMOD_FILE ) ) {
						wp_safe_redirect( home_url( $login_page_filename ) );
						exit();
					}
				}
			}
		}
	}

	/**
	 * Filter for xmlrpc_enabled.
	 */
	public function xmlrpc_enabled() {
		$blocked_tarpit = isset( $this->options['blocked_tarpit'] ) ? (int) $this->options['blocked_tarpit'] : 0;
		if ( $blocked_tarpit > 0 ) {
			sleep( $blocked_tarpit );
		}
		return false;
	}

	/**
	 * Filter for xmlrpc_login_error.
	 *
	 * @param IXR_Error $error The XML-RPC error message.
	 */
	public function xmlrpc_login_error_message( $error ) {
		if ( isset( $this->options['error_login_message'] ) && $this->options['error_login_message'] ) {
			return new IXR_Error( 403, __( 'Incorrect username or password.', 'xo-security' ) );
		}
		return $error;
	}

	/**
	 * Filter for shake_error_codes.
	 *
	 * @param string[] $error_codes Error codes that shake the login form.
	 */
	public function login_failure_shake( $error_codes ) {
		$error_codes[] = 'limit_login';
		return $error_codes;
	}

	/**
	 * Filter for author_rewrite_rules.
	 */
	public function author_rewrite_rules() {
		return array();
	}

	/**
	 * Filter for wp_sitemaps_add_provider,
	 *
	 * @param WP_Sitemaps_Provider $provider Instance of a WP_Sitemaps_Provider.
	 * @param string               $name     Name of the sitemap provider.
	 */
	public function remove_author_sitemap_provider( $provider, $name ) {
		if ( 'users' === $name ) {
			return false;
		}
		return $provider;
	}

	/**
	 * Filter for init.
	 */
	public function author_rewrite() {
		if ( is_admin() ) {
			return;
		}

		if ( filter_input( INPUT_GET, 'author' ) ) {
			$this->redirect_404();
			exit;
		}

		if ( isset( $_SERVER['REQUEST_URI'] ) && preg_match( '#/author/.+#', esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) ) ) {
			$this->redirect_404();
			exit;
		}
	}

	/**
	 * Filter for comment_class.
	 *
	 * @param string[] $classes An array of comment classes.
	 */
	public function remove_comment_author_class( $classes ) {
		foreach ( $classes as $key => $class ) {
			if ( strstr( $class, 'comment-author-' ) ) {
				unset( $classes[ $key ] );
			}
		}
		return $classes;
	}

	/**
	 * Filter for oembed_response_data.
	 *
	 * @param array $data The response data.
	 */
	public function filter_oembed_response_data( $data ) {
		unset( $data['author_url'] );
		unset( $data['author_name'] );
		return $data;
	}

	/**
	 * Filter for xmlrpc_methods.
	 *
	 * @param array $methods an array of available XMLRPC methods.
	 */
	public function remove_pingback( $methods ) {
		unset( $methods['pingback.ping'] );
		unset( $methods['pingback.extensions.getPingbacks'] );
		return $methods;
	}

	/**
	 * Filter for wp_headers.
	 *
	 * @param string[] $headers Associative array of headers to be sent.
	 */
	public function remove_x_pingback( $headers ) {
		unset( $headers['X-Pingback'] );
		return $headers;
	}

	/**
	 * Get the IP address of the client.
	 *
	 * @since 2.4.0
	 *
	 * @return string|false The valid IP address, otherwise false.
	 */
	public function get_auto_ipaddress() {
		$ip = false;
		if ( ! empty( $_SERVER['HTTP_X_REAL_IP'] ) ) {
			$ip = filter_var( wp_unslash( $_SERVER['HTTP_X_REAL_IP'] ), FILTER_VALIDATE_IP );
		} elseif ( ! empty( $_SERVER['REMOTE_ADDR'] ) ) {
			$ip = filter_var( wp_unslash( $_SERVER['REMOTE_ADDR'] ), FILTER_VALIDATE_IP );
		} elseif ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
			$ips = explode( ',', wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$ip  = filter_var( trim( $ips[0] ), FILTER_VALIDATE_IP );
		} elseif ( ! empty( $_SERVER['HTTP_CLIENT_IP'] ) ) {
			$ip = filter_var( wp_unslash( $_SERVER['HTTP_CLIENT_IP'] ), FILTER_VALIDATE_IP );
		}
		return $ip;
	}

	/**
	 * Get the IP address of the client.
	 *
	 * @since 1.0.0
	 *
	 * @return string The valid IP address, otherwise ''.
	 */
	private function get_ipaddress() {
		$mode = isset( $this->options['ip_mode'] ) ? $this->options['ip_mode'] : '';

		$ip = false;
		if ( 'remote_addr' === $mode ) {
			if ( ! empty( $_SERVER['REMOTE_ADDR'] ) ) {
				$ip = filter_var( wp_unslash( $_SERVER['REMOTE_ADDR'] ), FILTER_VALIDATE_IP );
			}
		} elseif ( 'http_x_forward_for_1' === $mode || 'http_x_forward_for_2' === $mode || 'http_x_forward_for_3' === $mode ) {
			if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
				$ips = explode( ',', wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
				$ips = array_pad( $ips, 3, '' );
				switch ( $mode ) {
					case 'http_x_forward_for_2':
						$ip = filter_var( trim( $ips[1] ), FILTER_VALIDATE_IP );
						break;
					case 'http_x_forward_for_3':
						$ip = filter_var( trim( $ips[2] ), FILTER_VALIDATE_IP );
						break;
					default:
						$ip = filter_var( trim( $ips[0] ), FILTER_VALIDATE_IP );
				}
			}
		} elseif ( 'http_x_real_ip' === $mode ) {
			if ( ! empty( $_SERVER['HTTP_X_REAL_IP'] ) ) {
				$ip = filter_var( wp_unslash( $_SERVER['HTTP_X_REAL_IP'] ), FILTER_VALIDATE_IP );
			}
		} elseif ( 'http_client_ip' === $mode ) {
			if ( ! empty( $_SERVER['HTTP_CLIENT_IP'] ) ) {
				$ip = filter_var( wp_unslash( $_SERVER['HTTP_CLIENT_IP'] ), FILTER_VALIDATE_IP );
			}
		} else {
			$ip = $this->get_auto_ipaddress();
		}

		if ( $ip ) {
			return $ip;
		}
		return '';
	}

	/**
	 * Get USER AGENT.
	 */
	private function get_user_agent() {
		$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
		return substr( $user_agent, 0, 254 );
	}

	/**
	 * Get the browser's main language.
	 */
	public function get_language() {
		$result = null;
		if ( isset( $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) ) {
			$langs = explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) ) );
			if ( count( $langs ) >= 1 ) {
				$main_lang = explode( ';', $langs[0] );
				if ( count( $main_lang ) >= 1 ) {
					$result = substr( trim( $main_lang[0] ), 0, 5 );
				}
			}
		}
		return $result;
	}

	/**
	 * Record login failures.
	 *
	 * @since 1.7.0
	 *
	 * @param string $username Username for authentication.
	 */
	public function failed_login( $username ) {
		global $wpdb;

		if ( empty( $username ) ) {
			return;
		}

		$login_time = current_time( 'mysql' );
		$ip_address = $this->get_ipaddress();
		$type       = $this->get_login_type_value();
		$lang       = $this->get_language();
		$user_agent = $this->get_user_agent();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$wpdb->insert(
			$wpdb->prefix . 'xo_security_loginlog',
			array(
				'success'    => 0,
				'login_time' => $login_time,
				'ip_address' => $ip_address,
				'login_type' => $type,
				'lang'       => $lang,
				'user_agent' => $user_agent,
				'user_name'  => $username,
			)
		);
	}

	/**
	 * Record login successful.
	 *
	 * @since 1.7.0
	 *
	 * @param string $user WP_User Current WP_User instance.
	 * @param string $type Login type.
	 */
	private function successful_login( $user, $type ) {
		global $wpdb;

		$user_name  = $user->user_login;
		$login_time = current_time( 'mysql' );
		$ip_address = $this->get_ipaddress();
		$lang       = $this->get_language();
		$user_agent = $this->get_user_agent();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$wpdb->insert(
			$wpdb->prefix . 'xo_security_loginlog',
			array(
				'success'    => 1,
				'login_time' => $login_time,
				'ip_address' => $ip_address,
				'login_type' => $type,
				'lang'       => $lang,
				'user_agent' => $user_agent,
				'user_name'  => $user_name,
			)
		);

		// Automatic deletion of old login log.
		$truncate_date = isset( $this->options['auto_truncate'] ) ? intval( $this->options['auto_truncate'] ) : 0;
		if ( $truncate_date > 0 ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->prefix}xo_security_loginlog WHERE login_time <= DATE_SUB(NOW(), INTERVAL %d day)", $truncate_date ) );
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$id = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}xo_security_loginlog ORDER BY id DESC LIMIT %d,1;", self::MAX_LOGIN_LOG_RECORDS ), 0, 0 );
		if ( null !== $id ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->prefix}xo_security_loginlog WHERE id <= %d;", $id ) );
		}

		$login_alert = isset( $this->options['login_alert'] ) ? $this->options['login_alert'] : false;
		if ( $login_alert ) {
			$login_alert_admin_only = isset( $this->options['login_alert_admin_only'] ) ? $this->options['login_alert_admin_only'] : false;
			if ( $login_alert_admin_only ) {
				if ( $user->has_cap( 'administrator' ) ) {
					$this->send_login_mail( $user, $ip_address, $user_agent );
				}
			} else {
				$this->send_login_mail( $user, $ip_address, $user_agent );
			}
		}
	}

	/**
	 * Send login mail.
	 *
	 * @param string $user       User name.
	 * @param string $ip_address IP address.
	 * @param string $user_agent User agent.
	 */
	private function send_login_mail( $user, $ip_address, $user_agent ) {
		$user_email = $user->user_email;

		$user_name = $user->user_login;
		$site_name = get_bloginfo( 'name' );
		$subject   = isset( $this->options['login_alert_subject'] ) ? $this->options['login_alert_subject'] : '';
		$body      = isset( $this->options['login_alert_body'] ) ? $this->options['login_alert_body'] : '';

		$subject = str_replace( array( '%SITENAME%', '%USERNAME%', '%DATE%', '%TIME%', '%IPADDRESS%', '%USERAGENT%' ), array( $site_name, $user_name, date_i18n( 'Y-m-d' ), date_i18n( 'H:i:s' ), $ip_address, $user_agent ), $subject );
		$body    = str_replace( array( '%SITENAME%', '%USERNAME%', '%DATE%', '%TIME%', '%IPADDRESS%', '%USERAGENT%' ), array( $site_name, $user_name, date_i18n( 'Y-m-d' ), date_i18n( 'H:i:s' ), $ip_address, $user_agent ), $body );

		wp_mail( $user_email, esc_html( $subject ), esc_html( $body ) );
	}

	/**
	 * Check login.
	 */
	private function is_login_ok() {
		global $wpdb;

		$locked = false;

		$ipaddress = $this->get_ipaddress();

		$interval_hour = isset( $this->options['interval'] ) ? (int) $this->options['interval'] : 0;
		if ( $interval_hour > 0 ) {
			$time = gmdate( 'Y-m-d H:i:s', (int) strtotime( current_time( 'mysql' ) ) - ( $interval_hour * 60 * 60 ) );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$login_time = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT login_time FROM {$wpdb->prefix}xo_security_loginlog WHERE ip_address = %s AND success = 1 ORDER BY login_time DESC LIMIT 1;",
					$ipaddress
				)
			);

			if ( null !== $login_time ) {
				$time = max( $time, $login_time );
			}

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$count = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COUNT(*) FROM {$wpdb->prefix}xo_security_loginlog WHERE ip_address = %s AND success = 0 AND login_time > %s;",
					$ipaddress,
					$time
				)
			);

			$limit_count = isset( $this->options['limit_count'] ) ? (int) $this->options['limit_count'] : 1;
			if ( $count >= $limit_count ) {
				$locked = true;
			}
		}

		if ( ! $locked ) {
			$user_agent = $this->get_user_agent();
			if ( '' === $user_agent ) {
				$locked = true;
			} else {
				if ( defined( 'XO_SECURITY_UA_WHITE_LIST' ) && XO_SECURITY_UA_WHITE_LIST !== '' ) {
					$locked = true;
					$whites = explode( ',', XO_SECURITY_UA_WHITE_LIST );
					foreach ( $whites as $white ) {
						if ( ! ( stripos( $user_agent, $white ) === false ) ) {
							$locked = false;
							break;
						}
					}
				}
				if ( ! $locked ) {
					if ( defined( 'XO_SECURITY_UA_BLACK_LIST' ) && XO_SECURITY_UA_BLACK_LIST !== '' ) {
						$blocks = explode( ',', XO_SECURITY_UA_BLACK_LIST );
						foreach ( $blocks as $block ) {
							if ( ! ( stripos( $user_agent, $block ) === false ) ) {
								$locked = true;
								break;
							}
						}
					}
				}
			}
		}

		return ! $locked;
	}

	/**
	 * Filter for login_form.
	 */
	public function login_form() {
		$char_mode    = isset( $this->options['login_captcha'] ) ? $this->options['login_captcha'] : 'en';
		$captcha_type = isset( $this->options['captcha_type'] ) ? $this->options['captcha_type'] : 'default';

		switch ( $captcha_type ) {
			case 'default':
				$font = 'mplus';
				break;
			case 'chokokutai':
				$font = 'chokokutai';
				break;
			default:
				$font = '';
		}

		$src = XO_SECURITY_URL . '/captcha/captcha.php?prefix=login&char_mode=' . rawurlencode( $char_mode ) . '&font=' . rawurlencode( $font );

		echo '<p><img id="xo-security-captcha" src="' . esc_url( $src ) . '" alt="CAPTCHA" width="100" height="36"></p>';
		echo '<p>';
		echo '<label for="xo_security_captcha">' . esc_html__( 'CAPTCHA Code', 'xo-security' ) . '</label><br />';
		echo '<input type="text" name="xo_security_captcha" id="xo_security_captcha" class="input" value="" size="10" aria-required="true" autocomplete="off" required="required" />';
		echo '</p>' . "\n";
	}

	/**
	 * Display comment form captcah.
	 */
	public function display_comment_form_captcah() {
		$char_mode    = isset( $this->options['comment_captcha'] ) ? $this->options['comment_captcha'] : 'en';
		$captcha_type = isset( $this->options['captcha_type'] ) ? $this->options['captcha_type'] : 'default';

		switch ( $captcha_type ) {
			case 'default':
				$font = 'mplus';
				break;
			case 'chokokutai':
				$font = 'chokokutai';
				break;
			default:
				$font = '';
		}

		$src = XO_SECURITY_URL . '/captcha/captcha.php?prefix=comment&char_mode=' . rawurlencode( $char_mode ) . '&font=' . rawurlencode( $font );

		echo '<p><img id="xo-security-captcha" src="' . esc_url( $src ) . '" alt="CAPTCHA" width="100" height="36" loading="lazy"></p>';
		echo '<p class="comment-form-captcha">';
		echo '<label for="xo_security_captcha">' . esc_html__( 'CAPTCHA Code', 'xo-security' ) . '</label>';
		echo '<input type="text" name="xo_security_captcha" id="xo_security_captcha" value="" size="10" aria-required="true" autocomplete="off" required="required" />';
		echo '</p>' . "\n";
	}

	/**
	 * Filter for comment_form_after_fields and comment_form_logged_in_after.
	 */
	public function comment_form_captcha_field() {
		remove_action( 'comment_form', array( $this, 'comment_form_captcha' ) );
		$this->display_comment_form_captcah();
	}

	/**
	 * Filter for comment_form.
	 */
	public function comment_form_captcha() {
		$this->display_comment_form_captcah();
	}

	/**
	 * Filter for preprocess_comment.
	 *
	 * @param array $comment All data for a specific comment.
	 */
	public function preprocess_comment_captcha( $comment ) {
		if ( isset( $_POST['action'] ) && 'replyto-comment' === $_POST['action'] &&
			( check_ajax_referer( 'replyto-comment', '_ajax_nonce', false ) || check_ajax_referer( 'replyto-comment', '_ajax_nonce-replyto-comment', false ) )
		) {
			return $comment;
		}
		if ( '' !== $comment['comment_type'] && 'comment' !== $comment['comment_type'] ) {
			return $comment;
		}
		if ( ! empty( $_SESSION['xo_security_captcha_comment'] ) && ! empty( $_POST['xo_security_captcha'] ) ) {
			if ( $_SESSION['xo_security_captcha_comment'] === $_POST['xo_security_captcha'] ) {
				return $comment;
			}
		}
		wp_die(
			wp_kses( __( '<strong>Error:</strong> Invalid CAPTCHA code.', 'xo-security' ), array( 'strong' => array() ) ),
			esc_html__( 'Error', 'xo-security' ),
			array( 'back_link' => true )
		);
	}

	/**
	 * Display comment form bot field.
	 */
	public function display_comment_form_bot_field() {
		echo '<p class="comment-form-bot-check">';
		echo '<input id="comment-form-bot-check" name="comment-form-bot-check" type="checkbox" value="yes">';
		echo '<label for="comment-form-bot-check" class="comment-notes" style="display: inline;">' . esc_html__( "I'm not a robot.", 'xo-security' ) . '</label>';
		echo '</p>';
		echo '<script type="text/javascript">
				let isHuman = false;
				setTimeout(() => {
					window.addEventListener("mousemove", () => {
						isHuman = true;
					});
					window.addEventListener("keypress", () => {
						isHuman = true;
					});
				}, 3000);
				document.getElementById("commentform").addEventListener("submit", () => {
					if ( isHuman ) {
						document.getElementById("comment-form-bot-check").value = "OK";
					}
				});
			</script>';
	}

	/**
	 * Filter for comment_form_after_fields and comment_form_logged_in_after.
	 */
	public function comment_form_bot_field() {
		remove_action( 'comment_form', array( $this, 'comment_form_bot' ) );
		$this->display_comment_form_bot_field();
	}

	/**
	 * Filter for comment_form.
	 */
	public function comment_form_bot() {
		$this->display_comment_form_bot_field();
	}

	/**
	 * Filter for preprocess_comment.
	 *
	 * @param array $comment All data for a specific comment.
	 */
	public function preprocess_comment_bot( $comment ) {
		// phpcs:disable WordPress.Security.NonceVerification.Missing
		$check = isset( $_POST['comment-form-bot-check'] ) ? sanitize_text_field( wp_unslash( $_POST['comment-form-bot-check'] ) ) : '';

		if ( '' === $check ) {
			wp_die( wp_kses( __( '<strong>Error:</strong> Please check the anti-bot checkbox.', 'xo-security' ), array( 'strong' => array() ) ), esc_html__( 'Error', 'xo-security' ), array( 'back_link' => true ) );
		} elseif ( 'OK' !== $check ) {
			wp_die( wp_kses( __( '<strong>Error:</strong> Please enable JavaScript in your browser.', 'xo-security' ), array( 'strong' => array() ) ), esc_html__( 'Error', 'xo-security' ), array( 'back_link' => true ) );
		}

		return $comment;
	}

	/**
	 * Filter for comment_form_field_comment.
	 *
	 * @param string $field The content of the comment textarea field.
	 */
	public function comment_form_field_comment_spam( $field ) {
		if (
			( isset( $this->options['comment_spam'] ) && $this->options['comment_spam'] )
			&& ( isset( $this->options['comment_spam_message'] ) && $this->options['comment_spam_message'] )
		) {
			$field .= '<p class="comment-comment-message">' . esc_html( $this->options['comment_spam_message'] ) . '</p>';
		}
		return $field;
	}

	/**
	 * Filter for preprocess_comment.
	 *
	 * @param array $comment All data for a specific comment.
	 */
	public function preprocess_comment_spam( $comment ) {
		$is_spam = false;

		if ( isset( $this->options['comment_spam'] ) && $this->options['comment_spam'] ) {
			$comment_content = stripslashes( $comment['comment_content'] );
			if ( ! preg_match( '/[ぁ-ん]+/u', $comment_content ) ) {
				$is_spam = true;
			}
		}

		if ( isset( $this->options['comment_spam_email'] ) && $this->options['comment_spam_email'] ) {
			$spam = get_comments(
				array(
					'status'       => 'spam',
					'number'       => 1,
					'author_email' => $comment['comment_author_email'],
					'count'        => true,
				)
			);
			if ( $spam > 0 ) {
				$is_spam = true;
			}
		}

		if ( $is_spam ) {
			$action = isset( $this->options['comment_spam_action'] ) ? $this->options['comment_spam_action'] : 'block';
			if ( 'spam' === $action ) {
				$comment['spam'] = true;
			} elseif ( 'trash' === $action ) {
				$comment['trash'] = true;
			} else {
				wp_die( wp_kses( __( '<strong>Error:</strong> Invalid Comment.', 'xo-security' ), array( 'strong' => array() ) ), esc_html__( 'Error', 'xo-security' ), array( 'back_link' => true ) );
			}
		}

		return $comment;
	}

	/**
	 * Filter for pre_comment_approved.
	 *
	 * @param int|string|WP_Error $approved    See pre_comment_approved hook.
	 * @param array               $commentdata See pre_comment_approved hook.
	 */
	public function pre_comment_approved( $approved, $commentdata ) {
		if ( isset( $commentdata['spam'] ) && $commentdata['spam'] ) {
			$approved = 'spam';
		} elseif ( isset( $commentdata['trash'] ) && $commentdata['trash'] ) {
			$approved = 'trash';
		}
		return $approved;
	}

	/**
	 * Filter for gettext.
	 *
	 * @param string $translation See gettext hook.
	 * @param string $text        See gettext hook.
	 * @param string $domain      See gettext hook.
	 */
	public function gettext_password_reset( $translation, $text, $domain ) {
		if ( 'default' === $domain && 'Lost your password?' === $text ) {
			$translation = '';
		}
		return $translation;
	}

	/**
	 * Filter for lost_password_html_link.
	 *
	 * @since 3.7.0
	 *
	 * @param string $html_link HTML link to the lost password form.
	 */
	public function lost_password_html_link( $html_link ) {
		$html_link = '';
		return $html_link;
	}

	/**
	 * Filter for gettext_with_context.
	 *
	 * @param string $translation See gettext_with_context.
	 * @param string $text        See gettext_with_context.
	 * @param string $context     See gettext_with_context.
	 * @param string $domain      See gettext_with_context.
	 */
	public function gettext_login_site_link( $translation, $text, $context, $domain ) {
		if ( 'default' === $domain && 'site' === $context ) {
			// WP 4.6-5.5: '&larr; Back to %s'.
			// WP 5.6:     '&larr; Go to %s'.
			if ( '&larr; Back to %s' === $text || '&larr; Go to %s' === $text ) {
				$translation = '';
			}
		}
		return $translation;
	}

	/**
	 * Filter for login_site_html_link.
	 *
	 * @param string $link HTML link to the home URL of the current site.
	 */
	public function login_site_html_link( $link ) {
		$link = '';
		return $link;
	}

	/**
	 * Filter for style_loader_src and script_loader_src.
	 *
	 * @param string $src Loader source path.
	 */
	public function remove_meta_tag_version( $src ) {
		global $wp_version;

		if ( ! empty( $src ) && false !== strpos( $src, '?ver=' . $wp_version ) ) {
			$src = add_query_arg( 'ver', $this->hash_version, $src );
		}
		return $src;
	}

	/**
	 * Rewrite author base.
	 *
	 * @since 3.10.0
	 */
	public function rewrite_author_base() {
		if ( ! empty( $this->options['author_base'] ) && 'author' !== $this->options['author_base'] ) {
			global $wp_rewrite;
			$wp_rewrite->author_base = $this->options['author_base'];
		}
	}

	/**
	 * Disable RSS and Atom feeds.
	 *
	 * @since 3.1.0
	 */
	public function disable_feed() {
		remove_action( 'do_feed_rdf', 'do_feed_rdf', 10, 0 );
		remove_action( 'do_feed_rss', 'do_feed_rss', 10, 0 );
		remove_action( 'do_feed_rss2', 'do_feed_rss2', 10, 1 );
		remove_action( 'do_feed_atom', 'do_feed_atom', 10, 1 );

		remove_action( 'wp_head', 'feed_links', 2 );
		remove_action( 'wp_head', 'feed_links_extra', 3 );
	}

	/**
	 * Filter for cron_schedules.
	 *
	 * @since 3.6.0
	 *
	 * @param array $current_schedules Currently defined schedules list.
	 */
	public function cron_schedules( $current_schedules ) {
		if ( ! isset( $current_schedules['monthly'] ) ) {
			$current_schedules['monthly'] = array(
				'interval' => MONTH_IN_SECONDS,
				'display'  => __( 'Once Monthly', 'xo-security' ),
			);
		}
		return $current_schedules;
	}

	/**
	 * Schedule event.
	 *
	 * @since 3.6.0
	 */
	public function init() {
		if ( ! wp_next_scheduled( 'xo_security_optimize_table' ) ) {
			wp_schedule_event( time() + 10, 'monthly', 'xo_security_optimize_table' );
		}
	}

	/**
	 * Optimize table.
	 *
	 * @since 3.6.0
	 *
	 * @global wpdb $wpdb WordPress database abstraction object.
	 */
	public function optimize_table() {
		global $wpdb;

		// Exclude SQLite.
		if ( ! empty( $wpdb->is_mysql ) ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->query( "OPTIMIZE TABLE {$wpdb->prefix}xo_security_loginlog" );
		}
	}

	/**
	 * Delete the WordPress core readme.txt file.
	 *
	 * @since 3.8.1
	 *
	 * @return bool True on success, false on failure.
	 */
	public static function delete_readme_file() {
		global $wp_filesystem;

		if ( empty( $wp_filesystem ) ) {
			require_once ABSPATH . '/wp-admin/includes/file.php';
			if ( ! WP_Filesystem() ) {
				return false;
			}
		}

		$file = ABSPATH . 'readme.html';

		if ( file_exists( $file ) ) {
			if ( ! $wp_filesystem->delete( $file ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Fires after WordPress core has been successfully updated.
	 *
	 * @since 3.8.1
	 */
	public function core_updated_successfully() {
		global $action;

		if ( isset( $action ) && ( 'do-core-upgrade' === $action || 'do-core-reinstall' === $action ) ) {
			show_message( __( 'Deleting readme.html&#8230;', 'xo-security' ) );
		}

		$this->delete_readme_file();
	}

	/**
	 * Filters the error codes array for shaking the login form.
	 *
	 * @since 3.10.0
	 *
	 * @param string[] $shake_error_codes Error codes that shake the login form.
	 */
	public function shake_error_codes( $shake_error_codes ) {
		$shake_error_codes[] = 'captcha_login';
		return $shake_error_codes;
	}
}
