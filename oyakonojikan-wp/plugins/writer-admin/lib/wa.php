<?php

class WA {
	protected $templates = array();
	protected $config = array();

	protected $view_vars = array();
	protected $admin_view_vars = array();

	/**
	 * WA constructor.
	 */
	protected function __construct() {
		$this->register_hooks();

		add_action( 'init', array( $this, 'init' ) );
		add_action( 'admin_menu', array( $this, 'register_option_pages' ) );
	}

	public function register_option_pages() {
		add_menu_page( 'Writer Admin', 'Writer Admin', 'manage_options', WA_BASE_NAME, '', 'dashicons-index-card', 100 );
		add_submenu_page( WA_BASE_NAME, '設定', '設定', 'manage_options', WA_BASE_NAME, 'WA::dispatch_plugin_page' );
	}

	public function init() {
		$this->parse_config();
		$this->parse_templates();

		do_action( 'wa/init' );
	}

	public function admin_enqueue_scripts() {
		wp_enqueue_style( 'wa-select2', WA_URL . 'admin/assets/css/select2.css' );
		wp_enqueue_style( 'wa-style', WA_URL . 'admin/assets/css/style.css' );

		wp_enqueue_script( 'wa-select2', WA_URL . 'admin/assets/js/select2/select2.full.js', array( 'jquery' ) );
		wp_enqueue_script( 'wa-common', WA_URL . 'admin/assets/js/common.js', array( 'jquery' ) );
	}

	public function action() {
		$this->check_writer_logged_in();
		$this->check_logout();

		if ( static::is_writer_page() ) {
			$template = static::get_template( pathinfo( get_page_template_slug(), PATHINFO_BASENAME ) );
			$action   = static::get_action( pathinfo( get_page_template_slug(), PATHINFO_BASENAME ) );

			if ( $action ) {
				$results = include( $action );

				if ( is_array( $results ) && ! empty( $results ) ) {
					$this->view_vars = $results;
				}
			}
		}
	}

	public function include_view( $default_template ) {
		if ( static::is_writer_page() ) {
			$template = static::get_template( pathinfo( get_page_template_slug(), PATHINFO_BASENAME ) );

			if ( $template ) {
				if ( $this->view_vars ) {
					extract( $this->view_vars, EXTR_OVERWRITE );
					$this->view_vars = array();
				}

				include $template;
				exit();
			}
		}

		return $default_template;
	}

	public function admin_action() {
		global $plugin_page;

		if ( $plugin_page ) {
			$action = static::get_admin_action( $plugin_page );

			if ( file_exists( $action ) ) {
				$results = include( $action );

				if ( is_array( $results ) && ! empty( $results ) ) {
					$this->admin_view_vars = $results;
				}
			}
		}
	}

	public function include_admin_view() {
		global $plugin_page;

		require_once ABSPATH . 'wp-admin/admin-header.php';

		if ( $this->admin_view_vars ) {
			extract( $this->admin_view_vars, EXTR_OVERWRITE );
			$this->admin_view_vars = array();
		}

		require_once static::get_admin_template( $plugin_page );
		require_once ABSPATH . 'wp-admin/admin-footer.php';

		exit();
	}

	public function register_templates( $post_templates ) {
		$post_templates = array_merge( $post_templates, $this->templates );

		return $post_templates;
	}

	public function register_template_dir( $dirs ) {
		$dirs[] = WA_PATH . 'templates';

		return $dirs;
	}

	public function register_config_file( $configs ) {
		$configs[] = WA_PATH . 'config.yml';

		return $configs;
	}

	public function register_admin_view() {
		global $plugin_page, $pagenow, $typenow;

		$template = static::get_admin_template( $plugin_page );

		if ( file_exists( $template ) ) {
			if ( ! empty( $typenow ) ) {
				$the_parent = $pagenow . '?post_type=' . $typenow;

			} else {
				$the_parent = $pagenow;
			}

			$hook = get_plugin_page_hookname( $plugin_page, $the_parent );

			add_action( 'load-' . $hook, array( $this, 'include_admin_view' ) );
		}
	}

	protected function register_hooks() {
		add_action( '_admin_menu', array( $this, 'admin_action' ) );
		add_action( 'admin_init', array( $this, 'register_admin_view' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
		add_action( 'theme_page_templates', array( $this, 'register_templates' ), 10 );
		add_action( 'template_include', array( $this, 'include_view' ), 10 );
		add_action( 'template_redirect', array( $this, 'action' ), 10 );
		add_action( 'wa/get_template_dirs', array( $this, 'register_template_dir' ), 10 );
		add_action( 'wa/get_config_files', array( $this, 'register_config_file' ), 10 );
	}

	protected function parse_templates() {
		$page_templates = wp_cache_get( 'wa_page_templates' );

		if ( ! $page_templates ) {
			$page_templates = array();

			foreach ( static::get_template_dirs() as $template_dir ) {
				$templates = static::scandir( $template_dir, 'php', 0, 'wa/' );

				if ( $templates ) {
					foreach ( $templates as $file_name => $file_path ) {
						if ( ! preg_match( '|Template Name:(.*)$|mi', file_get_contents( $file_path ), $header ) || array_key_exists( $file_name, $page_templates ) ) {
							continue;
						}

						$page_templates[ $file_name ] = '[' . static::get_config( 'title.full' ) . '] ' . _cleanup_header_comment( $header[1] );
					}
				}
			}

			wp_cache_set( 'wa_page_templates', $page_templates );
		}

		$this->templates = $page_templates;
	}

	protected function parse_config() {
		$config = wp_cache_get( 'wa_config' );

		if ( ! $config ) {
			$config = array();

			foreach ( static::get_config_files() as $config_file ) {
				$tmp_config = Symfony\Component\Yaml\Yaml::parse( file_get_contents( $config_file ) );

				if ( $tmp_config ) {
					$config = static::array_merge_deep( $config, $tmp_config );
				}
			}
		}

		$this->config = $config;
	}

	protected function check_writer_logged_in() {
		if ( WA::is_writer_page() ) {
			if ( ! WA_User::is_logged_in() ) {
				$login_url    = WA_View::get_link( 'login' );
				$exclude_urls = array(
					$login_url,
					WA_View::get_link( 'password_reset' ),
					WA_View::get_link( 'password_forget' )
				);

				if ( $login_url ) {
					$accept = false;

					if ( $exclude_urls ) {
						foreach ( $exclude_urls as $exclude_url ) {
							if ( WA::compare_url( $exclude_url, iwf_get_current_url() ) ) {
								$accept = true;
								break;
							}
						}
					}

					if ( ! $accept ) {
						wp_redirect( $login_url );
						exit();
					}
				}
			}
		}
	}

	protected function check_logout() {
		if ( filter_input( INPUT_GET, 'wa_logout' ) ) { // ログアウト処理
			wp_logout();
			$logout_redirect = WA_View::get_link( 'login' );

			if ( ! $logout_redirect ) {
				$logout_redirect = home_url();
			}

			wp_redirect( $logout_redirect );
			exit();
		}
	}

	public static function get_instance() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new WA();
		}

		return $instance;
	}

	public static function get_config( $key = null ) {
		return $key ? iwf_get_array( static::get_instance()->config, $key ) : static::get_instance()->config;
	}

	public static function get_template_dirs() {
		return (array) apply_filters( 'wa/get_template_dirs', array() );
	}

	public static function get_config_files() {
		return (array) apply_filters( 'wa/get_config_files', array() );
	}

	public static function get_template( $template, $relative_path = '' ) {
		$relative_path = trailingslashit( $relative_path );

		if ( $relative_path === '/' ) {
			$relative_path = '';
		}

		foreach ( static::get_template_dirs() as $dir ) {
			$file = trailingslashit( $dir ) . $relative_path . $template;

			if ( file_exists( $file ) ) {
				return apply_filters( 'wa/get_template', $file, $template, $relative_path );
			}
		}

		return false;
	}

	public static function get_action( $template, $relative_path = '' ) {
		$relative_path = trailingslashit( $relative_path );

		if ( $relative_path === '/' ) {
			$relative_path = '';
		}

		foreach ( static::get_template_dirs() as $dir ) {
			$file = trailingslashit( dirname( $dir ) ) . 'actions/' . $relative_path . $template;

			if ( file_exists( $file ) ) {
				return apply_filters( 'wa/get_action', $file, $template, $relative_path );
			}
		}

		return false;
	}

	public static function get_admin_template( $plugin_page ) {
		$plugin_name = pathinfo( $plugin_page, PATHINFO_DIRNAME );
		$base_name   = pathinfo( $plugin_page, PATHINFO_FILENAME );
		$ext         = pathinfo( $plugin_page, PATHINFO_EXTENSION );

		if ( ! $ext ) {
			$ext = 'php';
		}

		$action        = isset( $_REQUEST['action'] ) ? '/' . $_REQUEST['action'] : '';
		$template_file = WP_PLUGIN_DIR . '/' . $plugin_name . '/admin/templates/' . $base_name . $action . '.' . $ext;

		return apply_filters( 'wa/get_admin_template', $template_file, $plugin_page );
	}

	public static function get_admin_meta_box_template( $metabox_id ) {
		list( $plugin_name, $metabox_id ) = explode( ':', $metabox_id );

		$template_file = WP_PLUGIN_DIR . '/' . $plugin_name . '/admin/templates/meta_boxes/' . $metabox_id . '.php';

		return apply_filters( 'wa/get_admin_meta_box_template', $template_file, $metabox_id );
	}

	public static function get_admin_action( $plugin_page ) {
		$plugin_name = pathinfo( $plugin_page, PATHINFO_DIRNAME );
		$base_name   = pathinfo( $plugin_page, PATHINFO_FILENAME );

		$action      = isset( $_REQUEST['action'] ) ? '/' . $_REQUEST['action'] : '';
		$action_file = WP_PLUGIN_DIR . '/' . $plugin_name . '/admin/actions/' . $base_name . $action . '.php';

		return apply_filters( 'wa/get_admin_action', $action_file, $plugin_page );
	}

	public static function dispatch_plugin_page() {
		global $plugin_page;

		$template_file = static::get_admin_template( $plugin_page );

		if ( ! file_exists( $template_file ) ) {
			wp_die( 'テンプレートファイルが見つかりません - ' . $template_file );
		}

		include_once $template_file;
	}

	public static function include_meta_box_view( $object, $box ) {
		$template_file = WA::get_admin_meta_box_template( $box['id'] );

		if ( file_exists( $template_file ) ) {
			include $template_file;
		}
	}

	public static function is_writer_page() {
		if ( is_page() ) {
			$page_slug = get_page_template_slug();

			return isset( static::get_instance()->templates[ $page_slug ] );
		}

		return false;
	}

	public static function compare_url( $url_1, $url_2 ) {
		$url_1 = parse_url( $url_1 );
		$url_2 = parse_url( $url_2 );

		unset( $url_1['fragment'], $url_2['fragment'] );

		if ( ! empty( $url_1['query'] ) ) {
			parse_str( $url_1['query'], $url_1['query'] );

			if ( ! empty( $url_1['query']['page_id'] ) ) {
				$url_1['page_id'] = $url_1['query']['page_id'];
			}

			unset( $url_1['query'] );
		}

		if ( ! empty( $url_2['query'] ) ) {
			parse_str( $url_2['query'], $url_2['query'] );

			if ( ! empty( $url_2['query']['page_id'] ) ) {
				$url_2['page_id'] = $url_2['query']['page_id'];
			}

			unset( $url_2['query'] );
		}

		return $url_1 == $url_2;
	}

	public static function format_file_size( $size ) {
		$b  = 1024;
		$mb = pow( $b, 2 );
		$gb = pow( $b, 3 );

		switch ( true ) {
			case $size >= $gb:
				$target = $gb;
				$unit   = 'GB';
				break;

			case $size >= $mb:
				$target = $mb;
				$unit   = 'MB';
				break;

			default:
				$target = $b;
				$unit   = 'KB';
				break;
		}

		return number_format( round( $size / $target, 2 ), 2, '.', ',' ) . $unit;
	}

	public static function array_merge_deep( array $data, $merge ) {
		$args   = array_slice( func_get_args(), 1 );
		$return = $data;

		foreach ( $args as &$cur_arg ) {
			$stack[] = array( (array) $cur_arg, &$return );
		}

		unset( $cur_arg );

		while ( ! empty( $stack ) ) {
			foreach ( $stack as $cur_key => &$cur_merge ) {
				foreach ( $cur_merge[0] as $key => &$val ) {
					if ( ! empty( $cur_merge[1][ $key ] ) && (array) $cur_merge[1][ $key ] === $cur_merge[1][ $key ] && (array) $val === $val ) {
						$stack[] = array( &$val, &$cur_merge[1][ $key ] );

					} elseif ( (int) $key === $key && isset( $cur_merge[1][ $key ] ) ) {
						$cur_merge[1][] = $val;

					} else {
						$cur_merge[1][ $key ] = $val;
					}
				}

				unset( $stack[ $cur_key ] );
			}

			unset( $cur_merge );
		}

		return $return;
	}

	public static function template_mail( $to, $vars, $template_id, $to_admin = false ) {
		$template_id           = $to_admin ? 'mail_admin.' . $template_id : 'mail.' . $template_id;
		$template_relative_dir = $to_admin ? 'email/admin/' : 'email/';

		$subject   = apply_filters( 'wa/template_mail/mail_subject', WA::get_config( $template_id . '.subject' ) ?: '(No Subject)' );
		$from      = apply_filters( 'wa/template_mail/mail_from_address', WA::get_config( $template_id . '.from_address' ) ?: get_option( 'admin_email' ) );
		$from_name = apply_filters( 'wa/template_mail/mail_from_name', WA::get_config( $template_id . '.from_name' ) ?: get_bloginfo( 'name' ) );

		$mail_template_file = WA::get_template( WA::get_config( $template_id . '.file' ), $template_relative_dir );
		$mail_template      = file_exists( $mail_template_file ) ? file_get_contents( $mail_template_file ) : '';
		$mail_template      = apply_filters( 'wa/template_mail/mail_template', $mail_template );

		return static::mail( $mail_template, $to, $subject, $from, $from_name, $vars );
	}

	public static function mail( $template, $to, $subject, $from = null, $from_name = null, $vars = array() ) {
		if ( ! is_array( $vars ) ) {
			$vars = array( $vars );
		}

		foreach ( $vars as $i => $var ) {
			if ( is_array( $var ) ) {
				$vars[ $i ] = array_values( $var );
			}
		}

		$mail_body = IWF_View_Template_Text::replace( $template, $vars, '%' );

		if ( ! $from_name && $from ) {
			$from_name = $from;
		}

		$headers = $from ? array( "From: {$from_name} <{$from}>" ) : array();

		if ( is_array( $to ) ) {
			$to = implode( ',', $to );
		}

		if ( $result = wp_mail( $to, $subject, $mail_body, $headers ) ) {
			iwf_log( sprintf( 'メールを送信しました。- 宛先: %s, タイトル: %s, From: %s, From( Name ): %s, 本文: %s', $to, $subject, $from, $from_name, $mail_body ) );

		} else {
			iwf_log( sprintf( 'メールを送信に失敗しました。 - 宛先: %s, タイトル: %s, From: %s, From( Name ): %s, 本文: %s', $to, $subject, $from, $from_name, $mail_body ) );
		}

		return $result;
	}

	public static function set_option( $key, $value ) {
		return update_option( 'wa_' . $key, $value );
	}

	public static function get_option( $key, $default = null ) {
		return get_option( 'wa_' . $key, $default );
	}

	private static function scandir( $path, $extensions = null, $depth = 0, $relative_path = '' ) {
		if ( ! is_dir( $path ) ) {
			return false;
		}

		if ( $extensions ) {
			$extensions      = (array) $extensions;
			$extension_regex = implode( '|', $extensions );
		}

		$results    = scandir( $path );
		$files      = array();
		$exclusions = array( 'CVS', 'node_modules' );

		$relative_path = trailingslashit( $relative_path );

		if ( $relative_path === '/' ) {
			$relative_path = '';
		}

		foreach ( $results as $result ) {
			if ( '.' === $result[0] || in_array( $result, $exclusions, true ) ) {
				continue;
			}

			if ( is_dir( $path . '/' . $result ) ) {
				if ( ! $depth ) {
					continue;
				}

				$found = static::scandir( $path . '/' . $result, $extensions, $depth - 1, $relative_path . $result );
				$files = static::array_merge_deep( $files, $found );

			} elseif ( ! $extensions || preg_match( '~\.(' . $extension_regex . ')$~', $result ) ) {
				$files[ $relative_path . $result ] = $path . '/' . $result;
			}
		}

		return $files;
	}
}