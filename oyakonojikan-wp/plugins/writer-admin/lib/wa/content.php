<?php

class WA_Content {
	protected $contents = array();

	protected function __construct() {
		add_action( 'wa/init', array( $this, 'parse_contents' ) );
	}

	public function parse_contents() {
		$content_blocks = WA::get_config( 'content_blocks' );

		foreach ( $content_blocks as $content_block ) {
			$content_block = static::convert_filename( $content_block );
			$class         = static::factory( $content_block );

			if ( $class ) {
				$this->contents[ $content_block ] = $class;
			}
		}
	}

	public static function get_instance() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new WA_Content();
		}

		return $instance;
	}

	public static function get_field_key( $prefix = false ) {
		return ( $prefix ? WA::get_config( 'form.field_prefix' ) : '' ) . WA::get_config( 'form.fields.contents' );
	}

	public static function get_contents_file_array() {
		$key        = static::get_field_key( true );
		$file_array = array();

		if ( isset( $_FILES[ $key ] ) && is_array( $_FILES[ $key ] ) ) {
			foreach ( $_FILES[ $key ] as $file_key => $data_1 ) {
				foreach ( $data_1 as $j => $data_2 ) {
					foreach ( $data_2 as $key_1 => $data_3 ) {
						foreach ( $data_3 as $key_2 => $file_value ) {
							$file_array[ $j ][ $key_1 ][ $key_2 ][ $file_key ] = $file_value;
						}
					}
				}
			}
		}

		return $file_array;
	}

	public static function get_contents_dropdown( $name = '', $args = array() ) {
		$dropdown_list = array();
		$args          = wp_parse_args( $args, array( 'empty' => '--' ) );

		foreach ( static::get_instance()->contents as $slug => $content ) {
			$dropdown_list[ $content->get_name() ] = $slug;
		}

		return IWF_Form::select( $name, $dropdown_list, $args );
	}

	public static function get_contents_templates() {
		$html = '';

		foreach ( static::get_instance()->contents as $slug => $content ) {
			$html .= $content->get_template();
		}

		return $html;
	}

	public static function convert_classname( $filename ) {
		$filename    = pathinfo( $filename, PATHINFO_FILENAME );
		$name_chunks = explode( '_', str_replace( '-', '_', strtolower( $filename ) ) );

		return 'WA_Content_' . implode( '_', array_map( 'ucfirst', array_filter( $name_chunks ) ) );
	}

	public static function convert_filename( $classname ) {
		$name = str_replace( '-', '_', strtolower( $classname ) );
		$name = preg_replace( '|^wa_content_|', '', $name );
		$name = implode( '-', array_filter( explode( '_', $name ) ) );

		return pathinfo( $name, PATHINFO_FILENAME );
	}

	public static function factory( $filename ) {
		$class_name = static::convert_classname( $filename );

		if ( ! class_exists( $class_name ) ) {
			static::import( $filename );
		}

		if ( ! class_exists( $class_name ) ) {
			return false;
		}

		return call_user_func( array( $class_name, 'get_instance' ) );
	}

	protected static function import( $filename ) {
		$filename = static::convert_filename( $filename );

		$dirs = array( WA_PATH . 'lib/wa/content/' );
		$dirs = apply_filters( 'wa/content/parse_content_blocks/dirs', $dirs );

		foreach ( $dirs as $dir ) {
			$file_path = trailingslashit( $dir ) . $filename . '.php';

			if ( file_exists( $file_path ) ) {
				include_once $file_path;

				return true;
			}
		}

		return false;
	}

	public static function prepare_data( $contents ) {
		if ( ! is_array( $contents ) ) {
			return false;
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';

		$file_array = static::get_contents_file_array();

		foreach ( $contents as $i => $value ) {
			$class = WA_Content::factory( $value['type'] );

			if ( $class ) {
				$class->prepare( $contents[ $i ], isset( $file_array[ $i ] ) ? $file_array[ $i ] : array() );
			}
		}

		return apply_filters( 'wa/post/prepare_contents/validated_contents', $contents );
	}

	public static function convert_to_post_content( $contents ) {
		$post_contents = array();

		foreach ( $contents as $content ) {
			$class = WA_Content::factory( $content['type'] );

			if ( $class ) {
				$post_content = trim( $class->get_html( $content ) );

				if ( $post_content ) {
					$post_contents[] = $post_content;
				}
			}
		}

		return implode( "\n", $post_contents );
	}
}