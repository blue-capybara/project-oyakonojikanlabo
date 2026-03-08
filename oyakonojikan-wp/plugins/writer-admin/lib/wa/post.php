<?php

class WA_Post {
	protected function __construct() {
		add_action( 'transition_post_status', array( $this, 'set_remand_status' ), 10, 3 );
		add_filter( 'views_edit-post', array( $this, 'register_posts_filter' ), 10, 3 );
		add_filter( 'display_post_states', array( $this, 'display_post_states' ), 10, 2 );
		add_action( 'pre_get_posts', array( $this, 'query_filter' ), 10 );

		add_filter( 'wa/post_edit/default_data', array( $this, 'get_content_from_post_meta' ), 10, 2 );
		add_action( 'wa/post_edit/after_save', array( $this, 'save_content_to_post_meta' ), 10, 3 );
		add_action( 'wa/post_edit/after_save', array( $this, 'convert_content_to_post_content' ), 20, 3 );
	}

	public function query_filter( $the_query ) {
		if ( ! is_admin() ) {
			return;
		}

		$show_remand = filter_input( INPUT_GET, 'wa_show_remand' );

		if ( $show_remand ) {
			$the_query->set( 'post_status', 'any' );
			$the_query->set( 'meta_query', array(
				array(
					'key'   => 'wa_remand',
					'value' => '1'
				)
			) );
		}
	}

	public function display_post_states( $post_states, $post ) {
		if ( isset( $post_states['pending'] ) ) {
			$post_states['pending'] = '納品確認待ち';
		}

		if ( get_post_meta( $post->ID, 'wa_remand', true ) ) {
			$post_states['wa_remand'] = '記事修正待ち';
		}

		return $post_states;
	}

	public function register_posts_filter( $views ) {
		foreach ( $views as $i => $view ) {
			$views[ $i ] = str_replace( '保留中', '納品確認待ち', $view );
		}

		$classes = array();

		if ( filter_input( INPUT_GET, 'wa_show_remand' ) ) {
			$classes[] = 'current';
		}

		global $wpdb;

		$remand_count = $wpdb->get_var( $wpdb->prepare( <<< EOF
SELECT COUNT( * )
FROM {$wpdb->posts}
INNER JOIN {$wpdb->postmeta} AS mt1 ON mt1.post_id = {$wpdb->posts}.ID AND mt1.meta_key = 'wa_remand'
WHERE post_type = %s AND mt1.meta_value = '1'
EOF
			, WA::get_config( 'post_type' ) ) );

		if ( $remand_count ) {
			$views[] = '<a href="' . admin_url( 'edit.php?post_type=post&wa_show_remand=1' ) . '" class="' . implode( ' ', $classes ) . '">記事修正待ち <span class="count">(' . $remand_count . ')</span></a>';
		}

		return $views;
	}

	public function set_remand_status( $new_status, $old_status, $post ) {
		if ( $old_status === 'pending' && $new_status === 'draft' ) {
			update_post_meta( $post->ID, 'wa_remand', 1 );

			$post_author = get_userdata( $post->post_author );

			if ( WA_User::is_writer( $post_author->ID ) ) {
				$vars = array(
					'name'  => WA_User::get_name( $post_author->ID ),
					'title' => get_the_title( $post ),
					'url'   => add_query_arg( array( 'id' => $post->ID ), WA_View::get_link( 'post_edit' ) )
				);

				WA::template_mail( $post_author->user_email, $vars, 'to_remand' );
			}

		} else if ( $new_status === 'pending' && $old_status === 'draft' ) {
			update_post_meta( $post->ID, 'wa_remand', 0 );
		}
	}

	public function get_content_from_post_meta( $default_data, $post ) {
		$default_data[ WA_Content::get_field_key() ] = get_post_meta( $post->ID, WA_Content::get_field_key(), true );

		return $default_data;
	}

	public function save_content_to_post_meta( $post_id, $post, $val ) {
		update_post_meta( $post_id, WA_Content::get_field_key(), $val->validated( WA_Content::get_field_key() ) );
	}

	public function convert_content_to_post_content( $post_id, $post, $val ) {
		$post_content = WA_Content::convert_to_post_content( $val->validated( WA_Content::get_field_key() ) );

		if ( $post_content ) {
			$post_data                 = (array) $post;
			$post_data['post_content'] = $post_content;

			wp_update_post( $post_data );
		}
	}

	public static function get_instance() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new WA_Post();
		}

		return $instance;
	}

	public static function is_valid( $post_id ) {
		if ( get_post_type( $post_id ) !== WA::get_config( 'post_type' ) ) {
			return false;
		}

		return true;
	}

	public static function check_post_author( $post_id, $user_id ) {
		if ( get_post_type( $post_id ) != WA::get_config( 'post_type' ) ) {
			return false;
		}

		$post = get_post( $post_id );

		return $post->post_author == $user_id;
	}

	public static function upload_file( $file_array, $validate_args = array() ) {
		$file_array = wp_parse_args( $file_array, array(
			'name'     => '',
			'tmp_name' => '',
			'size'     => 0,
			'error'    => UPLOAD_ERR_NO_FILE
		) );

		$validate_args = (array) apply_filters( 'wa/post/upload_file/validate_args', wp_parse_args( $validate_args, array(
			'max_file_size' => 2097152, // 2MB
			'allowed_types' => array( 'jpg', 'gif', 'png' )
		) ), $file_array );

		if ( ! empty( $file_array['tmp_name'] ) ) {
			if ( $file_array['size'] > $validate_args['max_file_size'] ) {
				return new WP_Error( 'file_size_over', 'ファイルは [' . WA::format_file_size( $validate_args['max_file_size'] ) . '] 以内で登録してください。' );
			}

			include_once ABSPATH . 'wp-admin/includes/file.php';
			$file_data = wp_handle_upload( $file_array, array( 'test_form' => false ) );

			if ( ! empty( $file_data['error'] ) ) {
				return new WP_Error( 'file_upload_error', 'アップロードに失敗しました。' );
			}

			if ( ! static::check_allowed_types( $file_data['file'], $validate_args['allowed_types'] ) ) {
				return new WP_Error( 'file_invalid_types', 'ファイルは [' . implode( '] [', WA::get_config( 'form.image_types' ) ) . '] の何れかでアップロードしてください。' );
			}

			return $file_data;
		}

		return new WP_Error( 'file_empty', 'ファイルがアップロードされていません。' );
	}

	public static function insert_attachment( $file_path, $file_url = '' ) {
		$file_type = wp_check_filetype( $file_path );

		$attachment_id = wp_insert_attachment( array(
			'post_mime_type' => $file_type['type'],
			'guid'           => $file_url,
		), $file_path );

		if ( is_wp_error( $attachment_id ) ) {
			return $attachment_id;
		}

		require_once ABSPATH . 'wp-admin/includes/image.php';

		$attach_data = wp_generate_attachment_metadata( $attachment_id, $file_path );

		wp_update_attachment_metadata( $attachment_id, $attach_data );

		return $attachment_id;
	}

	public static function check_allowed_types( $file_name, $allowed_types = array() ) {
		$allowed_types = (array) apply_filters( 'wa/post/check_allowed_types/allowed_types', $allowed_types, $file_name );
		$file_type     = wp_check_filetype( $file_name );

		if ( ! in_array( $file_type['ext'], $allowed_types ) ) {
			return false;
		}

		return true;
	}

	public static function validate_contents( $contents ) {
		if ( ! is_array( $contents ) ) {
			return false;
		}

		foreach ( $contents as $i => $value ) {
			if ( ! empty( $value['error'] ) ) {
				return false;
			}
		}

		return true;
	}

	public static function get_delivered_posts( $args ) {
		$args = wp_parse_args( $args );

		$args['post_type']   = WA::get_config( 'post_type' );
		$args['post_status'] = static::get_delivered_status();

		return get_posts( $args );
	}

	public static function get_delivered_post_count( $user_id = null ) {
		global $wpdb;

		$where = ' AND post_status IN ("' . implode( '", "', static::get_delivered_status() ) . '")';

		if ( $user_id ) {
			$where .= $wpdb->prepare( " AND post_author = %d", $user_id );
		}

		$sql = <<< EOF
SELECT COUNT( * ) FROM {$wpdb->posts}
WHERE post_type = %s {$where}
EOF;

		return (int) $wpdb->get_var( $wpdb->prepare( $sql, WA::get_config( 'post_type' ) ) );
	}

	public static function is_not_editable( $post ) {
		$post = get_post( $post );

		if ( ! $post ) {
			return false;
		}

		$not_editable = in_array( $post->post_status, array( 'publish', 'private', 'future', 'pending' ) );

		return apply_filters( 'wa/post/is_not_editable', $not_editable, $post );
	}

	public static function is_delivered( $post ) {
		$post = get_post( $post );

		if ( ! $post ) {
			return false;
		}

		$delivered = in_array( $post->ID, static::get_delivered_status() );

		return apply_filters( 'wa/post/is_delivered', $delivered, $post );
	}

	public static function get_delivered_status() {
		$status = array( 'publish', 'private', 'future' );

		return apply_filters( 'wa/post/get_delivered_status', $status );
	}
}