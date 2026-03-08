<?php
$val = IWF_Validation::instance( 'wa_notice', array(
	'form_field_prefix' => WA::get_config( 'form.field_prefix' ),
	'error_open'        => '<span class="has-error"><span class="help-block"><i class="fa fa-exclamation-triangle"></i> ',
	'error_close'       => '</span></span>'
) );

$val->add_field( 'notice', '通知テキスト' );

$val->add_field( 'notice_color', '通知エリア色', 'select', array(
	'赤'    => 'danger',
	'水色'   => 'info',
	'オレンジ' => 'warning',
	'緑'    => 'success',
), array( 'empty' => '--' ) );

$val->set_data( array(
	'notice'       => WA::get_option( 'notice' ),
	'notice_color' => WA::get_option( 'notice_color' ),
) );

if ( iwf_request_is( 'post' ) ) {
	if ( $val->run( $_POST ) ) {
		WA::set_option( 'notice', trim( $val->validated( 'notice' ) ) );
		WA::set_option( 'notice_color', trim( $val->validated( 'notice_color' ) ) );

		wp_redirect( add_query_arg( array( 'updated' => 1 ) ) );
		exit();
	}
}

if ( filter_input( INPUT_GET, 'updated' ) ) {
	add_settings_error( 'updated', 'updated', '更新しました。', 'updated' );
}

return compact( 'val' );