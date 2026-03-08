<?php
if ( iwf_request_is( 'post' ) && filter_input( INPUT_POST, '_email' ) ) {
	$user = get_user_by( 'email', filter_input( INPUT_POST, '_email' ) );

	if ( $user && WA_User::is_writer( $user->ID ) ) {
		$user_login = $user->user_login;
		$user_email = $user->user_email;
		$key        = get_password_reset_key( $user );

		$from      = apply_filters( 'wa/password_forget/mail_from_address', WA::get_config( 'mail.password_forget.from_address' ) ?: get_option( 'admin_email' ) );
		$from_name = apply_filters( 'wa/password_forget/mail_from_name', WA::get_config( 'mail.password_forget.from_name' ) ?: get_bloginfo( 'name' ) );
		$subject   = apply_filters( 'wa/password_forget/mail_subject', WA::get_config( 'mail.password_forget.subject' ) ?: 'パスワードのリセットがリクエストされました' );

		$mail_template_file = WA::get_template( WA::get_config( 'mail.password_forget.file' ), 'email/' );
		$mail_template      = file_exists( $mail_template_file ) ? file_get_contents( $mail_template_file ) : '';
		$mail_template      = apply_filters( 'wa/password_forget/mail_template', $mail_template );

		$reset_url = add_query_arg( array( 'a' => $key, 'u' => rawurlencode( $user_login ) ), WA_View::get_link( 'password_reset' ) );
		$user_name = WA_User::get_name( $user->ID );

		$vars = array(
			'name'  => $user_name,
			'email' => $user_email,
			'url'   => $reset_url,
		);

		WA::mail( $mail_template, $user_email, $subject, $from, $from_name, $vars );
	}

	wp_redirect( add_query_arg( array( 'completed' => 1 ) ) );
	exit();
}