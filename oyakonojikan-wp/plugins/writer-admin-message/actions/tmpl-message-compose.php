<?php
IWF_Token::initialize();

$id      = filter_input( INPUT_GET, 'id' );
$tree_id = filter_input( INPUT_GET, 'tree_id' );

if ( $id ) {
	if ( ! WA_Message::is_valid( $id ) && WA_Message::to_admin( $id ) ) {
		wp_redirect( remove_query_arg( array( 'action', 'id' ) ) );
		exit();
	}

	$reply_message = get_post( $id );

} else {
	$reply_message = null;
}

if ( $tree_id ) {
	if ( ! WA_Message::is_valid( $tree_id ) ) {
		wp_redirect( remove_query_arg( array( 'action', 'id' ) ) );
		exit();
	}

	$root_message = get_post( $tree_id );

} else {
	$root_message = null;
}

$val = IWF_Validation::instance( 'wa_message', array(
	'form_field_prefix' => WA::get_config( 'form.field_prefix' ),
	'error_open'        => '<span class="has-error"><span class="help-block"><i class="fa fa-exclamation-triangle"></i> ',
	'error_close'       => '</span></span>'
) );

$val->add_field( 'title', '件名' )
    ->add_rule( 'not_empty' );

$val->add_field( 'content', '本文' )
    ->add_rule( 'not_empty' );

if ( $reply_message ) {
	$val->set_data( 'user', $reply_message->post_author );
	$val->set_data( 'title', wp_strip_all_tags( get_the_title( $reply_message ) ) );

	$tree_id = get_post_meta( $reply_message->ID, 'tree_id', true );

} else if ( $root_message ) {
	$val->set_data( 'user', $root_message->post_author );
	$val->set_data( 'title', wp_strip_all_tags( get_the_title( $root_message ) ) );

	$tree_id = $root_message->ID;
}

if ( iwf_request_is( 'post' ) && IWF_Token::verify_request( 'wa_message_compose', null, false ) ) {
	if ( $val->run( $_POST ) ) {
		$post_data = array(
			'post_type'    => 'wa_message',
			'post_title'   => trim( wp_strip_all_tags( $val->validated( 'title' ) ) ),
			'post_author'  => get_current_user_id(),
			'post_content' => trim( wp_strip_all_tags( $val->validated( 'content' ) ) ),
			'post_status'  => 'publish'
		);

		$post_id = wp_insert_post( $post_data );

		if ( is_wp_error( $post_id ) ) {
			iwf_log( 'メッセージの新規作成に失敗しました。 - ' . $post_id->get_error_message() );
			die( 'Error' );
		}

		update_post_meta( $post_id, 'to_admin', 1 );
		update_post_meta( $post_id, 'admin_read', 0 );
		update_post_meta( $post_id, 'user_read', 1 );

		if ( $tree_id ) {
			update_post_meta( $post_id, 'tree_id', $tree_id );

		} else {
			$tree_id = $post_id;
			update_post_meta( $post_id, 'tree_id', $post_id );
		}

		$vars = array(
			'date' => date( 'Y年n月j日 H:i:s', current_time( 'timestamp' ) ),
			'url'  => add_query_arg( array( 'page' => 'writer-admin-message/list-message', 'action' => 'view', 'id' => $tree_id ), admin_url( 'admin.php' ) )
		);

		WA::template_mail( get_option( 'admin_email' ), $vars, 'new_message', true );

		wp_redirect( remove_query_arg( 'tree_id', add_query_arg( array( 'id' => $tree_id, 'updated' => 1 ), WA_View::get_link( 'message_view' ) ) ) );
		exit();
	}

} else {
	if ( $reply_message ) {
		$content       = wp_strip_all_tags( $reply_message->post_content );
		$content_lines = explode( "\n", strtr( $content, array_fill_keys( array( "\r\n", "\r", "\n" ), "\n" ) ) );

		foreach ( $content_lines as $i => $content_line ) {
			$content_lines[ $i ] = '> ' . $content_line;
		}

		$val->set_data( array( 'content' => implode( "\n", $content_lines ) ) );
	}
}

return compact( 'val', 'reply_message', 'root_message', 'tree_id' );