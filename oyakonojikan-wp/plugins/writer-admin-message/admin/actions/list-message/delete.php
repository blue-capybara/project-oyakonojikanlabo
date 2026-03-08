<?php
$id = filter_input( INPUT_GET, 'id' );
check_admin_referer( 'delete' . $id );

if ( ! WA_Message::is_valid( $id ) ) {
	wp_redirect( remove_query_arg( array( 'action', 'id', '_wpnonce' ) ) );
	exit();
}

$message = get_post( $id );
$tree_id = get_post_meta( $message->ID, 'tree_id', true );

if ( $tree_id ) {
	$message_tree = get_posts( array(
		'post_type'      => 'wa_message',
		'posts_per_page' => - 1,
		'meta_query'     => array(
			array(
				'key'   => 'tree_id',
				'value' => $tree_id
			)
		)
	) );

	foreach ( $message_tree as $message_node ) {
		wp_delete_post( $message_node->ID, true );
	}

} else {
	wp_delete_post( $message->ID, true );
}

wp_redirect( add_query_arg( 'deleted', 1, remove_query_arg( array( 'action', 'id', '_wpnonce' ) ) ) );
exit();