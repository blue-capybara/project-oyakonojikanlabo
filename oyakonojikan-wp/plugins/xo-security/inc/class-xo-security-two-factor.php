<?php
/**
 * XO Security Two Factor Authentication.
 *
 * @package xo-security
 * @since 3.9.0
 */

/**
 * XO Security Two Factor Authentication class.
 *
 * @since 3.9.0
 */
class XO_Security_Two_Factor {
	/**
	 * Parent object.
	 *
	 * @since 3.9.0
	 * @var XO_Security
	 */
	private $parent;

	/**
	 * Construction.
	 *
	 * @since 3.9.0
	 *
	 * @param XO_Security $parent_object XO_Security object.
	 */
	public function __construct( $parent_object ) {
		require_once 'class-xo-security-google-authenticator.php';

		$this->parent = $parent_object;

		add_action( 'plugins_loaded', array( $this, 'setup' ) );
	}

	/**
	 * Plugin setup.
	 *
	 * @since 3.9.0
	 */
	public function setup() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'show_user_profile', array( $this, 'edit_user_profile' ) );
		add_action( 'edit_user_profile', array( $this, 'edit_user_profile' ) );
		add_action( 'user_profile_update_errors', array( $this, 'user_profile_update_errors' ), 10, 3 );
		add_action( 'wp_login', array( $this, 'wp_login' ), 0, 2 );
	}

	/**
	 * Determine if the user has a role.
	 *
	 * @since 3.9.0
	 *
	 * @param WP_User $user WP_User object of the logged-in user.
	 * @return bool
	 */
	private function has_user_role( $user ) {
		if ( is_multisite() && is_super_admin( $user->ID ) ) {
			return true;
		}

		if ( isset( $this->parent->options['two_factor_roles'] ) ) {
			$role = null;
			if ( isset( $user->role ) ) {
				$role = $user->role;
			} elseif ( isset( $user->roles ) && 0 < count( $user->roles ) ) {
				$role = $user->roles[0];
			}
			if ( $role && in_array( $role, (array) $this->parent->options['two_factor_roles'], true ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Enqueue scripts
	 *
	 * @since 3.9.0
	 */
	public function enqueue_assets() {
		wp_register_script( 'xo-security-qrcode', XO_SECURITY_URL . '/js/qrcode.min.js', array(), XO_SECURITY_VERSION, false );
	}

	/**
	 * Display Two-Factor on the 'Edit User' screen.
	 *
	 * @since 3.9.0
	 *
	 * @param object $user A WP_User object.
	 */
	public function edit_user_profile( $user ) {
		if ( ! $this->has_user_role( $user ) ) {
			return;
		}

		if ( isset( $_REQUEST['xo_security_two_factor_secret_key'] ) ) {
			check_admin_referer( 'update-user_' . $user->ID );
			$secret_key = sanitize_text_field( wp_unslash( $_REQUEST['xo_security_two_factor_secret_key'] ) );
		} else {
			$ga         = new XO_Security_Google_Authenticator();
			$secret_key = $ga->create_secret();
		}

		$issuer     = get_bloginfo( 'name', 'display' );
		$totp_title = $issuer . ': ' . $user->user_login;
		$totp_url   = add_query_arg(
			array(
				'secret' => rawurlencode( $secret_key ),
				'issuer' => rawurlencode( $issuer ),
			),
			'otpauth://totp/' . rawurlencode( $totp_title )
		);

		$enable = get_user_meta( $user->ID, 'xo_security_two_factor_enable', true );
		$enable = ! empty( $enable );

		echo '<h2>' . esc_html__( 'Two-factor authentication settings', 'xo-security' ) . '</h2>';
		echo '<table class="form-table" role="presentation"><tbody>';

		if ( $enable ) :
			?>
			<tr>
				<th scope="row"><?php esc_html_e( 'Two-factor authentication', 'xo-security' ); ?></th>
				<td>
					<label for="xo_security_two_factor_enable">
						<input name="xo_security_two_factor_enable" type="checkbox" id="xo_security_two_factor_enable" value="true" <?php checked( true, $enable ); ?> />
						<?php esc_html_e( 'Enable', 'xo-security' ); ?>
					</label>
					<p class="description"><?php esc_html_e( 'Turn it off if you want to reset it.', 'xo-security' ); ?></p>
				</td>
			</tr>
		<?php else : ?>
			<tr>
				<th><label for="xo_security_two_factor_secret_key"><?php esc_html_e( 'Secret key', 'xo-security' ); ?></label></th>
				<td>
				<input type="text" name="xo_security_two_factor_secret_key" id="xo_security_two_factor_secret_key" readonly="readonly" value="<?php echo esc_attr( $secret_key ); ?>" class="regular-text" />
				<div id="xo_security_qrcode" style="background-color: #fff; margin: 16px 0; padding: 20px; width: 200px;"></div>
				<p class="description"><?php esc_html_e( 'Scan the QR code with the Google Authenticator app or manually enter the secret key.', 'xo-security' ); ?></p>
				</td>
			</tr>
			<tr>
				<th><label for="xo_security_two_factor_authenticator_code"><?php esc_html_e( 'Authentication Code', 'xo-security' ); ?></label></th>
				<td>
				<input type="text" name="xo_security_two_factor_authenticator_code" id="xo_security_two_factor_authenticator_code" value="" class="regular-text" maxlength="6" autocomplete="off" spellcheck="false" />
				<p class="description"><?php esc_html_e( 'Entering the correct verification code will enable two-factor authentication.', 'xo-security' ); ?></p>
				</td>
			</tr>
			<?php
			$js =
				'var xo_security_qrcode = new QRCode(document.getElementById("xo_security_qrcode"), {
					text: "' . esc_url( $totp_url, array( 'otpauth' ) ) . '",
					width: 200,
					height: 200,
					colorDark : "#000000",
					colorLight : "#ffffff",
					correctLevel : QRCode.CorrectLevel.M
				});';

			wp_enqueue_script( 'xo-security-qrcode' );
			wp_add_inline_script( 'xo-security-qrcode', $js );
		endif;
		echo '</tbody></table>';
	}

	/**
	 * Fires before user profile update errors are returned.
	 *
	 * @since 3.9.0
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

		if ( ! isset( $_POST['xo_security_two_factor_enable'] ) ) {
			update_user_meta( $user->ID, 'xo_security_two_factor_enable', false );
		}

		if ( empty( $_POST['xo_security_two_factor_secret_key'] ) || empty( $_POST['xo_security_two_factor_authenticator_code'] ) ) {
			return;
		}

		$key  = sanitize_text_field( wp_unslash( $_POST['xo_security_two_factor_secret_key'] ) );
		$code = sanitize_text_field( wp_unslash( $_POST['xo_security_two_factor_authenticator_code'] ) );

		$ga = new XO_Security_Google_Authenticator();
		if ( $ga->verify_code( $key, $code, 2 ) ) {
			update_user_meta( $user->ID, 'xo_security_two_factor_enable', true );
			update_user_meta( $user->ID, 'xo_security_two_factor_secret_key', $key );
		} else {
			update_user_meta( $user->ID, 'xo_security_two_factor_enable', false );
			$errors->add( 'authenticator_code_error', __( '<strong>Error:</strong> Authentication code is incorrect.', 'xo-security' ) );
		}
	}

	/**
	 * Handle the browser-based login.
	 *
	 * @since 3.9.0
	 *
	 * @param string  $user_login Username.
	 * @param WP_User $user WP_User object of the logged-in user.
	 */
	public function wp_login( $user_login, $user ) {
		$enable = get_user_option( 'xo_security_two_factor_enable', $user->ID );

		if ( ! $enable ) {
			return;
		}

		$key = get_user_option( 'xo_security_two_factor_secret_key', $user->ID );

		if ( empty( $key ) ) {
			return;
		}

		if ( ! $this->has_user_role( $user ) ) {
			return;
		}

		$code = '';

		if ( ! empty( $_POST['google_authenticator_code'] ) && check_admin_referer( 'xo_security_authenticator_code_form', 'xo_security_authenticator_nonce' ) ) {
			$code = sanitize_text_field( wp_unslash( $_POST['google_authenticator_code'] ) );
			$ga   = new XO_Security_Google_Authenticator();
			if ( $ga->verify_code( $key, $code, 2 ) ) {
				return;
			}
			$this->parent->failed_login( $user_login );
		}

		wp_logout();

		if ( ! empty( $_COOKIE[ LOGGED_IN_COOKIE ] ) ) {
			unset( $_COOKIE[ LOGGED_IN_COOKIE ] );
		}

		login_header( 'Authenticator Code Form' );

		if ( array_key_exists( 'google_authenticator_code', $_REQUEST ) ) {
			if ( empty( $code ) ) {
				$errors = __( '<strong>Error:</strong> No authentication code entered.', 'xo-security' );
			} else {
				$errors = __( '<strong>Error:</strong> Authentication code is incorrect.', 'xo-security' );
			}
			wp_admin_notice(
				$errors,
				array(
					'type'           => 'error',
					'id'             => 'login_error',
					'paragraph_wrap' => false,
				)
			);

			add_action( 'login_footer', 'wp_shake_js', 12 );
		}

		$log         = isset( $_REQUEST['log'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['log'] ) ) : '';
		$pwd         = isset( $_REQUEST['pwd'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['pwd'] ) ) : '';
		$captcha     = isset( $_REQUEST['xo_security_captcha'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['xo_security_captcha'] ) ) : null;
		$rememberme  = isset( $_REQUEST['rememberme'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['rememberme'] ) ) : null;
		$redirect_to = isset( $_REQUEST['redirect_to'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['redirect_to'] ) ) : admin_url();

		?>
		<form name="loginform" id="loginform" action="<?php echo esc_url( site_url( 'wp-login.php', 'login_post' ) ); ?>" method="post">
			<?php wp_nonce_field( 'xo_security_authenticator_code_form', 'xo_security_authenticator_nonce' ); ?>
			<input type="hidden" name="log" value="<?php echo esc_attr( $log ); ?>" />
			<input type="hidden" name="pwd" value="<?php echo esc_attr( $pwd ); ?>" />
			<?php if ( $captcha ) : ?>
				<input type="hidden" name="xo_security_captcha" value="<?php echo esc_attr( $captcha ); ?>" />
			<?php endif; ?>
			<?php if ( $rememberme ) : ?>
				<input type="hidden" name="rememberme" id="rememberme" value="<?php echo esc_attr( $rememberme ); ?>" />
			<?php endif; ?>
			<p>
				<label for="google_authenticator_code"><?php esc_html_e( 'Authentication Code', 'xo-security' ); ?></label>
				<input type="text" name="google_authenticator_code" id="google_authenticator_code" class="input" value="" maxlength="6" size="6" required="required" autocomplete="off" spellcheck="false" autofocus />
			</p>
			<p class="submit">
				<input type="submit" name="wp-submit" id="wp-submit" class="button button-primary button-large" value="<?php esc_attr_e( 'Log In' ); ?>" />
				<input type="hidden" name="redirect_to" value="<?php echo esc_attr( $redirect_to ); ?>" />
				<input type="hidden" name="testcookie" value="1" />
			</p>
		</form>
		<?php

		$script =
			'function xo_security_attempt_focus() {
				setTimeout( function() {
					try {
						d = document.getElementById( "google_authenticator_code" );
						d.focus();
					} catch( er ) {}
				}, 200);
			}
			xo_security_attempt_focus();';

		wp_print_inline_script_tag( $script );

		login_footer();

		exit;
	}
}
