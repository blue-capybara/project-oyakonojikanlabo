<?php

class WA_Topic {
	protected function __construct() {
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_action( 'parent_file', array( $this, 'highlight_parent_menu' ), 10 );
		add_action( 'admin_menu', array( $this, 'fix_menu_position' ), 100 );
		add_action( 'save_post_wa_topic', array( $this, 'send_notice_mail' ), 10, 3 );
	}

	public function register_post_type() {
		register_post_type( 'wa_topic', array(
			'label'             => 'お知らせ',
			'labels'            => array(
				'menu_name' => 'お知らせ'
			),
			'public'            => true,
			'has_archive'       => false,
			'show_in_menu'      => WA_BASE_NAME,
			'show_in_nav_menus' => false,
		) );
	}

	public function highlight_parent_menu( $parent_file ) {
		if ( get_current_screen()->post_type === 'wa_topic' ) {
			$parent_file = WA_BASE_NAME;
		}

		return $parent_file;
	}

	public function fix_menu_position() {
		global $submenu;

		$tmp_menus = array();

		foreach ( $submenu[ WA_BASE_NAME ] as $i => $submenu_args ) {
			if ( $submenu_args[2] === 'edit.php?post_type=wa_topic' ) {
				$tmp_menus[45] = $submenu_args;

			} else {
				$tmp_menus[ $i * 10 ] = $submenu_args;
			}
		}

		ksort( $tmp_menus );

		$submenu[ WA_BASE_NAME ] = array_values( $tmp_menus );
	}

	public function send_notice_mail( $post_id, $post, $update ) {
		if ( $post->post_status !== 'publish' ) {
			return;
		}

		$writers = get_users( array(
			'role' => WA::get_config( 'role.slug' ),
		) );

		foreach ( $writers as $writer ) {
			$vars = array(
				'date' => date( 'Y年n月j日 H:i:s', current_time( 'timestamp' ) ),
				'name' => WA_User::get_name( $writer->ID ),
				'url'  => add_query_arg( array( 'id' => $post_id ), WA_View::get_link( 'topic_view' ) )
			);

			WA::template_mail( $writer->user_email, $vars, 'new_notice' );
		}
	}

	public static function get_instance() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new WA_Topic();
		}

		return $instance;
	}

	public static function is_valid( $post_id ) {
		if ( get_post_type( $post_id ) !== 'wa_topic' ) {
			return false;
		}

		return true;
	}
}