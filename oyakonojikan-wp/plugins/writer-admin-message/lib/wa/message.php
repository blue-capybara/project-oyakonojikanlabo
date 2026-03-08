<?php

class WA_Message {
	protected function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
		add_action( 'admin_menu', array( $this, 'register_option_pages' ), 15 );
		add_action( 'admin_init', array( $this, 'redirect_to_message_compose' ) );
		add_action( 'bulk_actions-users', array( $this, 'users_bulk_action' ), 15 );
		add_action( 'wa/get_template_dirs', array( $this, 'register_template_dir' ), 5 );
		add_action( 'wa/get_config_files', array( $this, 'register_config_file' ), 15 );
	}

	public function register_option_pages() {
		add_submenu_page( WA_BASE_FILE, 'メッセージ', 'メッセージ', 'manage_options', 'writer-admin-message/list-message', 'WA::dispatch_plugin_page' );
	}

	public function register_template_dir( $dirs ) {
		$dirs[] = WA_MESSAGE_PATH . 'templates';

		return $dirs;
	}

	public function register_config_file( $configs ) {
		$configs[] = WA_MESSAGE_PATH . 'config.yml';

		return $configs;
	}

	public function admin_enqueue_scripts() {
		wp_enqueue_style( 'wa-message-style', WA_MESSAGE_URL . 'admin/assets/css/style.css' );
		wp_enqueue_script( 'wa-message-common', WA_MESSAGE_URL . 'admin/assets/js/common.js', array( 'wa-select2' ) );
	}

	public function users_bulk_action( $actions ) {
		$actions['message'] = 'メッセージ作成';

		return $actions;
	}

	public function redirect_to_message_compose() {
		global $pagenow;

		if ( $pagenow === 'users.php' ) {
			$action = filter_input( INPUT_GET, 'action' );
			$users  = filter_input( INPUT_GET, 'users', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY );

			if ( $action === 'message' && ! empty( $users ) ) {
				// メッセージ作成アクションを転送する
				wp_redirect( add_query_arg( array( 'to_id' => implode( ',', $users ), 'action' => 'compose', 'page' => 'writer-admin-message/list-message' ), admin_url( 'admin.php' ) ) );
				exit();
			}
		}
	}

	public static function get_instance() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new WA_Message();
		}

		return $instance;
	}

	public static function is_valid( $message_id, $user_id = null ) {
		if ( get_post_type( $message_id ) !== 'wa_message' ) {
			return false;
		}

		$message = get_post( $message_id );

		if ( $user_id && $message->post_author != $user_id ) {
			return false;
		}

		return true;
	}

	public static function to_admin( $message_id ) {
		if ( ! static::is_valid( $message_id ) ) {
			return false;
		}

		return (bool) get_post_meta( $message_id, 'to_admin', true );
	}
}