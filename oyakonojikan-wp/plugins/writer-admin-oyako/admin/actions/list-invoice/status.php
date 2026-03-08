<?php
$id = filter_input( INPUT_GET, 'id' );
check_admin_referer( 'status' . $id );

if ( ! WA_Oyako_Invoice::is_valid( $id ) ) {
	wp_redirect( remove_query_arg( array( 'action', 'id', '_wpnonce' ) ) );
	exit();
}

$post = get_post( $id );

$status = (bool) get_post_meta( $post->ID, 'wa_payed', true );
update_post_meta( $post->ID, 'wa_payed', ! $status );

wp_redirect( add_query_arg( 'updated', 'status', remove_query_arg( array( 'action', 'id', '_wpnonce' ) ) ) );
exit();