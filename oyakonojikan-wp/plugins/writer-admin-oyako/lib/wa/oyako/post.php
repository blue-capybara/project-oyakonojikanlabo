<?php

class WA_Oyako_Post {
	protected function __construct() {
		add_action( 'init', array( $this, 'add_meta_box' ), 20 );
		add_filter( 'views_edit-post', array( $this, 'register_billed_posts_filter' ), 10, 3 );
		add_filter( 'views_edit-post', array( $this, 'register_payed_posts_filter' ), 10, 3 );
		add_filter( 'display_post_states', array( $this, 'display_post_states' ), 10, 2 );
		add_action( 'pre_get_posts', array( $this, 'query_filter' ), 10 );

		add_filter( 'wa/view/get_post_status', array( $this, 'get_post_status' ), 10, 2 );
		add_filter( 'wa/post/is_not_editable', array( $this, 'is_not_editable' ), 10, 2 );
	}

	public static function add_meta_box() {
		$mbx = new IWF_MetaBox( WA::get_config( 'post_type' ), 'unit_price', '単価設定', array( 'context' => 'side' ) );
		$mbx->component( false )->text( 'wa_unit_price', null, array( 'class' => 'iwf-w80p chknumonly' ) )->html( ' 円' );
	}

	public function query_filter( $the_query ) {
		if ( ! is_admin() ) {
			return;
		}

		$show_billed = filter_input( INPUT_GET, 'wa_show_billed' );

		if ( $show_billed ) {
			$the_query->set( 'post_status', 'any' );
			$the_query->set( 'meta_query', array(
				array(
					'key'   => 'wa_billed',
					'value' => '1'
				)
			) );
		}

		$show_payed = filter_input( INPUT_GET, 'wa_show_payed' );

		if ( $show_payed ) {
			$the_query->set( 'post_status', 'any' );
			$the_query->set( 'meta_query', array(
				array(
					'key'   => 'wa_payed',
					'value' => '1'
				)
			) );
		}
	}

	public function display_post_states( $post_states, $post ) {
		if ( get_post_meta( $post->ID, 'wa_payed', true ) ) {
			$post_states['payed'] = '支払い済み';

		} else if ( get_post_meta( $post->ID, 'wa_billed', true ) ) {
			$post_states['billed'] = '請求済み';
		}

		return $post_states;
	}

	public function register_billed_posts_filter( $views ) {
		$classes = array();

		if ( filter_input( INPUT_GET, 'wa_show_billed' ) ) {
			$classes[] = 'current';
		}

		$count = static::get_billed_post_count();

		if ( $count ) {
			$views[] = '<a href="' . admin_url( 'edit.php?post_type=post&wa_show_billed=1' ) . '" class="' . implode( ' ', $classes ) . '">請求済み <span class="count">(' . $count . ')</span></a>';
		}

		return $views;
	}

	public function register_payed_posts_filter( $views ) {
		$classes = array();

		if ( filter_input( INPUT_GET, 'wa_show_payed' ) ) {
			$classes[] = 'current';
		}

		$count = static::get_payed_post_count();

		if ( $count ) {
			$views[] = '<a href="' . admin_url( 'edit.php?post_type=post&wa_show_payed=1' ) . '" class="' . implode( ' ', $classes ) . '">支払い済み <span class="count">(' . $count . ')</span></a>';
		}

		return $views;
	}

	public static function is_not_editable( $not_editable, $post ) {
		if ( get_post_meta( $post->ID, 'wa_payed', true ) ) {
			return true;
		}

		if ( get_post_meta( $post->ID, 'wa_billed', true ) ) {
			return true;
		}

		return $not_editable;
	}

	public static function get_post_status( $post_status, $post ) {
		if ( get_post_meta( $post->ID, 'wa_payed', true ) ) {
			$post_status = '<span class="label label-success">支払い済み</span>';

		} else if ( get_post_meta( $post->ID, 'wa_billed', true ) ) {
			$post_status = '<span class="label label-success">請求済み</span>';
		}

		return $post_status;
	}

	public static function get_instance() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new WA_Oyako_Post();
		}

		return $instance;
	}


	public static function get_billed_post_count( $user_id = null ) {
		global $wpdb;

		$where = '';

		if ( $user_id ) {
			$where = $wpdb->prepare( " AND post_author = %d", $user_id );
		}

		$sql = <<< EOF
SELECT COUNT( * ) FROM {$wpdb->posts}
INNER JOIN {$wpdb->postmeta} AS mt1 ON mt1.post_id = {$wpdb->posts}.ID AND mt1.meta_key = 'wa_billed'
WHERE post_type = %s AND mt1.meta_value = '1' {$where}
EOF;

		return (int) $wpdb->get_var( $wpdb->prepare( $sql, WA::get_config( 'post_type' ), $user_id ) );
	}

	public static function get_billed_posts( $args = array() ) {
		$args = wp_parse_args( $args );

		$args['post_type']    = WA::get_config( 'post_type' );
		$args['meta_query'][] = array(
			'key'   => 'wa_billed',
			'value' => 1
		);

		return get_posts( $args );
	}

	public static function get_payed_post_count( $user_id = null ) {
		global $wpdb;

		$where = '';

		if ( $user_id ) {
			$where = $wpdb->prepare( " AND post_author = %d", $user_id );
		}

		$sql = <<< EOF
SELECT COUNT( * ) FROM {$wpdb->posts}
INNER JOIN {$wpdb->postmeta} AS mt1 ON mt1.post_id = {$wpdb->posts}.ID AND mt1.meta_key = 'wa_payed'
WHERE post_type = %s AND mt1.meta_value = '1' {$where}
EOF;

		return (int) $wpdb->get_var( $wpdb->prepare( $sql, WA::get_config( 'post_type' ), $user_id ) );
	}

	public static function get_payed_posts( $args = array() ) {
		$args = wp_parse_args( $args );

		$args['post_type']    = WA::get_config( 'post_type' );
		$args['meta_query'][] = array(
			'key'   => 'wa_payed',
			'value' => 1
		);

		return get_posts( $args );
	}

	public static function get_unit_price( $post_id ) {
		if ( ! WA_Post::is_valid( $post_id ) ) {
			return false;
		}

		$post       = get_post( $post_id );
		$unit_price = (int) get_post_meta( $post->ID, 'wa_unit_price', true );

		if ( ! $unit_price ) {
			if ( ! WA_User::is_writer( $post->post_author ) ) {
				return false;
			}

			$unit_price = (int) get_user_meta( $post->post_author, 'wa_unit_price', true );
		}

		return $unit_price;
	}

	public static function get_not_billed_posts( $args ) {
		$args                 = wp_parse_args( $args );
		$args['meta_query'][] = array(
			array(
				'key'     => 'wa_billed',
				'value'   => '1',
				'compare' => '!=',
			),
			array(
				'key'     => 'wa_billed',
				'compare' => 'NOT EXISTS'
			),
			'relation' => 'OR'
		);

		return WA_Post::get_delivered_posts( $args );
	}

	public static function get_delivered_amount( $user_id ) {
		$delivered_posts = WA_Post::get_delivered_posts( array(
			'author'         => $user_id,
			'posts_per_page' => - 1,
		) );

		$total_amount = 0;

		foreach ( $delivered_posts as $delivered_post ) {
			$total_amount += WA_Oyako_Post::get_unit_price( $delivered_post->ID );
		}

		return $total_amount;
	}

	public static function get_not_billed_amount( $user_id ) {
		$delivered_posts = WA_Post::get_delivered_posts( array(
			'author'         => $user_id,
			'posts_per_page' => - 1,
			'meta_query'     => array(
				array(
					'key'     => 'wa_billed',
					'value'   => '1',
					'compare' => '!='
				),
				array(
					'key'     => 'wa_billed',
					'compare' => 'NOT EXISTS'
				),
				'relation' => 'OR'
			)
		) );

		$total_amount = 0;

		foreach ( $delivered_posts as $delivered_post ) {
			$total_amount += WA_Oyako_Post::get_unit_price( $delivered_post->ID );
		}

		return $total_amount;
	}
}