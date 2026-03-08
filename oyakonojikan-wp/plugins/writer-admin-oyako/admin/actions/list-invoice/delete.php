<?php
$id = filter_input( INPUT_GET, 'id' );
check_admin_referer( 'delete' . $id );

if ( ! WA_Oyako_Invoice::is_valid( $id ) ) {
	wp_redirect( remove_query_arg( array( 'action', 'id', '_wpnonce' ) ) );
	exit();
}

wp_delete_post( $id, true );

wp_redirect( add_query_arg( 'updated', 'delete', remove_query_arg( array( 'action', 'id', '_wpnonce' ) ) ) );
exit();