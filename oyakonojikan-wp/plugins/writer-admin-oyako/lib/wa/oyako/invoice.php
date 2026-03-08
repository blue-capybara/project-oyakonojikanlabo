<?php

class WA_Oyako_Invoice {
	protected function __construct() {
		add_action( 'admin_menu', array( $this, 'register_option_pages' ), 15 );
		add_action( 'init', array( $this, 'admin_batch' ) );
	}

	public function admin_batch() {
		if ( is_super_admin() ) {
			if ( filter_input( INPUT_GET, 'invoice_bundle' ) ) {
				$invoices = get_posts( array(
					'post_type'      => 'wa_invoice',
					'posts_per_page' => - 1,
					'meta_query'     => array(
						array(
							'key'     => 'wa_payed',
							'value'   => 1,
							'compare' => '!='
						),
						array(
							'key'     => 'wa_payed',
							'compare' => 'NOT EXISTS'
						),
						'relation' => 'OR'
					)
				) );

				$user_per_invoices = array();

				foreach ( $invoices as $invoice ) {
					$user_per_invoices[ $invoice->post_author ][ mktime( 0, 0, 0, get_the_time( 'n', $invoice ) + 1, 0, get_the_time( 'Y', $invoice ) ) ][] = $invoice;
				}

				$remove_ids = array();

				foreach ( $user_per_invoices as $user_id => $date_per_invoices ) {
					$date_per_billed_posts = array();
					$billed_amount         = 0;

					foreach ( $date_per_invoices as $date => $invoices ) {
						if ( count( $invoices ) <= 1 ) {
							continue;
						}

						foreach ( $invoices as $invoice ) {
							$remove_ids[] = $invoice->ID;

							$billed_posts = get_post_meta( $invoice->ID, 'billed_posts', true );

							if ( $billed_posts ) {
								$date_per_billed_posts[] = $billed_posts;

								foreach ( $billed_posts as $billed_post ) {
									$billed_amount += $billed_post['amount'];
								}
							}
						}

						$user_per_billed_posts = $date_per_billed_posts ? call_user_func_array( 'array_merge', $date_per_billed_posts ) : array();

						if ( $user_per_billed_posts ) {
							$invoice_data = array(
								'post_type'   => 'wa_invoice',
								'post_status' => 'publish',
								'post_title'  => date( 'Y年m月d日', $date ),
								'post_author' => $user_id,
								'post_date'   => date( 'Y-m-d H:i:s', $date )
							);

							$invoice_id = wp_insert_post( $invoice_data );

							if ( is_wp_error( $invoice_id ) ) {
								continue;
							}

							update_post_meta( $invoice_id, 'billed_amount', $billed_amount );
							update_post_meta( $invoice_id, 'billed_posts', $user_per_billed_posts );
						}

						if ( $remove_ids ) {
							foreach ( $remove_ids as $remove_id ) {
								wp_delete_post( $remove_id, true );
							}
						}
					}

				}

			}
		}
	}

	public function register_option_pages() {
		add_submenu_page( WA_BASE_FILE, '請求書', '請求書', 'manage_options', 'writer-admin-oyako/list-invoice', 'WA::dispatch_plugin_page' );
	}

	public static function get_instance() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new WA_Oyako_Invoice();
		}

		return $instance;
	}

	public static function is_valid( $invoice_id, $user_id = null ) {
		if ( get_post_type( $invoice_id ) !== 'wa_invoice' ) {
			return false;
		}

		$invoice = get_post( $invoice_id );

		if ( $user_id && $invoice->post_author != $user_id ) {
			return false;
		}

		return true;
	}
}