<?php
/**
 * XO Security admin.
 *
 * @package xo-security
 */

/**
 * XO Security admin class.
 */
class XO_Security_Admin {
	/**
	 * Parent object.
	 *
	 * @var XO_Security
	 */
	private $parent;

	/**
	 * Loginlog list Table.
	 *
	 * @var XO_Login_Log_List_Table
	 */
	private $list_table;

	/**
	 * Settings page hook name.
	 *
	 * @var string
	 */
	private $settings_page;

	/**
	 * Login file content.
	 *
	 * @var string
	 */
	private $loginfile_content = "<?php require_once './wp-login.php'; ?>";

	/**
	 * Construction.
	 *
	 * @since 1.0.0
	 *
	 * @param XO_Security $parent_object XO_Security object.
	 */
	public function __construct( $parent_object ) {
		$this->parent = $parent_object;
		add_action( 'plugins_loaded', array( $this, 'setup' ), 99999 );
	}

	/**
	 * Plugin setup.
	 */
	public function setup() {
		add_action( 'admin_bar_init', array( $this, 'admin_bar_init' ), 9999 );
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_filter( 'set-screen-option', array( $this, 'set_screen_option' ), 10, 3 );
		add_action( 'admin_init', array( $this, 'option_page_init' ) );
		add_filter( 'plugin_action_links', array( $this, 'plugin_action_links' ), 10, 2 );

		if ( ! isset( $this->parent->options['dashboard_widget'] ) || $this->parent->options['dashboard_widget'] ) {
			add_action( 'wp_dashboard_setup', array( $this, 'dashboard_setup' ) );
			add_action( 'wp_ajax_xo_security_dashboard', array( $this, 'ajax_dashboard' ) );
		}

		if ( isset( $this->parent->options['edit_author_slug'] ) && $this->parent->options['edit_author_slug'] ) {
			if ( current_user_can( 'edit_users' ) ) {
				add_action( 'show_user_profile', array( $this, 'edit_user_profile' ) );
				add_action( 'edit_user_profile', array( $this, 'edit_user_profile' ) );
				add_action( 'user_profile_update_errors', array( $this, 'user_profile_update_errors' ), 10, 3 );
			}
		}

		if ( isset( $this->parent->options['edit_author_base'] ) && $this->parent->options['edit_author_base'] ) {
			add_action( 'admin_init', array( $this, 'add_settings_author_base_field' ) );
			add_action( 'admin_init', array( $this, 'update_settings_author_base' ) );
		}
	}

	/**
	 * Get option.
	 */
	private function get_option() {
		$options = get_option( 'xo_security_options' );

		if ( ! is_main_site() ) {
			switch_to_blog( 1 );
			$mainsite_options = get_option( 'xo_security_options' );
			restore_current_blog();

			$options['ms_common_login_page'] = isset( $mainsite_options['ms_common_login_page'] ) ? $mainsite_options['ms_common_login_page'] : false;
			if ( $options['ms_common_login_page'] ) {
				$options['login_page']      = isset( $mainsite_options['login_page'] ) ? $mainsite_options['login_page'] : false;
				$options['login_page_name'] = isset( $mainsite_options['login_page_name'] ) ? $mainsite_options['login_page_name'] : '';
			}
		}

		return $options;
	}

	/**
	 * Filter for author_rewrite_rules.
	 */
	public function author_rewrite_rules() {
		return array();
	}

	/**
	 * Filter foradmin_bar_init.
	 */
	public function admin_bar_init() {
		$min = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';
		wp_enqueue_style( 'xo-security-admin', XO_SECURITY_URL . "/css/admin{$min}.css", false, XO_SECURITY_VERSION );
	}

	/**
	 * Filter for plugin_action_links.
	 *
	 * @param string[] $actions     An array of plugin action links.
	 * @param string   $plugin_file Path to the plugin file relative to the plugins directory.
	 */
	public function plugin_action_links( $actions, $plugin_file ) {
		if ( 'xo-security.php' === basename( $plugin_file ) ) {
			$settings = array(
				'settings' => '<a href="' . admin_url( 'options-general.php?page=xo-security-settings' ) . '">' . __( 'Settings', 'xo-security' ) . '</a>',
			);
			$actions  = array_merge( $settings, $actions );
		}
		return $actions;
	}

	/**
	 * Admin screen Add menu.
	 */
	public function add_admin_menu() {
		$login_log_page = add_submenu_page( 'profile.php', __( 'Login log', 'xo-security' ), __( 'Login log', 'xo-security' ), 'delete_posts', 'xo-security-login-log', array( $this, 'login_log_page' ) );
		add_action( "load-{$login_log_page}", array( $this, 'add_login_log_page_tabs' ) );

		$this->settings_page = add_options_page( 'XO Security', 'XO Security', 'manage_options', 'xo-security-settings', array( $this, 'option_page' ) );
		add_action( "load-{$this->settings_page}", array( $this, 'add_settings_page_tabs' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
	}

	/**
	 * Add a script.
	 *
	 * @param string $hook The current admin page.
	 */
	public function admin_enqueue_scripts( $hook ) {
		if ( $this->settings_page === $hook || 'index.php' === $hook ) {
			$min = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';
			wp_enqueue_script( 'xo-security-admin', XO_SECURITY_URL . "/js/admin{$min}.js", array( 'jquery' ), XO_SECURITY_VERSION, false );
			$options = array(
				'site_url' => site_url( '/' ),
				'nonce'    => wp_create_nonce( 'xo-security-dashboard' ),
			);
			wp_localize_script( 'xo-security-admin', 'xoSecurityAdminOptions', $options );
		}
	}

	/**
	 * Add a tab to the login log page.
	 */
	public function add_login_log_page_tabs() {
		add_screen_option(
			'per_page',
			array(
				'label'   => __( 'Number of items per page:', 'xo-security' ),
				'default' => 100,
				'option'  => 'login_log_per_page',
			)
		);

		$screen = get_current_screen();
		$screen->add_help_tab(
			array(
				'id'      => 'loginlogs-help',
				'title'   => __( 'Overview', 'xo-security' ),
				'content' => '<p>' . __( 'View the log of login.', 'xo-security' ) . '</p>',
			)
		);

		$this->list_table = new XO_Login_Log_List_Table();

		$this->list_table->default_status = isset( $this->parent->options['log_default_status'] ) ? $this->parent->options['log_default_status'] : '';
	}

	/**
	 * Add a tab to the setting page.
	 */
	public function add_settings_page_tabs() {
		$screen = get_current_screen();
		$screen->add_help_tab(
			array(
				'id'      => 'overview',
				'title'   => __( 'Overview', 'xo-security' ),
				'content' =>
					'<p>' . __( 'XO Security setup.', 'xo-security' ) . '</p>',
			)
		);
		$screen->add_help_tab(
			array(
				'id'      => 'login-config',
				'title'   => __( 'Login', 'xo-security' ),
				'content' =>
					'<p>' . __( 'Number of trials restriction limits the number of times that you can try from the same IP address during a specified time. From was over a specified number of IP address you will not be able to log in.', 'xo-security' ) . '</p>',
			)
		);
		$screen->add_help_tab(
			array(
				'id'      => 'secret-config',
				'title'   => __( 'Secret', 'xo-security' ),
				'content' =>
					'<p>' . __( 'Disabling author archives the author archive page does not appear.', 'xo-security' ) . '</p>' .
					'<p>' . __( 'Deleting the comment author name class deletes the class that contains the username that is added to the comment list tag.', 'xo-security' ) . '</p>',
			)
		);
		$screen->add_help_tab(
			array(
				'id'      => 'environment-config',
				'title'   => __( 'Environment', 'xo-security' ),
				'content' =>
					'<p>' . __( 'Select the method of acquiring the IP address. Normally select "Auto".', 'xo-security' ) . '</p>' .
					'<p>' . __( 'Automatic deletion of login log automatically deletes the old log in the log of the previous period specified.', 'xo-security' ) . '</p>',
			)
		);
	}

	/**
	 * Processing when setting options on the login log page.
	 *
	 * @param mixed  $status The value to save instead of the option value.
	 * @param string $option The option name.
	 * @param int    $value  The option value.
	 */
	public function set_screen_option( $status, $option, $value ) {
		if ( 'login_log_per_page' === $option ) {
			$new_value = (int) $value;
			if ( $new_value >= 1 && $new_value <= 999 ) {
				return $new_value;
			}
			return $status;
		}
	}

	/**
	 * Display the login log page.
	 */
	public function login_log_page() {
		$this->list_table->prepare_items();
		?>
		<div class="wrap">
			<div id="icon-profile" class="icon32"></div>
			<h1><?php esc_html_e( 'Login log', 'xo-security' ); ?></h1>
			<form id="loginlogs-filter" method="get" action="">
				<input type="hidden" name="page" value="xo-security-login-log" />
				<?php $this->list_table->display(); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * Display settings page.
	 */
	public function option_page() {
		$this->parent->options = $this->get_option();

		$tabs = array( 'status-page', 'login-page', 'comment-page', 'xmlrpc-page', 'restapi-page', 'secret-page', 'maintenance-page', 'environment-page' );

		$active_tab = ( isset( $_GET['tab'] ) && in_array( $_GET['tab'], $tabs, true ) ) ? $_GET['tab'] : 'status-page'; // phpcs:ignore

		echo '<div class="wrap">'
			. '<h1>' . esc_html__( 'XO Security Settings', 'xo-security' ) . '</h1>'
			. '<h2 class="nav-tab-wrapper">'
			. '<a href="?page=xo-security-settings&amp;tab=status-page" class="nav-tab ' . ( 'status-page' === $active_tab ? 'nav-tab-active' : '' ) . '">'
			. esc_html__( 'Status', 'xo-security' ) . '</a>'
			. '<a href="?page=xo-security-settings&amp;tab=login-page" class="nav-tab ' . ( 'login-page' === $active_tab ? 'nav-tab-active' : '' ) . '">'
			. esc_html__( 'Login', 'xo-security' ) . '</a>'
			. '<a href="?page=xo-security-settings&amp;tab=comment-page" class="nav-tab ' . ( 'comment-page' === $active_tab ? 'nav-tab-active' : '' ) . '">'
			. esc_html__( 'Comment', 'xo-security' ) . '</a>'
			. '<a href="?page=xo-security-settings&amp;tab=xmlrpc-page" class="nav-tab ' . ( 'xmlrpc-page' === $active_tab ? 'nav-tab-active' : '' ) . '">'
			. esc_html__( 'XML-RPC', 'xo-security' ) . '</a>'
			. '<a href="?page=xo-security-settings&amp;tab=restapi-page" class="nav-tab ' . ( 'restapi-page' === $active_tab ? 'nav-tab-active' : '' ) . '">'
			. esc_html__( 'REST API', 'xo-security' ) . '</a>'
			. '<a href="?page=xo-security-settings&amp;tab=secret-page" class="nav-tab ' . ( 'secret-page' === $active_tab ? 'nav-tab-active' : '' ) . '">'
			. esc_html__( 'Secret', 'xo-security' ) . '</a>'
			. '<a href="?page=xo-security-settings&amp;tab=maintenance-page" class="nav-tab ' . ( 'maintenance-page' === $active_tab ? 'nav-tab-active' : '' ) . '">'
			. esc_html__( 'Maintenance', 'xo-security' ) . '</a>'
			. '<a href="?page=xo-security-settings&amp;tab=environment-page" class="nav-tab ' . ( 'environment-page' === $active_tab ? 'nav-tab-active' : '' ) . '">'
			. esc_html__( 'Environment', 'xo-security' ) . '</a>'
			. '</h2>'
			. '<form method="post" action="options.php">';

		switch ( $active_tab ) {
			case 'status-page':
				$this->status_page();
				break;
			case 'login-page':
				settings_fields( 'xo_security_login' );
				do_settings_sections( 'xo_security_login' );
				submit_button();
				break;
			case 'comment-page':
				settings_fields( 'xo_security_comment' );
				do_settings_sections( 'xo_security_comment' );
				submit_button();
				break;
			case 'xmlrpc-page':
				settings_fields( 'xo_security_xmlrpc' );
				do_settings_sections( 'xo_security_xmlrpc' );
				submit_button();
				break;
			case 'restapi-page':
				settings_fields( 'xo_security_restapi' );
				do_settings_sections( 'xo_security_restapi' );
				submit_button();
				break;
			case 'secret-page':
				settings_fields( 'xo_security_secret' );
				do_settings_sections( 'xo_security_secret' );
				submit_button();
				break;
			case 'maintenance-page':
				settings_fields( 'xo_security_maintenance' );
				do_settings_sections( 'xo_security_maintenance' );
				submit_button();
				break;
			case 'environment-page':
				settings_fields( 'xo_security_environment' );
				do_settings_sections( 'xo_security_environment' );
				submit_button();
				break;
		}

		echo '</form>';
		echo '</div>';
	}

	/**
	 * Status page.
	 */
	private function status_page() {
		global $wp_version, $wpdb;

		$interval             = isset( $this->parent->options['interval'] ) ? (int) $this->parent->options['interval'] : 0;
		$login_page           = isset( $this->parent->options['login_page'] ) ? $this->parent->options['login_page'] : false;
		$login_alert          = isset( $this->parent->options['login_alert'] ) ? $this->parent->options['login_alert'] : false;
		$error_login_message  = isset( $this->parent->options['error_login_message'] ) ? $this->parent->options['error_login_message'] : false;
		$two_factor           = isset( $this->parent->options['two_factor'] ) ? $this->parent->options['two_factor'] : false;
		$login_id_type        = isset( $this->parent->options['login_id_type'] ) ? $this->parent->options['login_id_type'] : '';
		$login_captcha        = isset( $this->parent->options['login_captcha'] ) ? ( '' !== $this->parent->options['login_captcha'] ) : false;
		$comment_captcha      = isset( $this->parent->options['comment_captcha'] ) ? ( '' !== $this->parent->options['comment_captcha'] ) : false;
		$comment_spam         = ( isset( $this->parent->options['comment_spam'] ) ? $this->parent->options['comment_spam'] : false ) || ( isset( $this->parent->options['comment_spam_email'] ) ? $this->parent->options['comment_spam_email'] : false );
		$comment_bot          = isset( $this->parent->options['comment_bot'] ) ? $this->parent->options['comment_bot'] : false;
		$xmlrpc               = isset( $this->parent->options['xmlrpc'] ) ? $this->parent->options['xmlrpc'] : false;
		$pingback             = isset( $this->parent->options['pingback'] ) ? $this->parent->options['pingback'] : false;
		$rest                 = isset( $this->parent->options['rest'] ) ? $this->parent->options['rest'] : false;
		$edit_author_slug     = isset( $this->parent->options['edit_author_slug'] ) ? $this->parent->options['edit_author_slug'] : false;
		$edit_author_base     = isset( $this->parent->options['edit_author_base'] ) ? $this->parent->options['edit_author_base'] : false;
		$author_archive       = isset( $this->parent->options['author_archive'] ) ? $this->parent->options['author_archive'] : false;
		$comment_author_class = isset( $this->parent->options['comment_author_class'] ) ? $this->parent->options['comment_author_class'] : false;
		$oembed_author        = isset( $this->parent->options['oembed_author'] ) ? $this->parent->options['oembed_author'] : false;
		$disable_feed         = isset( $this->parent->options['disable_feed'] ) ? $this->parent->options['disable_feed'] : false;
		$remove_version       = isset( $this->parent->options['remove_version'] ) ? $this->parent->options['remove_version'] : false;
		$delete_readme        = isset( $this->parent->options['delete_readme'] ) ? $this->parent->options['delete_readme'] : false;
		?>
		<h3 class="label"><?php esc_html_e( 'Setting status', 'xo-security' ); ?></h3>
		<table class="xo-security-form-table">
			<tbody>
				<tr>
					<th scope="row" class="status-check"><span class="check-on"></span></th>
					<td class="status-title"><?php esc_html_e( 'Record login', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Record the login log.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( 0 !== $interval ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Infinite login attempts', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Block connections that repeat login failures.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $login_page ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Modify login page', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Change the name of the login page.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( '' !== $login_id_type ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Login ID type', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Limit your login ID to either username or email address.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( ( defined( 'XO_SECURITY_LANGUAGE_WHITE_LIST' ) && XO_SECURITY_LANGUAGE_WHITE_LIST !== '' ) ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Login language Restrictions', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Limit the languages that can be logged in.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $error_login_message ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Login error message', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Simplify login error messages.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $two_factor ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Two-factor authentication', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Add Time Based One-Time Password (TOTP) authentication.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $login_captcha ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Login CAPTCHA', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Add CAPTCHA to the login page.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $login_alert ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Login Alert', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Send a mail when you log in.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $comment_captcha ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Comment CAPTCHA', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Add CAPTCHA to the comment form.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $comment_spam ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Comment spam protection', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Protect comment from spam.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $comment_bot ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Comment bot protection', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Protect comment from bots.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $xmlrpc ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Disable XML-RPC', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Disable the XML-RPC.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $pingback ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Disable XML-RPC Pinback', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Disable XML-RPC pingback features.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $rest ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Disable REST API', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Disable the REST API.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $edit_author_slug ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Edit author slug', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'The author slug can be edited.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $edit_author_base ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Edit author base', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'The author base can be edited.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $author_archive ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Disable author archives', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Disable authors archive page.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $comment_author_class ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Delete comment author class', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Delete the class that contains the username that will be added to the comment list tag.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $oembed_author ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Remove oEmbed username', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Remove the username from the oEmbed response data.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $disable_feed ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Disable RSS and Atom feeds', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Disable RSS and Atom feeds.', 'xo-security' ); ?></td>
				</tr>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $remove_version ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Delete version information', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Remove the generator meta tags and WordPress versions such as links and script tags.', 'xo-security' ); ?></td>
				</tr>
				<?php if ( is_main_site() ) : ?>
				<tr>
					<th scope="row" class="status-check"><span class="<?php echo ( $delete_readme ? 'check-on' : 'check-off' ); ?>"></span></th>
					<td class="status-title"><?php esc_html_e( 'Delete readme.html', 'xo-security' ); ?></td>
					<td class="status-description"><?php esc_html_e( 'Delete the WordPress core readme.html file.', 'xo-security' ); ?></td>
				</tr>
				<?php endif; ?>
			</tbody>
		</table>
		<?php
	}

	/**
	 * Initialize setting page.
	 */
	public function option_page_init() {
		if ( delete_transient( 'xo_security_flush_rewrite_rules' ) ) {
			flush_rewrite_rules( false );
		}

		register_setting( 'xo_security_login', 'xo_security_options', array( $this, 'sanitize_login' ) );
		add_settings_section( 'xo_security_login_limit_section', __( 'Login', 'xo-security' ), '__return_empty_string', 'xo_security_login' );
		add_settings_field( 'limit_count', __( 'Infinite attempts', 'xo-security' ), array( $this, 'option_page_field_limit_count' ), 'xo_security_login', 'xo_security_login_limit_section' );
		add_settings_field( 'blocked_tarpit', __( 'Block time delay', 'xo-security' ), array( $this, 'option_page_field_blocked_tarpit' ), 'xo_security_login', 'xo_security_login_limit_section' );
		add_settings_field( 'failed_tarpit', __( 'Failure time delay', 'xo-security' ), array( $this, 'option_page_field_failed_tarpit' ), 'xo_security_login', 'xo_security_login_limit_section' );
		add_settings_field( 'login_page', __( 'Modify login page', 'xo-security' ), array( $this, 'option_page_field_login_page' ), 'xo_security_login', 'xo_security_login_limit_section' );
		add_settings_field( 'login_id_type', __( 'Login ID type', 'xo-security' ), array( $this, 'option_page_field_login_id_type' ), 'xo_security_login', 'xo_security_login_limit_section' );
		add_settings_field( 'login_languages', __( 'Login language Restrictions', 'xo-security' ), array( $this, 'option_page_field_login_languages' ), 'xo_security_login', 'xo_security_login_limit_section' );
		add_settings_field( 'error_login_message', __( 'Login error message', 'xo-security' ), array( $this, 'option_page_field_error_login_message' ), 'xo_security_login', 'xo_security_login_limit_section' );
		add_settings_field( 'two_factor', __( 'Two-factor authentication', 'xo-security' ), array( $this, 'option_page_field_two_factor' ), 'xo_security_login', 'xo_security_login_limit_section' );
		add_settings_section( 'xo_security_login_form_section', __( 'Login Form', 'xo-security' ), '__return_empty_string', 'xo_security_login' );
		add_settings_field( 'login_captcha', __( 'CAPTCHA', 'xo-security' ), array( $this, 'option_page_field_login_captcha' ), 'xo_security_login', 'xo_security_login_form_section' );
		add_settings_field( 'password_reset', __( 'Password reset link', 'xo-security' ), array( $this, 'option_page_field_password_reset' ), 'xo_security_login', 'xo_security_login_form_section' );
		add_settings_field( 'login_site_link', __( 'Go to site link', 'xo-security' ), array( $this, 'option_page_field_login_site_link' ), 'xo_security_login', 'xo_security_login_form_section' );
		add_settings_section( 'xo_security_login_alert_section', __( 'Login Alert', 'xo-security' ), '__return_empty_string', 'xo_security_login' );
		add_settings_field( 'login_alert', __( 'Login Alert', 'xo-security' ), array( $this, 'option_page_field_login_alert' ), 'xo_security_login', 'xo_security_login_alert_section' );

		register_setting( 'xo_security_comment', 'xo_security_options', array( $this, 'sanitize_comment' ) );
		add_settings_section( 'xo_security_comment_section', __( 'Comment', 'xo-security' ), '__return_false', 'xo_security_comment' );
		add_settings_field( 'comment_captcha', __( 'CAPTCHA', 'xo-security' ), array( $this, 'option_page_field_comment_captcha' ), 'xo_security_comment', 'xo_security_comment_section' );
		add_settings_field( 'comment_spam', __( 'Spam protection filter', 'xo-security' ), array( $this, 'option_page_field_comment_spam' ), 'xo_security_comment', 'xo_security_comment_section' );
		add_settings_field( 'comment_spam_action', __( 'Spam comment', 'xo-security' ), array( $this, 'option_page_field_comment_spam_action' ), 'xo_security_comment', 'xo_security_comment_section' );
		add_settings_field( 'comment_bot', __( 'Bot protection checkbox', 'xo-security' ), array( $this, 'option_page_field_comment_bot' ), 'xo_security_comment', 'xo_security_comment_section' );

		register_setting( 'xo_security_xmlrpc', 'xo_security_options', array( $this, 'sanitize_xmlrpc' ) );
		add_settings_section( 'xo_security_xmlrpc_section', __( 'XML-RPC', 'xo-security' ), '__return_false', 'xo_security_xmlrpc' );
		add_settings_field( 'xmlrpc', __( 'Disable XML-RPC', 'xo-security' ), array( $this, 'option_page_field_xmlrpc' ), 'xo_security_xmlrpc', 'xo_security_xmlrpc_section' );
		add_settings_field( 'pingback', __( 'Disable XML-RPC Pinback', 'xo-security' ), array( $this, 'option_page_field_pingback' ), 'xo_security_xmlrpc', 'xo_security_xmlrpc_section' );

		register_setting( 'xo_security_restapi', 'xo_security_options', array( $this, 'sanitize_restapi' ) );
		add_settings_section( 'xo_security_rest_section', __( 'REST API', 'xo-security' ), '__return_false', 'xo_security_restapi' );
		add_settings_field( 'rest', __( 'Disable REST API', 'xo-security' ), array( $this, 'option_page_field_rest' ), 'xo_security_restapi', 'xo_security_rest_section' );
		if ( isset( $this->parent->options['rest_rename'] ) && $this->parent->options['rest_rename'] ) {
			add_settings_field( 'rest_rename', __( 'Change REST API URL prefix', 'xo-security' ), array( $this, 'option_page_field_rest_rename' ), 'xo_security_restapi', 'xo_security_rest_section' );
		}

		register_setting( 'xo_security_secret', 'xo_security_options', array( $this, 'sanitize_secret' ) );
		add_settings_section( 'xo_security_security_user_section', __( 'Username', 'xo-security' ), '__return_false', 'xo_security_secret' );
		add_settings_field( 'edit_author_slug', __( 'Edit author slug', 'xo-security' ), array( $this, 'option_page_field_edit_author_slug' ), 'xo_security_secret', 'xo_security_security_user_section' );
		add_settings_field( 'edit_author_base', __( 'Edit author base', 'xo-security' ), array( $this, 'option_page_field_edit_author_base' ), 'xo_security_secret', 'xo_security_security_user_section' );
		add_settings_field( 'author_archive', __( 'Disable author archives', 'xo-security' ), array( $this, 'option_page_field_author_archive' ), 'xo_security_secret', 'xo_security_security_user_section' );
		add_settings_field( 'comment_author_class', __( 'Delete comment author class', 'xo-security' ), array( $this, 'option_page_field_comment_author_class' ), 'xo_security_secret', 'xo_security_security_user_section' );
		add_settings_field( 'oembed_author', __( 'Remove oEmbed username', 'xo-security' ), array( $this, 'option_page_field_oembed_author' ), 'xo_security_secret', 'xo_security_security_user_section' );
		add_settings_section( 'xo_security_disable_feed_section', __( 'RSS and Atom feeds', 'xo-security' ), '__return_false', 'xo_security_secret' );
		add_settings_field( 'disable_feed', __( 'Disable RSS and Atom feeds', 'xo-security' ), array( $this, 'option_page_field_disable_feed' ), 'xo_security_secret', 'xo_security_disable_feed_section' );
		add_settings_section( 'xo_security_security_generator_section', __( 'WordPress version', 'xo-security' ), '__return_false', 'xo_security_secret' );
		add_settings_field( 'remove_version', __( 'Delete version information', 'xo-security' ), array( $this, 'option_page_field_remove_version' ), 'xo_security_secret', 'xo_security_security_generator_section' );
		if ( is_main_site() ) {
			add_settings_section( 'xo_security_security_wordpress_core_file', __( 'WordPress Core File', 'xo-security' ), '__return_false', 'xo_security_secret' );
			add_settings_field( 'remove_readme', __( 'Delete readme.html', 'xo-security' ), array( $this, 'option_page_field_delete_readme' ), 'xo_security_secret', 'xo_security_security_wordpress_core_file' );
		}

		register_setting( 'xo_security_maintenance', 'xo_security_options', array( $this, 'sanitize_maintenance' ) );
		add_settings_section( 'xo_security_maintenance_section', __( 'Maintenance', 'xo-security' ), '__return_false', 'xo_security_maintenance' );
		add_settings_field( 'maintenance_mode', __( 'Maintenance mode', 'xo-security' ), array( $this, 'option_page_field_maintenance_mode' ), 'xo_security_maintenance', 'xo_security_maintenance_section' );

		register_setting( 'xo_security_environment', 'xo_security_options', array( $this, 'sanitize_environment' ) );
		add_settings_section( 'xo_security_environment_section', __( 'Environment', 'xo-security' ), '__return_false', 'xo_security_environment' );
		add_settings_field( 'ip_mode', __( 'IP address mode', 'xo-security' ), array( $this, 'option_page_field_ip_mode' ), 'xo_security_environment', 'xo_security_environment_section' );
		add_settings_section( 'xo_security_dashboard_section', __( 'Dashboard', 'xo-security' ), '__return_false', 'xo_security_environment' );
		add_settings_field( 'dashboard_widget', __( 'Login Information Widget', 'xo-security' ), array( $this, 'option_page_field_dashboard_widget' ), 'xo_security_environment', 'xo_security_dashboard_section' );
		add_settings_section( 'xo_security_loginlog_section', __( 'Login log', 'xo-security' ), '__return_false', 'xo_security_environment' );
		add_settings_field( 'auto_truncate', __( 'Automatic removal', 'xo-security' ), array( $this, 'option_page_field_auto_truncate' ), 'xo_security_environment', 'xo_security_loginlog_section' );
		add_settings_field( 'log_default_status', __( 'Status to display by default', 'xo-security' ), array( $this, 'option_page_field_log_default_status' ), 'xo_security_environment', 'xo_security_loginlog_section' );
		add_settings_section( 'xo_security_captcha_section', __( 'CAPTCHA', 'xo-security' ), '__return_false', 'xo_security_environment' );
		add_settings_field( 'captcha_type', __( 'CAPTCHA type', 'xo-security' ), array( $this, 'option_page_field_captcha_type' ), 'xo_security_environment', 'xo_security_captcha_section' );
	}

	/**
	 * Dispaly limit count fields.
	 */
	public function option_page_field_limit_count() {
		$interval    = isset( $this->parent->options['interval'] ) ? (int) $this->parent->options['interval'] : 0;
		$limit_count = isset( $this->parent->options['limit_count'] ) ? (int) $this->parent->options['limit_count'] : 4;

		echo '<select id="field_interval" name="xo_security_options[interval]">';
		echo '<option value="0"' . ( 0 === $interval ? ' selected' : '' ) . '>' . esc_html__( 'No limit', 'xo-security' ) . '</option>';
		echo '<option value="1"' . ( 1 === $interval ? ' selected' : '' ) . '>' . esc_html__( 'During the one-hour', 'xo-security' ) . '</option>';
		echo '<option value="12"' . ( 12 === $interval ? ' selected' : '' ) . '>' . esc_html__( 'During the 12-hour', 'xo-security' ) . '</option>';
		echo '<option value="24"' . ( 24 === $interval ? ' selected' : '' ) . '>' . esc_html__( 'During the 24-hour', 'xo-security' ) . '</option>';
		echo '<option value="48"' . ( 48 === $interval ? ' selected' : '' ) . '>' . esc_html__( 'During the 48-hour', 'xo-security' ) . '</option>';
		echo '</select>';
		echo '<p><input id="field_limit_count" name="xo_security_options[limit_count]" type="number" value="' . esc_attr( $limit_count ) . '" class="small-text" /> ' . esc_html__( 'times permission', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly blocked tarpit fields.
	 */
	public function option_page_field_blocked_tarpit() {
		$blocked_tarpit = isset( $this->parent->options['blocked_tarpit'] ) ? $this->parent->options['blocked_tarpit'] : 30;
		echo '<p><input id="field_blocked_tarpit" name="xo_security_options[blocked_tarpit]" type="number" value="' . esc_attr( $blocked_tarpit ) . '" class="small-text" /> ' . esc_html__( 'sec (0-120)', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly failed tarpit fields.
	 */
	public function option_page_field_failed_tarpit() {
		$failed_tarpit = isset( $this->parent->options['failed_tarpit'] ) ? $this->parent->options['failed_tarpit'] : '3';
		echo '<p><input id="field_failed_tarpit" name="xo_security_options[failed_tarpit]" type="number" value="' . esc_attr( $failed_tarpit ) . '" class="small-text" /> ' . esc_html__( 'sec (0-10)', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly login alert fields.
	 */
	public function option_page_field_login_alert() {
		$login_alert            = isset( $this->parent->options['login_alert'] ) ? $this->parent->options['login_alert'] : false;
		$login_alert_admin_only = isset( $this->parent->options['login_alert_admin_only'] ) ? $this->parent->options['login_alert_admin_only'] : false;
		$subject                = isset( $this->parent->options['login_alert_subject'] ) ? $this->parent->options['login_alert_subject'] : __( 'Login at %SITENAME% site', 'xo-security' );
		$body                   = isset( $this->parent->options['login_alert_body'] ) ? $this->parent->options['login_alert_body'] : __( '%USERNAME% logged in at %DATE% %TIME%.', 'xo-security' );

		echo '<label for="field_login_alert" class="label-checkbox-toggle"><input id="field_login_alert" name="xo_security_options[login_alert]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $login_alert, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p><label for="field_login_alert_subject">' . esc_html__( 'Subject:', 'xo-security' ) . '</label><br /><input id="field_login_alert_subject" name="xo_security_options[login_alert_subject]" type="text" value="' . esc_attr( $subject ) . '" class="regular-text" style="display: inline;" maxlength="100" /></p>';
		echo '<p><label for="field_login_alert_body">' . esc_html__( 'Body:', 'xo-security' ) . '</label><br /><textarea id="field_login_alert_body" name="xo_security_options[login_alert_body]" class="large-text code" rows="3" col="50" />' . esc_attr( $body ) . '</textarea></p>';
		echo '<p class="description">' . esc_html__( 'In the Subject and Body, the following variables can be used: %SITENAME%, %USERNAME%, %DATE%, %TIME%, %IPADDRESS%, %USERAGENT%', 'xo-security' ) . '</p>';
		echo '<p><label for="field_login_alert_admin_only"><input id="field_login_alert_admin_only" name="xo_security_options[login_alert_admin_only]" type="checkbox" value="1" class="code" ' . checked( 1, $login_alert_admin_only, false ) . ' /> ' . esc_html__( 'Administrators only', 'xo-security' ) . '</label></p>';
	}

	/**
	 * Dispaly error login message fields.
	 */
	public function option_page_field_error_login_message() {
		$error_login_message = isset( $this->parent->options['error_login_message'] ) ? $this->parent->options['error_login_message'] : false;
		echo '<select id="field_error_login_message" name="xo_security_options[error_login_message]">';
		echo '<option value="0"' . ( ! $error_login_message ? ' selected' : '' ) . '>' . esc_html__( 'Default', 'xo-security' ) . '</option>';
		echo '<option value="1"' . ( $error_login_message ? ' selected' : '' ) . '>' . esc_html__( 'Simplification', 'xo-security' ) . '</option>';
		echo '</select>';
	}

	/**
	 * Dispaly error login message fields.
	 *
	 * @since 3.9.0
	 */
	public function option_page_field_two_factor() {
		$two_factor = isset( $this->parent->options['two_factor'] ) ? $this->parent->options['two_factor'] : false;
		echo '<label for="field_two_factor" class="label-checkbox-toggle"><input id="field_two_factor" name="xo_security_options[two_factor]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $two_factor, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p class="description">' . esc_html__( 'Two-factor authentication settings are made on the profile screen.', 'xo-security' ) . '</p>';

		$two_factor_roles = isset( $this->parent->options['two_factor_roles'] ) ? $this->parent->options['two_factor_roles'] : array( 'administrator' );
		$roles            = wp_roles();
		echo '<p>';
		foreach ( $roles->role_names as $key => $name ) {
			$c = in_array( $key, $two_factor_roles, true );
			echo '<label for="field_two_factor_roles_' . esc_attr( $key ) . '" style="display: inline-block; margin: 4px 12px 4px 0;">';
			echo '<input id="field_two_factor_roles_' . esc_attr( $key ) . '" name="xo_security_options[two_factor_roles][]" type="checkbox" value="' . esc_attr( $key ) . '" class="code" ' . checked( 1, $c, false ) . ' /> ' . esc_html( translate_user_role( $name ) );
			echo '</label> ';
		}
		echo '</p>';
		echo '<p class="description">' . esc_html__( 'Choose which user roles will have two factor authentication available.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly login id type fields.
	 */
	public function option_page_field_login_id_type() {
		$v = isset( $this->parent->options['login_id_type'] ) ? $this->parent->options['login_id_type'] : '';
		echo '<select id="field_login_id_type" name="xo_security_options[login_id_type]">';
		echo '<option value=""' . ( '' === $v ? ' selected' : '' ) . '>' . esc_html__( 'Username or Email Address (default)', 'xo-security' ) . '</option>';
		echo '<option value="username"' . ( 'username' === $v ? ' selected' : '' ) . '>' . esc_html__( 'Username only', 'xo-security' ) . '</option>';
		echo '<option value="email"' . ( 'email' === $v ? ' selected' : '' ) . '>' . esc_html__( 'Email Address only', 'xo-security' ) . '</option>';
		echo '</select>';
	}

	/**
	 * Dispaly login captcha fields.
	 */
	public function option_page_field_login_captcha() {
		$login_captcha = isset( $this->parent->options['login_captcha'] ) ? $this->parent->options['login_captcha'] : '';
		echo '<select id="field_login_captcha" name="xo_security_options[login_captcha]">';
		echo '<option value=""' . ( '' === $login_captcha ? ' selected' : '' ) . '>' . esc_html__( 'Disabled', 'xo-security' ) . '</option>';
		echo '<option value="en"' . ( 'en' === $login_captcha ? ' selected' : '' ) . '>' . esc_html__( 'Alphanumeric', 'xo-security' ) . '</option>';
		echo '<option value="jp"' . ( 'jp' === $login_captcha ? ' selected' : '' ) . '>' . esc_html__( 'Hiragana (Japanese)', 'xo-security' ) . '</option>';
		echo '</select>';
	}

	/**
	 * Dispaly login languages fields.
	 */
	public function option_page_field_login_languages() {
		$login_languages = defined( 'XO_SECURITY_LANGUAGE_WHITE_LIST' ) ? XO_SECURITY_LANGUAGE_WHITE_LIST : '';

		if ( $login_languages ) {
			echo '<p><code>' . esc_html( $login_languages ) . '</code></p>';
		} else {
			$lang = strtolower( substr( $this->parent->get_language(), 0, 2 ) );
			echo '<p><code>' . esc_html__( 'Disabled', 'xo-security' ) . '</code></p>';
			echo '<p class="description">' . esc_html__( 'XO_SECURITY_LANGUAGE_WHITE_LIST set by a constant.', 'xo-security' ) . '</p>';
			/* translators: %s Language */
			echo '<p class="description">' . esc_html( sprintf( __( 'Example: define( \'XO_SECURITY_LANGUAGE_WHITE_LIST\', \'%s\' );', 'xo-security' ), $lang ) ) . '</p>';
		}
	}

	/**
	 * Dispaly auto truncate fields.
	 */
	public function option_page_field_auto_truncate() {
		$auto_truncate = isset( $this->parent->options['auto_truncate'] ) ? (int) $this->parent->options['auto_truncate'] : 0;
		echo '<select id="field_auto_truncate" name="xo_security_options[auto_truncate]">';
		echo '<option value="0"' . ( 0 === $auto_truncate ? ' selected' : '' ) . '>' . esc_html__( 'Not automatic deletion', 'xo-security' ) . '</option>';
		echo '<option value="30"' . ( 30 === $auto_truncate ? ' selected' : '' ) . '>' . esc_html__( 'Older than 30 days', 'xo-security' ) . '</option>';
		echo '<option value="365"' . ( $auto_truncate >= 31 ? ' selected' : '' ) . '>' . esc_html__( 'Older than 365 days', 'xo-security' ) . '</option>';
		echo '</select>';
	}

	/**
	 * Dispaly login default status fields.
	 */
	public function option_page_field_log_default_status() {
		$log_default_status = isset( $this->parent->options['log_default_status'] ) ? $this->parent->options['log_default_status'] : '';
		echo '<select id="field_log_default_status" name="xo_security_options[log_default_status]">';
		echo '<option value=""' . ( '' === $log_default_status ? ' selected' : '' ) . '>' . esc_html__( 'All results', 'xo-security' ) . '</option>';
		echo '<option value="0"' . ( '0' === $log_default_status ? ' selected' : '' ) . '>' . esc_html__( 'Failure', 'xo-security' ) . '</option>';
		echo '<option value="1"' . ( '1' === $log_default_status ? ' selected' : '' ) . '>' . esc_html__( 'Success', 'xo-security' ) . '</option>';
		echo '</select>';
	}

	/**
	 * Dispaly dashboard widget fields.
	 */
	public function option_page_field_dashboard_widget() {
		$dashboard_widget = isset( $this->parent->options['dashboard_widget'] ) ? $this->parent->options['dashboard_widget'] : true;
		echo '<select id="field_dashboard_widget" name="xo_security_options[dashboard_widget]">';
		echo '<option value="1"' . ( $dashboard_widget ? ' selected' : '' ) . '>' . esc_html__( 'Enable', 'xo-security' ) . '</option>';
		echo '<option value="0"' . ( ! $dashboard_widget ? ' selected' : '' ) . '>' . esc_html__( 'Disabled', 'xo-security' ) . '</option>';
		echo '</select>';
	}

	/**
	 * Dispaly login page fields.
	 */
	public function option_page_field_login_page() {
		$ms_common_login_page = isset( $this->parent->options['ms_common_login_page'] ) ? $this->parent->options['ms_common_login_page'] : false;

		if ( ! is_main_site() && $ms_common_login_page ) {
			echo '<p><code>' . esc_html__( 'Inherit main site settings', 'xo-security' ) . '</code></p>';
		} else {
			$c = isset( $this->parent->options['login_page'] ) ? $this->parent->options['login_page'] : false;
			echo '<label for="field_login_page" class="label-checkbox-toggle"><input id="field_login_page" name="xo_security_options[login_page]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $c, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
			$name = isset( $this->parent->options['login_page_name'] ) ? $this->parent->options['login_page_name'] : '';
			echo '<p><label for="field_login_page_name">' . esc_html__( 'Login file:', 'xo-security' ) . ' <input id="field_login_page_name" name="xo_security_options[login_page_name]" type="text" value="' . esc_attr( $name ) . '" class="regular-text" style="max-width:15em; display: inline;" maxlength="40" /></label>.php</p>';
			echo '<p>URL: <span id="login_url"></span></p>';
			echo '<p class="description">' . esc_html__( 'Characters can be used in the login file is only lowercase letters, numbers, hyphens and underscores.', 'xo-security' ) . '</p>';
			if ( is_multisite() && is_main_site() ) {
				echo '<p><label for="field_ms_common_login_page"><input id="field_ms_common_login_page" name="xo_security_options[ms_common_login_page]" type="checkbox" value="1" class="code" ' . checked( 1, $ms_common_login_page, false ) . ' /> ' . esc_html__( 'Common to all sites (recommended)', 'xo-security' ) . '</label></p>';
			}
		}
	}

	/**
	 * Dispaly password reset fields.
	 */
	public function option_page_field_password_reset() {
		$password_reset = isset( $this->parent->options['password_reset'] ) ? $this->parent->options['password_reset'] : true;
		echo '<select id="field_password_reset" name="xo_security_options[password_reset]">';
		echo '<option value="1"' . ( $password_reset ? ' selected' : '' ) . '>' . esc_html__( 'Enable', 'xo-security' ) . '</option>';
		echo '<option value="0"' . ( ! $password_reset ? ' selected' : '' ) . '>' . esc_html__( 'Disabled', 'xo-security' ) . '</option>';
		echo '</select>';
	}

	/**
	 * Dispaly login site link fields.
	 */
	public function option_page_field_login_site_link() {
		$login_site_link = isset( $this->parent->options['login_site_link'] ) ? $this->parent->options['login_site_link'] : true;
		echo '<select id="field_login_site_link" name="xo_security_options[login_site_link]">';
		echo '<option value="1"' . ( $login_site_link ? ' selected' : '' ) . '>' . esc_html__( 'Enable', 'xo-security' ) . '</option>';
		echo '<option value="0"' . ( ! $login_site_link ? ' selected' : '' ) . '>' . esc_html__( 'Disabled', 'xo-security' ) . '</option>';
		echo '</select>';
	}

	/**
	 * Dispaly comment captcha fields.
	 */
	public function option_page_field_comment_captcha() {
		$captcha = isset( $this->parent->options['comment_captcha'] ) ? $this->parent->options['comment_captcha'] : '';
		echo '<select id="field_comment_captcha" name="xo_security_options[comment_captcha]">';
		echo '<option value=""' . ( '' === $captcha ? ' selected' : '' ) . '>' . esc_html__( 'Disabled', 'xo-security' ) . '</option>';
		echo '<option value="en"' . ( 'en' === $captcha ? ' selected' : '' ) . '>' . esc_html__( 'Alphanumeric', 'xo-security' ) . '</option>';
		echo '<option value="jp"' . ( 'jp' === $captcha ? ' selected' : '' ) . '>' . esc_html__( 'Hiragana (Japanese)', 'xo-security' ) . '</option>';
		echo '</select>';
	}

	/**
	 * Dispaly comment spam fields.
	 */
	public function option_page_field_comment_spam() {
		$spam = isset( $this->parent->options['comment_spam'] ) ? $this->parent->options['comment_spam'] : false;
		echo '<label for="field_comment_spam"><input id="field_comment_spam" name="xo_security_options[comment_spam]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $spam, false ) . ' /> '
			. esc_html__( 'Does not include Japanese characters', 'xo-security' )
			. '</label>';

		$message = isset( $this->parent->options['comment_spam_message'] ) ? $this->parent->options['comment_spam_message'] : __( 'Please enter comment in Japanese. (Anti-spam)', 'xo-security' );
		echo '<p>'
			. '<label for="field_comment_spam_message">' . esc_html__( 'Message to display under the comment field:', 'xo-security' ) . '</label><br />'
			. '<input id="field_comment_spam_message" name="xo_security_options[comment_spam_message]" type="text" value="' . esc_attr( $message ) . '" class="large-text" style="display: inline;" maxlength="100" />'
			. '</p>';

		$spam_email = isset( $this->parent->options['comment_spam_email'] ) ? $this->parent->options['comment_spam_email'] : false;
		echo '<br>'
			. '<label for="field_comment_spam_email">'
			. '<input id="field_comment_spam_email" name="xo_security_options[comment_spam_email]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $spam_email, false ) . ' /> '
			. esc_html__( 'Email addresses of comments saved as spam', 'xo-security' )
			. '</label>';
	}

	/**
	 * Dispaly comment spam action fields.
	 */
	public function option_page_field_comment_spam_action() {
		$action = isset( $this->parent->options['comment_spam_action'] ) ? $this->parent->options['comment_spam_action'] : 'block';
		echo '<select id="field_comment_spam_action" name="xo_security_options[comment_spam_action]">';
		echo '<option value="block"' . ( 'block' === $action ? ' selected' : '' ) . '>' . esc_html__( 'Block', 'xo-security' ) . '</option>';
		echo '<option value="spam"' . ( 'spam' === $action ? ' selected' : '' ) . '>' . esc_html__( 'Save as spam', 'xo-security' ) . '</option>';
		echo '<option value="trash"' . ( 'trash' === $action ? ' selected' : '' ) . '>' . esc_html__( 'Save to trash', 'xo-security' ) . '</option>';
		echo '</select>';
	}

	/**
	 * Dispaly comment bot fields.
	 */
	public function option_page_field_comment_bot() {
		$bot = isset( $this->parent->options['comment_bot'] ) ? $this->parent->options['comment_bot'] : false;
		echo '<label for="field_comment_bot" class="label-checkbox-toggle"><input id="field_comment_bot" name="xo_security_options[comment_bot]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $bot, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p class="description">' . esc_html__( 'If JavaScript is disabled, if the form responds within 3 seconds, if it is not checked, etc., it is considered a bot.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly xmlrpc fields.
	 */
	public function option_page_field_xmlrpc() {
		$xmlrpc = isset( $this->parent->options['xmlrpc'] ) ? $this->parent->options['xmlrpc'] : false;
		echo '<label for="field_xmlrpc" class="label-checkbox-toggle"><input id="field_xmlrpc" name="xo_security_options[xmlrpc]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $xmlrpc, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p class="description">' . esc_html__( 'If XML-RPC pingback is not disabled, only authentication for XML-RPC is disabled. If XML-RPC pingback is disabled, XML-RPC as a whole is disabled.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly pingback fields.
	 */
	public function option_page_field_pingback() {
		$pingback = isset( $this->parent->options['pingback'] ) ? $this->parent->options['pingback'] : false;
		echo '<label for="field_pingback" class="label-checkbox-toggle"><input id="field_pingback" name="xo_security_options[pingback]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $pingback, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
	}

	/**
	 * Dispaly rest fields.
	 */
	public function option_page_field_rest() {
		$rest_server       = rest_get_server();
		$namespaces        = $rest_server->get_namespaces();
		$routes            = array_keys( $rest_server->get_routes() );
		$rest              = isset( $this->parent->options['rest'] ) ? $this->parent->options['rest'] : false;
		$disable_endpoints = isset( $this->parent->options['rest_disable_endpoints'] ) ? explode( ',', $this->parent->options['rest_disable_endpoints'] ) : array();

		$counter = 1;

		echo '<label for="field_rest" class="label-checkbox-toggle"><input id="field_rest" name="xo_security_options[rest]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $rest, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';

		echo '<p><div id="xo_security_rest_disable" class="xo-security-endpoints-checklist">';
		foreach ( $namespaces as $namespace ) {
			$namespace = '/' . $namespace;
			++$counter;

			echo '<ul>';
			echo '<li>';
			echo '<label class="selectit"><input id="field_rest_disable_' . esc_attr( $counter ) . '" class="namespace" name="xo_security_options[rest_disable_endpoints][]" value="' . esc_attr( $namespace ) . '" type="checkbox" ' . checked( in_array( $namespace, $disable_endpoints, true ), true, false ) . ' /> ' . esc_html( $namespace ) . '</label>';
			echo '<ul>';
			foreach ( $routes as $route ) {
				if ( $route !== $namespace && strpos( $route, $namespace ) === 0 ) {
					++$counter;

					echo '<li>';
					echo '<label class="selectit"><input id="field_rest_disable_' . esc_attr( $counter ) . '" class="route" name="xo_security_options[rest_disable_endpoints][]" value="' . esc_attr( $route ) . '" type="checkbox" data-namespace="' . esc_attr( $namespace ) . '" ' . checked( in_array( $route, $disable_endpoints, true ), true, false ) . ' /> ' . esc_html( $route ) . '</label>';
					echo '</li>';
				}
			}
			echo '</ul>';
			echo '</li>';
			echo '</ul>';
		}
		echo "</div></p>\n";
		echo '<p class="description">' . esc_html__( 'Protect the checked endpoints from users who are not logged in.', 'xo-security' ) . '</p>';

		global $wp_version;
		if ( version_compare( $wp_version, '4.8', '<' ) ) {
			echo '<p class="description">' . esc_html__( 'Exclusion setting is valid only in WordPress version 4.7 or later.', 'xo-security' ) . '</p>';
		}
	}

	/**
	 * Dispaly rest rename fields.
	 */
	public function option_page_field_rest_rename() {
		$c    = isset( $this->parent->options['rest_rename'] ) ? $this->parent->options['rest_rename'] : false;
		$name = ! empty( $this->parent->options['rest_name'] ) ? $this->parent->options['rest_name'] : rest_get_url_prefix();

		echo '<label for="field_rest_rename" class="label-checkbox-toggle"><input id="field_rest_rename" name="xo_security_options[rest_rename]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $c, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p><label for="field_rest_name">' . esc_html__( 'Prefix:', 'xo-security' ) . ' <input id="field_rest_name" name="xo_security_options[rest_name]" type="text" value="' . esc_attr( $name ) . '" class="regular-text" style="max-width:15em; display: inline;" maxlength="40" /></label></p>';
		echo '<p class="description">' . esc_html__( 'Characters can be used in the prefix is only lowercase letters, numbers, hyphens and underscores.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly edit author slug fields.
	 */
	public function option_page_field_edit_author_slug() {
		$edit_author_slug = isset( $this->parent->options['edit_author_slug'] ) ? $this->parent->options['edit_author_slug'] : false;

		echo '<label for="field_edit_author_slug" class="label-checkbox-toggle"><input id="field_edit_author_slug" name="xo_security_options[edit_author_slug]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $edit_author_slug, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p class="description">' . esc_html__( 'The author slug (Nicename) item has been added to your profile screen for editing. The author slug is the nicename of the user data. The value is retained even if you remove the plugin.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly edit author slug fields.
	 *
	 * @since 3.10.0
	 */
	public function option_page_field_edit_author_base() {
		$edit_author_base = isset( $this->parent->options['edit_author_base'] ) ? $this->parent->options['edit_author_base'] : false;

		echo '<label for="field_edit_author_base" class="label-checkbox-toggle"><input id="field_edit_author_base" name="xo_security_options[edit_author_base]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $edit_author_base, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p class="description">' . esc_html__( 'Author base item will be added to the permalink screen.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly author archive fields.
	 */
	public function option_page_field_author_archive() {
		$author_archive = isset( $this->parent->options['author_archive'] ) ? $this->parent->options['author_archive'] : false;

		echo '<label for="field_author_archive" class="label-checkbox-toggle"><input id="field_author_archive" name="xo_security_options[author_archive]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $author_archive, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p class="description">' . esc_html__( 'The standard sitemap user provider is also removed.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly comment author class fields.
	 */
	public function option_page_field_comment_author_class() {
		$comment_author_class = isset( $this->parent->options['comment_author_class'] ) ? $this->parent->options['comment_author_class'] : false;

		echo '<label for="field_comment_author_class" class="label-checkbox-toggle"><input id="field_comment_author_class" name="xo_security_options[comment_author_class]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $comment_author_class, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p class="description">' . esc_html__( 'Delete the class that contains the username that will be added to the comment list tag.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly oembed author fields.
	 */
	public function option_page_field_oembed_author() {
		$oembed_author = isset( $this->parent->options['oembed_author'] ) ? $this->parent->options['oembed_author'] : false;

		echo '<label for="field_oembed_author" class="label-checkbox-toggle"><input id="field_oembed_author" name="xo_security_options[oembed_author]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $oembed_author, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p class="description">' . esc_html__( 'Remove the username (author_name and author_url) from the oEmbed response data.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly disable feed fields.
	 */
	public function option_page_field_disable_feed() {
		$disable_feed = isset( $this->parent->options['disable_feed'] ) ? $this->parent->options['disable_feed'] : false;

		echo '<label for="field_disable_feed" class="label-checkbox-toggle"><input id="field_disable_feed" name="xo_security_options[disable_feed]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $disable_feed, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p class="description">' . esc_html__( 'Disable RSS and Atom feeds.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly remove version fields.
	 */
	public function option_page_field_remove_version() {
		$remove_version = isset( $this->parent->options['remove_version'] ) ? $this->parent->options['remove_version'] : false;

		echo '<label for="field_remove_version" class="label-checkbox-toggle"><input id="field_remove_version" name="xo_security_options[remove_version]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $remove_version, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p class="description">' . esc_html__( 'Remove the generator meta tags and WordPress versions such as links and script tags.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly delete readme.txt fields.
	 */
	public function option_page_field_delete_readme() {
		$delete_readme = isset( $this->parent->options['delete_readme'] ) ? $this->parent->options['delete_readme'] : false;

		echo '<label for="field_delete_readme" class="label-checkbox-toggle"><input id="field_delete_readme" name="xo_security_options[delete_readme]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $delete_readme, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p class="description">' . esc_html__( 'Delete the WordPress core readme.html file.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly maintenance mode.
	 */
	public function option_page_field_maintenance_mode() {
		$maintenance_mode = isset( $this->parent->options['maintenance_mode'] ) ? $this->parent->options['maintenance_mode'] : false;
		echo '<label for="field_maintenance_mode" class="label-checkbox-toggle"><input id="field_maintenance_mode" name="xo_security_options[maintenance_mode]" type="checkbox" value="1" class="code checkbox-toggle" ' . checked( 1, $maintenance_mode, false ) . ' /> ' . esc_html__( 'ON', 'xo-security' ) . '</label>';
		echo '<p class="description">' . esc_html__( 'Displays the maintenance screen for all non-administrator users.', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly IP mode fields.
	 */
	public function option_page_field_ip_mode() {
		$ip_mode = isset( $this->parent->options['ip_mode'] ) ? $this->parent->options['ip_mode'] : '';

		$undefined_text = __( '(Undefined)', 'xo-security' );
		$xforwarded_ips = isset( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ? explode( ',', wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$xforwarded_ips = array_pad( $xforwarded_ips, 3, $undefined_text );
		$remote_ip      = isset( $_SERVER['REMOTE_ADDR'] ) ? wp_unslash( $_SERVER['REMOTE_ADDR'] ) : $undefined_text; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$xreal_ip       = isset( $_SERVER['HTTP_X_REAL_IP'] ) ? wp_unslash( $_SERVER['HTTP_X_REAL_IP'] ) : $undefined_text; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$client_ip      = isset( $_SERVER['HTTP_CLIENT_IP'] ) ? wp_unslash( $_SERVER['HTTP_CLIENT_IP'] ) : $undefined_text; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		echo '<fieldset><legend class="screen-reader-text"><span> ' . esc_html__( 'IP mode', 'xo-security' ) . ' </span></legend>';

		echo '<label><input name="xo_security_options[ip_mode]" type="radio" value="" ' . checked( $ip_mode, '', false ) . ' /> ';
		echo '<span class="ip-mode-text">' . esc_html__( 'Auto', 'xo-security' ) . '</span><code>' . esc_html( $this->parent->get_auto_ipaddress() ) . "</code></label><br />\n";

		echo '<label><input name="xo_security_options[ip_mode]" type="radio" value="http_x_real_ip" ' . checked( $ip_mode, 'http_x_real_ip', false ) . ' /> ';
		echo '<span class="ip-mode-text">' . esc_html__( 'HTTP_X_REAL_IP', 'xo-security' ) . '</span><code>' . esc_html( $xreal_ip ) . "</code></label><br />\n";

		echo '<label><input name="xo_security_options[ip_mode]" type="radio" value="remote_addr" ' . checked( $ip_mode, 'remote_addr', false ) . ' /> ';
		echo '<span class="ip-mode-text">' . esc_html__( 'REMOTE_ADDR', 'xo-security' ) . '</span><code>' . esc_html( $remote_ip ) . "</code></label><br />\n";

		echo '<label><input name="xo_security_options[ip_mode]" type="radio" value="http_x_forward_for_1" ' . checked( $ip_mode, 'http_x_forward_for_1', false ) . ' /> ';
		echo '<span class="ip-mode-text">' . esc_html__( 'X_FORWARDED_FOR: Client', 'xo-security' ) . '</span><code>' . esc_html( $xforwarded_ips[0] ) . "</code></label><br />\n";

		echo '<label><input name="xo_security_options[ip_mode]" type="radio" value="http_x_forward_for_2" ' . checked( $ip_mode, 'http_x_forward_for_2', false ) . ' /> ';
		echo '<span class="ip-mode-text">' . esc_html__( 'X_FORWARDED_FOR: Proxy1', 'xo-security' ) . '</span><code>' . esc_html( $xforwarded_ips[1] ) . "</code></label><br />\n";

		echo '<label><input name="xo_security_options[ip_mode]" type="radio" value="http_x_forward_for_3" ' . checked( $ip_mode, 'http_x_forward_for_3', false ) . ' /> ';
		echo '<span class="ip-mode-text">' . esc_html__( 'X_FORWARDED_FOR: Proxy2', 'xo-security' ) . '</span><code>' . esc_html( $xforwarded_ips[2] ) . "</code></label><br />\n";

		echo '<label><input name="xo_security_options[ip_mode]" type="radio" value="http_client_ip" ' . checked( $ip_mode, 'http_client_ip', false ) . ' /> ';
		echo '<span class="ip-mode-text">' . esc_html__( 'HTTP_CLIENT_IP', 'xo-security' ) . '</span><code>' . esc_html( $client_ip ) . "</code></label><br />\n";

		echo '</fieldset>';
		echo '<p class="description">' . esc_html__( 'Normally you should select "Auto".', 'xo-security' ) . '</p>';
	}

	/**
	 * Dispaly CAPTCHA type fields.
	 *
	 * @since 3.10.0
	 */
	public function option_page_field_captcha_type() {
		$captcha_type = isset( $this->parent->options['captcha_type'] ) ? $this->parent->options['captcha_type'] : 'default';

		$captcha_type_items = array(
			array( 'default', __( 'Default', 'xo-security' ), 'captcha-default.png' ),
			array( 'chokokutai', __( 'Chokokutai font', 'xo-security' ), 'captcha-chokokutai.png' ),
			array( 'auto', __( 'Auto mode', 'xo-security' ), 'captcha-auto.png' ),
		)
		?>
		<fieldset id="captcha-type-picker" class="captcha-type-list">
			<?php
			foreach ( $captcha_type_items as $captcha_type_item ) :
				?>
				<div class="captcha-type-option <?php echo ( $captcha_type_item[0] === $captcha_type ) ? 'selected' : ''; ?>">
					<input name="xo_security_options[captcha_type]" type="radio" value="<?php echo esc_attr( $captcha_type_item[0] ); ?>" class="tog" <?php checked( $captcha_type_item[0], $captcha_type ); ?> />
					<label for="xo_security_options[captcha_type]"><?php echo esc_html( $captcha_type_item[1] ); ?></label>
					<img src="<?php echo esc_url( XO_SECURITY_URL . '/images/' . $captcha_type_item[2] ); ?>" alt="" height="36" width="100">
				</div>
				<?php
			endforeach;
			?>
		</fieldset>
		<?php

		echo '<p class="description">' . esc_html__( 'The contents of "Auto mode" are subject to change with version upgrades.', 'xo-security' ) . '</p>';
	}

	/**
	 * Sanitize login tab fields.
	 *
	 * @param array $input Input field datas.
	 */
	public function sanitize_login( $input ) {
		global $option_page, $wp_filesystem;

		if ( 'xo_security_login' !== $option_page ) {
			return $input;
		}

		$output = $this->get_option();

		$interval    = isset( $input['interval'] ) ? intval( $input['interval'] ) : 0;
		$limit_count = isset( $input['limit_count'] ) ? intval( $input['limit_count'] ) : 4;
		if ( $interval > 0 ) {
			if ( 0 >= $limit_count || $limit_count > 100 ) {
				add_settings_error( 'xo_security', 'limit_count', __( 'Attempts to limit the number of times enter numbers from 1 to 100.', 'xo-security' ) );
			}
		}

		$blocked_tarpit = isset( $input['blocked_tarpit'] ) ? intval( $input['blocked_tarpit'] ) : 30;
		if ( 0 > $blocked_tarpit || $blocked_tarpit > 120 ) {
			add_settings_error( 'xo_security', 'blocked_tarpit', __( 'In the numbers from 0 to 120 block when the response delay.', 'xo-security' ) );
		}

		$failed_tarpit = isset( $input['failed_tarpit'] ) ? intval( $input['failed_tarpit'] ) : 3;
		if ( 0 > $failed_tarpit || $failed_tarpit > 10 ) {
			add_settings_error( 'xo_security', 'failed_tarpit', __( 'Failure response delay enter in the numbers from 0 to 10.', 'xo-security' ) );
		}

		$login_page      = isset( $input['login_page'] );
		$login_page_name = isset( $input['login_page_name'] ) ? sanitize_text_field( $input['login_page_name'] ) : '';
		if ( ( $login_page !== $output['login_page'] ) || ( $login_page_name !== $output['login_page_name'] ) ) {
			if ( empty( $wp_filesystem ) ) {
				require_once ABSPATH . '/wp-admin/includes/file.php';
			}
			$url   = wp_nonce_url( 'options-general.php?page=xo-security-settings', 'xo-security-settings' );
			$creds = request_filesystem_credentials( $url, '', false, false, null );
			if ( false === $creds ) {
				add_settings_error( 'xo_security', 'file', __( 'Unable to connect to the filesystem.', 'xo-security' ) );
			} elseif ( ! WP_Filesystem( $creds ) ) {
				add_settings_error( 'xo_security', 'file', __( 'Unable to write.', 'xo-security' ) );
			} else {
				if ( $output['login_page_name'] ) {
					$old_path = ABSPATH . $output['login_page_name'] . '.php';
					if ( $wp_filesystem->exists( $old_path ) ) {
						$wp_filesystem->delete( $old_path );
					}
				}
				if ( $login_page ) {
					if ( $login_page_name ) {
						$new_path = ABSPATH . $login_page_name . '.php';
						if ( $wp_filesystem->exists( $new_path ) ) {
							$login_page      = $output['login_page'];
							$login_page_name = $output['login_page_name'];
							add_settings_error( 'xo_security', 'login_page_name', __( 'The file specified in the login file already exists. Please enter a different name.', 'xo-security' ) );
						} else {
							$result = $wp_filesystem->put_contents( $new_path, stripslashes( $this->loginfile_content ), FS_CHMOD_FILE );
							if ( ! $result || ! $wp_filesystem->exists( $new_path ) ) {
								$login_page      = $output['login_page'];
								$login_page_name = $output['login_page_name'];
								add_settings_error( 'xo_security', 'file', __( 'Failed to create a login file.', 'xo-security' ) );
							}
						}
					} else {
						$login_page      = $output['login_page'];
						$login_page_name = $output['login_page_name'];
						add_settings_error( 'xo_security', 'login_page_name', __( 'It is not possible to omit the login file.', 'xo-security' ) );
					}
				} else {
					$login_page_name = '';
				}
			}
		}

		$login_alert_body = isset( $input['login_alert_body'] ) ? $input['login_alert_body'] : null;
		$login_alert_body = str_replace( '%DATE%', '%_DATE%', $login_alert_body );
		$login_alert_body = sanitize_textarea_field( $login_alert_body );
		$login_alert_body = str_replace( '%_DATE%', '%DATE%', $login_alert_body );

		$output['interval']               = $interval;
		$output['limit_count']            = $limit_count;
		$output['blocked_tarpit']         = $blocked_tarpit;
		$output['failed_tarpit']          = $failed_tarpit;
		$output['login_page']             = $login_page;
		$output['login_page_name']        = $login_page_name;
		$output['ms_common_login_page']   = isset( $input['ms_common_login_page'] );
		$output['login_alert']            = isset( $input['login_alert'] );
		$output['login_alert_subject']    = isset( $input['login_alert_subject'] ) ? sanitize_text_field( $input['login_alert_subject'] ) : null;
		$output['login_alert_body']       = $login_alert_body;
		$output['login_alert_admin_only'] = isset( $input['login_alert_admin_only'] );
		$output['login_captcha']          = sanitize_text_field( $input['login_captcha'] );
		$output['error_login_message']    = ( '1' === $input['error_login_message'] );
		$output['two_factor']             = isset( $input['two_factor'] );
		$output['two_factor_roles']       = array_map( 'sanitize_text_field', isset( $input['two_factor_roles'] ) ? $input['two_factor_roles'] : array() );
		$output['login_id_type']          = sanitize_text_field( $input['login_id_type'] );
		$output['password_reset']         = ( '1' === $input['password_reset'] );
		$output['login_site_link']        = ( '1' === $input['login_site_link'] );

		return $output;
	}

	/**
	 * Sanitize comment tab fields.
	 *
	 * @param array $input Input field datas.
	 */
	public function sanitize_comment( $input ) {
		global $option_page;

		if ( 'xo_security_comment' !== $option_page ) {
			return $input;
		}

		$output = get_option( 'xo_security_options' );

		$output['comment_captcha']      = sanitize_text_field( $input['comment_captcha'] );
		$output['comment_spam']         = isset( $input['comment_spam'] );
		$output['comment_spam_email']   = isset( $input['comment_spam_email'] );
		$output['comment_spam_message'] = sanitize_text_field( $input['comment_spam_message'] );
		$output['comment_spam_action']  = sanitize_text_field( $input['comment_spam_action'] );
		$output['comment_bot']          = isset( $input['comment_bot'] );

		return $output;
	}

	/**
	 * Sanitize XMLRPC tab fields.
	 *
	 * @param array $input Input field datas.
	 */
	public function sanitize_xmlrpc( $input ) {
		global $option_page;

		if ( 'xo_security_xmlrpc' !== $option_page ) {
			return $input;
		}

		$output = get_option( 'xo_security_options' );

		$output['xmlrpc']   = isset( $input['xmlrpc'] );
		$output['pingback'] = isset( $input['pingback'] );

		return $output;
	}

	/**
	 * Sanitize REST names tab fields.
	 *
	 * @param array $input_names Input field datas.
	 */
	private function sanitize_rest_names( $input_names ) {
		$rest_server = rest_get_server();
		$namespaces  = $rest_server->get_namespaces();
		$routes      = array_keys( $rest_server->get_routes() );

		$names = array();
		foreach ( (array) $input_names as $name ) {
			if ( in_array( $name, $routes, true ) ) {
				$names[] = $name;
			}
		}
		return $names;
	}

	/**
	 * Sanitize REST API tab fields.
	 *
	 * @param array $input Input field datas.
	 */
	public function sanitize_restapi( $input ) {
		global $option_page;

		if ( 'xo_security_restapi' !== $option_page ) {
			return $input;
		}

		$output = get_option( 'xo_security_options' );

		$input['rest_rename'] = isset( $input['rest_rename'] );
		$input['rest_name']   = isset( $input['rest_name'] ) ? $input['rest_name'] : '';
		if (
			( ! isset( $output['rest_rename'] ) || $input['rest_rename'] !== $output['rest_rename'] ) ||
			( ! isset( $output['rest_name'] ) || $input['rest_name'] !== $output['rest_name'] )
		) {
			set_transient( 'xo_security_flush_rewrite_rules', true, MINUTE_IN_SECONDS );
		}

		$output['rest'] = isset( $input['rest'] );
		if ( isset( $input['rest_disable_endpoints'] ) && is_array( $input['rest_disable_endpoints'] ) ) {
			$output['rest_disable_endpoints'] = implode( ',', $this->sanitize_rest_names( $input['rest_disable_endpoints'] ) );
		} else {
			$output['rest_disable_endpoints'] = '';
		}

		$output['rest_rename'] = $input['rest_rename'];
		$output['rest_name']   = sanitize_text_field( $input['rest_name'] );

		return $output;
	}

	/**
	 * Sanitize secret tab fields.
	 *
	 * @param array $input Input field datas.
	 */
	public function sanitize_secret( $input ) {
		global $option_page, $wp_filesystem;

		if ( 'xo_security_secret' !== $option_page ) {
			return $input;
		}

		$output  = get_option( 'xo_security_options' );
		$rewrite = false;

		$output_edit_author_base = isset( $output['edit_author_base'] ) ? $output['edit_author_base'] : false;
		$edit_author_base        = isset( $input['edit_author_base'] );
		if ( $output_edit_author_base !== $edit_author_base ) {
			$rewrite = true;
		}

		$author_archive = isset( $input['author_archive'] );
		if ( ! isset( $output['author_archive'] ) || $author_archive !== $output['author_archive'] ) {
			if ( $author_archive ) {
				add_filter( 'author_rewrite_rules', array( $this, 'author_rewrite_rules' ) );
			} else {
				remove_filter( 'author_rewrite_rules', array( $this, 'author_rewrite_rules' ) );
			}
			$rewrite = true;
		}

		if ( isset( $input['delete_readme'] ) ) {
			if ( ! $this->parent->delete_readme_file() ) {
				unset( $input['delete_readme'] );
				add_settings_error( 'xo_security', 'delete_readme', __( 'Could not delete readme.html file.', 'xo-security' ) );
			}
		}

		if ( $rewrite ) {
			set_transient( 'xo_security_flush_rewrite_rules', true, MINUTE_IN_SECONDS );
		}

		$output['edit_author_slug']     = isset( $input['edit_author_slug'] );
		$output['edit_author_base']     = $edit_author_base;
		$output['author_archive']       = $author_archive;
		$output['comment_author_class'] = isset( $input['comment_author_class'] );
		$output['oembed_author']        = isset( $input['oembed_author'] );
		$output['disable_feed']         = isset( $input['disable_feed'] );
		$output['remove_version']       = isset( $input['remove_version'] );
		$output['delete_readme']        = isset( $input['delete_readme'] );

		return $output;
	}

	/**
	 * Sanitize maintenance tab fields.
	 *
	 * @param array $input Input field datas.
	 */
	public function sanitize_maintenance( $input ) {
		global $option_page;

		if ( 'xo_security_maintenance' !== $option_page ) {
			return $input;
		}

		$output = get_option( 'xo_security_options' );

		$output['maintenance_mode'] = isset( $input['maintenance_mode'] );

		return $output;
	}

	/**
	 * Sanitize environment tab fields.
	 *
	 * @param array $input Input field datas.
	 */
	public function sanitize_environment( $input ) {
		global $wpdb, $option_page;

		if ( 'xo_security_environment' !== $option_page ) {
			return $input;
		}

		$output = get_option( 'xo_security_options' );

		$output['ip_mode']            = sanitize_text_field( $input['ip_mode'] );
		$output['auto_truncate']      = intval( $input['auto_truncate'] );
		$output['log_default_status'] = sanitize_text_field( $input['log_default_status'] );
		$output['dashboard_widget']   = ( '1' === $input['dashboard_widget'] );
		$output['captcha_type']       = sanitize_text_field( $input['captcha_type'] );

		if ( $output['auto_truncate'] > 0 ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->prefix}xo_security_loginlog WHERE login_time <= DATE_SUB(NOW(), INTERVAL %d day);", $output['auto_truncate'] ) );
		}

		return $output;
	}

	/**
	 * Setup dashboard widget.
	 */
	public function dashboard_setup() {
		wp_add_dashboard_widget( 'xo_security_dashboard_login_widget', __( 'Login information', 'xo-security' ), array( $this, 'dashboard_login_widget' ) );
	}

	/**
	 * Dashboard login widget.
	 */
	public function dashboard_login_widget() {
		echo '<div class="login-widget-errors notice notice-error inline hide-if-js">'
			. '<p class="hide-if-js">'
			. esc_html__( 'This widget requires JavaScript.', 'xo-security' )
			. '</p>'
			. '</div>' . "\n";

		echo '<div class="login_widget hide-if-no-js">'
			. '<ul>'
			. '<li>' . esc_html__( 'Current login date', 'xo-security' ) . ': </li>'
			. '<li>' . esc_html__( 'Last login date', 'xo-security' ) . ': </li>'
			. '</ul>'
			. '</div>' . "\n";

		$current_user = wp_get_current_user();
		if ( $current_user->has_cap( 'administrator' ) ) {
			$hours = 24;
			$days  = 30;

			echo '<div class="login_widget hide-if-no-js">'
				. '<ul>'
				/* translators: %s hours */
				. '<li>' . esc_html( sprintf( _n( 'Failed login count (%d hour)', 'Failed login count (%d hours)', $hours, 'xo-security' ), $hours ) ) . ': </li>'
				/* translators: %s Days */
				. '<li>' . esc_html( sprintf( _n( 'Failed login count (%d day)', 'Failed login count (%d days)', $days, 'xo-security' ), $days ) ) . ': </li>'
				. '</ul>'
				. '</div>' . "\n";
		}
	}

	/**
	 * Ajax handler for dashboard widget.
	 *
	 * @since 3.6.2
	 */
	public function ajax_dashboard() {
		global $wpdb;

		check_ajax_referer( 'xo-security-dashboard', 'nonce' );

		$current_user = wp_get_current_user();

		if ( ! $current_user->exists() ) {
			wp_send_json_error();
		}

		$user_login      = $current_user->get( 'user_login' );
		$datetime_format = get_option( 'date_format' ) . ' ' . get_option( 'time_format' );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT login_time FROM {$wpdb->prefix}xo_security_loginlog WHERE user_name = %s AND success = 1 ORDER BY login_time DESC LIMIT 2;",
				$user_login
			)
		);

		if ( is_array( $rows ) ) {
			if ( count( $rows ) >= 1 ) {
				$current_date = $rows[0]->login_time;
			}
			if ( count( $rows ) >= 2 ) {
				$last_date = $rows[1]->login_time;
			}
		}

		$html = '<div class="login_widget">'
			. '<ul>'
			. '<li>' . esc_html__( 'Current login date', 'xo-security' ) . ': '
			. ( empty( $current_date ) ? esc_html__( 'Unknown', 'xo-security' ) : esc_html( mysql2date( $datetime_format, $current_date ) ) ) . '</li>'
			. '<li>' . esc_html__( 'Last login date', 'xo-security' ) . ': '
			. ( empty( $last_date ) ? esc_html__( 'Unknown', 'xo-security' ) : esc_html( mysql2date( $datetime_format, $last_date ) ) ) . '</li>'
			. '</ul>'
			. '</div>' . "\n";

		if ( $current_user->has_cap( 'administrator' ) ) {
			$timestamp = strtotime( current_time( 'mysql' ) );

			$hours = 24;
			$days  = 30;

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$hours_count = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COUNT(*) FROM {$wpdb->prefix}xo_security_loginlog WHERE success = 0 AND login_time >= %s;",
					gmdate( 'Y-m-d H:i:s', (int) $timestamp - ( $hours * 60 * 60 ) )
				)
			);

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$first_date = $wpdb->get_var(
				"SELECT login_time FROM {$wpdb->prefix}xo_security_loginlog ORDER BY login_time ASC LIMIT 1;"
			);

			if ( null === $first_date ) {
				$days       = 0;
				$days_count = 0;
			} else {
				$first_days = (int) ( abs( $timestamp - strtotime( $first_date ) ) / ( 60 * 60 * 24 ) );
				if ( 0 >= $first_days ) {
					$days = 1;
				} elseif ( $days > $first_days ) {
					$days = $first_days;
				}

				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				$days_count = $wpdb->get_var(
					$wpdb->prepare(
						"SELECT COUNT(*) FROM {$wpdb->prefix}xo_security_loginlog WHERE success = 0 AND login_time >= %s;",
						gmdate( 'Y-m-d H:i:s', (int) $timestamp - ( $days * 24 * 60 * 60 ) )
					)
				);
			}

			$html .= '<div class="login_widget">'
				. '<ul>'
				/* translators: %s hours */
				. '<li>' . esc_html( sprintf( _n( 'Failed login count (%d hour)', 'Failed login count (%d hours)', $hours, 'xo-security' ), $hours ) ) . ': '
				. esc_html( number_format_i18n( (int) $hours_count ) ) . '</li>'
				/* translators: %s Days */
				. '<li>' . esc_html( sprintf( _n( 'Failed login count (%d day)', 'Failed login count (%d days)', $days, 'xo-security' ), $days ) ) . ': '
				. esc_html( number_format_i18n( (int) $days_count ) ) . '</li>'
				. '</ul>'
				. '</div>' . "\n";
		}

		wp_send_json_success( $html );
	}

	/**
	 * Display 'Nicename' item on the 'Edit User' screen.
	 *
	 * @since 3.0.0
	 *
	 * @param object $profileuser A WP_User object.
	 */
	public function edit_user_profile( $profileuser ) {
		?>
		<h2><?php esc_html_e( 'Slug', 'xo-security' ); ?></h2>
		<table class="form-table" role="presentation">
		<tbody>
		<tr class="user-last-name-wrap">
			<th><label for="user_nicename"><?php esc_html_e( 'Author Slug (Nicename)', 'xo-security' ); ?></label></th>
			<td>
			<input type="text" name="user_nicename" id="user_nicename" value="<?php echo esc_attr( $profileuser->user_nicename ); ?>" class="regular-text" />
			<span class="description"><?php esc_html_e( 'If omitted, it will be the username.', 'xo-security' ); ?></span>
			<p class="description"><?php esc_html_e( 'Used for things like the URL of an author archive page.', 'xo-security' ); ?></p>
			</td>
		</tr>
		</tbody></table>
		<?php
	}

	/**
	 * Fires before user profile update errors are returned.
	 *
	 * @since 3.0.0
	 *
	 * @param WP_Error $errors WP_Error object (passed by reference).
	 * @param bool     $update Whether this is a user update.
	 * @param stdClass $user   User object (passed by reference).
	 */
	public function user_profile_update_errors( $errors, $update, $user ) {
		if ( ! $update ) {
			return;
		}

		if ( empty( $user->ID ) ) {
			return;
		}

		check_admin_referer( 'update-user_' . $user->ID );

		if ( isset( $_POST['user_nicename'] ) ) {
			$user_nicename = sanitize_user( wp_unslash( $_POST['user_nicename'] ), true );

			$old_user_nicename = get_user_by( 'id', $user->ID )->user_nicename;
			if ( $user_nicename === $old_user_nicename ) {
				return;
			}

			if ( mb_strlen( $user_nicename ) > 50 ) {
				$errors->add( 'user_nicename_too_long', __( '<strong>Error:</strong> The author slug may not be longer than 50 characters.', 'xo-security' ) );
				return;
			}

			if ( get_user_by( 'slug', $user_nicename ) ) {
				$errors->add( 'user_nicename_exists', __( '<strong>Error:</strong> The author slug with the same name already exists.', 'xo-security' ) );
				return;
			}

			$user->user_nicename = $user_nicename;
		}
	}

	/**
	 * Renders author-base field.
	 *
	 * @since 3.10.0
	 */
	public function author_base_field() {
		$author_base = isset( $this->parent->options['author_base'] ) ? $this->parent->options['author_base'] : '';
		if ( 'author' === $author_base ) {
			$author_base = '';
		}

		$blog_prefix = '';

		$permalink_structure = get_option( 'permalink_structure' );
		if ( is_multisite() && ! is_subdomain_install() && is_main_site() && str_starts_with( $permalink_structure, '/blog/' ) ) {
			$blog_prefix = '/blog';
			if ( ! empty( $author_base ) ) {
				$author_base = '/' . $author_base;
			}
		}

		echo esc_html( $blog_prefix . "\n" );
		printf( '<input name="author_base" id="author_base" type="text" value="%s" class="regular-text code">', esc_attr( $author_base ) );
	}

	/**
	 * Add an author-base configuration field to your permalink page.
	 *
	 * @since 3.10.0
	 */
	public function add_settings_author_base_field() {
		add_settings_field(
			'xo_security_author_base',
			esc_html__( 'Author base', 'xo-security' ),
			array( $this, 'author_base_field' ),
			'permalink',
			'optional',
			array( 'label_for' => 'author_base' )
		);
	}

	/**
	 * Sanitize author base.
	 *
	 * @since 3.10.0
	 *
	 * @param string $author_base Author base.
	 * @return string Author base.
	 */
	private function sanitize_author_base( $author_base ) {
		if ( ! empty( $author_base ) ) {
			$author_base = trim( $author_base, '/' );
			$author_base = preg_replace( '#/+#', '/', $author_base );
			$author_base = preg_replace( '/[^A-Za-z0-9\_\-\/]/', '', $author_base );
		}
		return $author_base;
	}

	/**
	 * Add an author-base configuration field to your permalink page.
	 *
	 * @since 3.10.0
	 */
	public function update_settings_author_base() {
		if ( isset( $_POST['permalink_structure'] ) || isset( $_POST['category_base'] ) ) {
			check_admin_referer( 'update-permalink' );
			if ( isset( $_POST['author_base'] ) ) {
				$input_author_base = $this->sanitize_author_base( sanitize_text_field( wp_unslash( $_POST['author_base'] ) ) );

				if ( 'author' === $input_author_base ) {
					$input_author_base = '';
				}

				$author_base = isset( $this->parent->options['author_base'] ) ? $this->parent->options['author_base'] : '';
				if ( $author_base !== $input_author_base ) {
					global $wp_rewrite;

					$wp_rewrite->author_base = $input_author_base;

					$this->parent->options['author_base'] = $input_author_base;
					update_option( 'xo_security_options', $this->parent->options );
				}
			}
		}
	}
}
