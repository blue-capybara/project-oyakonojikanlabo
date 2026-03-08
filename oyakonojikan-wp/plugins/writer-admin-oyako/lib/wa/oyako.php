<?php

class WA_Oyako {
	protected function __construct() {
		add_action( 'wa/get_template_dirs', array( $this, 'register_template_dir' ), 5 );
		add_action( 'wa/get_config_files', array( $this, 'register_config_file' ), 15 );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
	}

	public function register_template_dir( $dirs ) {
		$dirs[] = WA_OYAKO_PATH . 'templates';

		return $dirs;
	}

	public function register_config_file( $configs ) {
		$configs[] = WA_OYAKO_PATH . 'config.yml';

		return $configs;
	}

	public static function get_instance() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new WA_Oyako();
		}

		return $instance;
	}

	public function admin_enqueue_scripts() {
		wp_enqueue_style( 'wa-oyako-style', WA_OYAKO_URL . 'admin/assets/css/style.css' );
	}
}