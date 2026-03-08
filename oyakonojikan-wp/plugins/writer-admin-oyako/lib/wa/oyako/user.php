<?php

class WA_Oyako_User {
	protected function __construct() {
		add_action( 'init', array( $this, 'add_user_profile' ), 20 );
	}

	public function add_user_profile() {
		$pup = new IWF_Profile_UserProfile( '単価設定', array(
			'role' => WA::get_config( 'role.slug' )
		) );

		$com = $pup->component( '単価' );

		$com->text( 'wa_unit_price', null, array( 'class' => 'iwf-w20p chknumonly' ) )->html( ' 円' );

		$com = $pup->component( '請求可能最低金額' );

		$com->text( 'wa_min_billed_amount', null, array( 'class' => 'iwf-w20p chknumonly' ) )->html( ' 円' );
	}

	public static function get_instance() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new WA_Oyako_User();
		}

		return $instance;
	}

	public static function get_payed_amount( $user_id ) {
		if ( ! WA_User::is_writer( $user_id ) ) {
			return 0;
		}

		return (int) get_user_meta( $user_id, 'wa_payed_amount', true );
	}
}