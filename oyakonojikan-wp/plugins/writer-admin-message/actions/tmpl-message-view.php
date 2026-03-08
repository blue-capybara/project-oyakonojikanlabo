<?php
$id = filter_input( INPUT_GET, 'id' );

if ( ! WA_Message::is_valid( $id ) ) {
	wp_redirect( remove_query_arg( array( 'action', 'id' ) ) );
	exit();
}

$message = get_post( $id );
$tree_id = get_post_meta( $message->ID, 'tree_id', true );

$messages = get_posts( array(
	'post_type'      => 'wa_message',
	'posts_per_page' => - 1,
	'author'         => get_current_user_id(),
	'meta_query'     => array(
		array(
			'key'   => 'tree_id',
			'value' => $tree_id
		)
	),
	'orderby'        => array( 'date' => 'DESC' )
) );

foreach ( $messages as $message ) {
	update_post_meta( $message->ID, 'user_read', 1 );
}

return compact( 'messages', 'tree_id' );