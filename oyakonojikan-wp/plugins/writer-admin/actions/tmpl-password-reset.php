<?php
$key   = iwf_get_array( $_REQUEST, 'a' );
$login = iwf_get_array( $_REQUEST, 'u' );

$val = IWF_Validation::instance( 'reset_password', array(
	'form_field_prefix' => '_',
	'error_open'        => '<span class="has-error"><span class="help-block"><i class="fa fa-exclamation-triangle"></i> ',
	'error_close'       => '</span></span>'
) );

$val->add_field( 'password', 'パスワード', 'password' )
    ->add_rule( 'not_empty' )
    ->add_rule( 'min_length', 8 )
    ->add_rule( 'valid_string', 'alpha_numeric' )->set_message( '%label%は半角英数字のみで構成してください。' );

$val->add_field( 'password_confirm', 'パスワードの確認', 'password' )
    ->add_rule( 'not_empty' )
    ->add_rule( 'match_value', '%password%' )->set_message( 'パスワードの確認が一致しません。' );

if ( iwf_request_is( 'post' ) ) {
	$user = check_password_reset_key( $key, $login );

	if ( is_wp_error( $user ) ) {
		die( 'Error' );
	}

	$val->run( $_POST );

	if ( $val->is_valid() ) {
		wp_set_password( $val->validated( 'password' ), $user->ID );

		$from      = apply_filters( 'wa/password_reset/mail_from_address', WA::get_config( 'mail.password_reset.from_address' ) ?: get_option( 'admin_email' ) );
		$from_name = apply_filters( 'wa/password_reset/mail_from_name', WA::get_config( 'mail.password_reset.from_name' ) ?: get_bloginfo( 'name' ) );
		$subject   = apply_filters( 'wa/password_reset/mail_subject', WA::get_config( 'mail.password_reset.subject' ) ?: 'パスワードがリセットされました' );

		$mail_template_file = WA::get_template( WA::get_config( 'mail.password_reset.file' ), 'email/' );
		$mail_template      = file_exists( $mail_template_file ) ? file_get_contents( $mail_template_file ) : '';
		$mail_template      = apply_filters( 'wa/password_reset/mail_template', $mail_template );

		$vars = array(
			'name'  => WA_User::get_name( $user->ID ),
			'email' => $user->user_email,
		);

		WA::mail( $mail_template, $user->user_email, $subject, $from, $from_name, $vars );

		wp_redirect( add_query_arg( array( 'completed' => 1 ) ) );
		exit();
	}

} else {
	if ( filter_input( INPUT_GET, 'completed' ) ) {
		include dirname( $template ) . '/tmpl-password-reset-complete.php';
		die();
	}

	$user = check_password_reset_key( $key, $login );

	if ( is_wp_error( $user ) ) {
		die( 'Error' );
	}
}

return compact( 'val' );