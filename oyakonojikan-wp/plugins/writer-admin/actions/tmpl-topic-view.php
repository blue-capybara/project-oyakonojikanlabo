<?php
$id = filter_input( INPUT_GET, 'id' );

if ( ! WA_Topic::is_valid( $id ) ) {
	wp_redirect( remove_query_arg( array( 'action', 'id' ) ) );
	exit();
}

$topic = get_post( $id );

return compact( 'topic' );