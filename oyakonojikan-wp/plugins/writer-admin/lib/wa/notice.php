<?php

class WA_Notice {
	protected function __construct() {
		add_action( 'admin_menu', array( $this, 'register_option_pages' ), 15 );
	}

	public function register_option_pages() {
		add_submenu_page( WA_BASE_NAME, '全体通知', '全体通知', 'manage_options', 'writer-admin/notice', 'WA::dispatch_plugin_page' );
	}

	public static function get_instance() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new WA_Notice();
		}

		return $instance;
	}
}