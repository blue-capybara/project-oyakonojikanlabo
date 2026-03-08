<?php
if ( WA_User::is_logged_in() ) {
	wp_redirect( WA_View::get_link( 'dashboard' ) );
	exit();
}

$val = IWF_Validation::instance( 'wa_login', array(
	'form_field_prefix' => '_',
	'error_open'        => '<span class="has-error"><span class="help-block"><i class="fa fa-exclamation-triangle"></i> ',
	'error_close'       => '</span></span>'
) );

$val->add_field( 'user_login', 'ログインID' );
$val->add_field( 'user_pass', 'パスワード' );
$val->add_field( 'remember', '次回から自動でログインする', 'checkbox', 1 );

if ( iwf_request_is( 'post' ) ) {
	$val->run( $_POST );

	if ( $val->is_valid() ) {
		$user = wp_signon( array(
			'user_login'    => $val->validated( 'user_login' ),
			'user_password' => $val->validated( 'user_pass' ),
			'remember'      => $val->validated( 'remember' )
		) );

		if ( $user && ! is_wp_error( $user ) ) {
			if ( ! WA_User::is_writer( $user->ID ) ) {
				wp_logout();

			} else {
				wp_redirect( WA_View::get_link( 'dashboard' ) );
				exit();
			}
		}

		$val->set_error( 'user_login', 'ログインに失敗しました。' );
	}
}

return compact( 'val' );