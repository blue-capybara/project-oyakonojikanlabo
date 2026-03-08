<?php

abstract class WA_Content_Abstract {
	protected $name = '';
	protected $slug = '';

	protected function __construct() {
	}

	public function get_name() {
		return $this->name;
	}

	public function get_slug() {
		return $this->slug;
	}

	abstract public function prepare( array &$contents, array $file_array );

	abstract public function get_html( array $contents );

	abstract public function get_template();

	public static function get_instance() {
		static $instance;

		if ( ! $instance ) {
			$class_name = get_called_class();
			$instance   = new $class_name;
		}

		return $instance;
	}
}