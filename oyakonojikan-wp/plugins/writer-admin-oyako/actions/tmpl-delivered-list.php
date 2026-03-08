<?php
if ( filter_input( INPUT_GET, 'do_billing' ) ) {
	$not_billed_amount = (int) WA_Oyako_Post::get_not_billed_amount( get_current_user_id() );
	$min_billed_amount = (int) get_user_meta( get_current_user_id(), 'wa_min_billed_amount', true );

	if ( $min_billed_amount <= 0 || $not_billed_amount < $min_billed_amount ) {
		wp_redirect( remove_query_arg( array( 'do_billing' ), add_query_arg( 'error', 1 ) ) );
		exit();
	}

	$invoice_data = array(
		'post_type'   => 'wa_invoice',
		'post_status' => 'publish',
		'post_title'  => date( 'Y年m月d日', current_time( 'timestamp' ) ),
		'post_author' => get_current_user_id()
	);

	$invoice_id = wp_insert_post( $invoice_data );

	if ( is_wp_error( $invoice_id ) ) {
		wp_redirect( remove_query_arg( array( 'do_billing' ), add_query_arg( 'error', 1 ) ) );
		exit();
	}

	$not_billed_posts = WA_Oyako_Post::get_not_billed_posts( array(
		'author'         => get_current_user_id(),
		'posts_per_page' => - 1
	) );

	update_post_meta( $invoice_id, 'billed_amount', $not_billed_amount );

	$billed_posts = array();

	foreach ( $not_billed_posts as $not_billed_post ) {
		update_post_meta( $not_billed_post->ID, 'wa_billed', 1 );

		$billed_posts[] = array(
			'id'     => $not_billed_post->ID,
			'title'  => get_the_title( $not_billed_post ),
			'amount' => WA_Oyako_Post::get_unit_price( $not_billed_post->ID )
		);
	}

	update_post_meta( $invoice_id, 'billed_posts', $billed_posts );

	wp_redirect( remove_query_arg( array( 'do_billing', 'error' ), add_query_arg( 'saved', 1, WA_View::get_link( 'invoice_list' ) ) ) );
	exit();
}