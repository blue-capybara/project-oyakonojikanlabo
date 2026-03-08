<?php
$id = filter_input( INPUT_GET, 'id' );

if ( ! WA_Oyako_Invoice::is_valid( $id ) ) {
	wp_redirect( remove_query_arg( array( 'action', 'id' ) ) );
	exit();
}

$invoice       = get_post( $id );
$billed_amount = (int) get_post_meta( $id, 'billed_amount', true );
$billed_posts  = get_post_meta( $id, 'billed_posts', true );

return compact( 'invoice', 'billed_amount', 'billed_posts' );