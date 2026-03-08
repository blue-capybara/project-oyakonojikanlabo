<?php
$id      = filter_input( INPUT_GET, 'id' );
$tree_id = filter_input( INPUT_GET, 'tree_id' );
$to_id   = filter_input( INPUT_GET, 'to_id' );

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

if ( $to_id ) {
	$to_id = wp_parse_id_list( $to_id );
}

$val = IWF_Validation::instance( 'wa_message', array(
	'form_field_prefix' => WA::get_config( 'form.field_prefix' ),
	'error_open'        => '<span class="msg-form__error">',
	'error_close'       => '</span>'
) );

$val->add_field( 'user', '送信先' )
    ->add_rule( 'not_empty' );

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

if ( iwf_request_is( 'post' ) ) {
	check_admin_referer( 'wa_message_compose' );

	if ( $val->run( $_POST ) ) {
		$user_ids = array_filter( array_unique( (array) $val->validated( 'user' ) ) );

		foreach ( $user_ids as $user_id ) {
			$post_data = array(
				'post_type'    => 'wa_message',
				'post_title'   => trim( wp_strip_all_tags( $val->validated( 'title' ) ) ),
				'post_author'  => $user_id,
				'post_content' => trim( wp_strip_all_tags( $val->validated( 'content' ) ) ),
				'post_status'  => 'publish'
			);

			$post_id = wp_insert_post( $post_data );

			if ( is_wp_error( $post_id ) ) {
				wp_die( 'メッセージの作成に失敗しました。 - ' . $post_id->get_error_message() );
			}

			update_post_meta( $post_id, 'to_admin', 0 );
			update_post_meta( $post_id, 'admin_read', 1 );
			update_post_meta( $post_id, 'user_read', 0 );

			if ( $root_message || $reply_message ) {
				update_post_meta( $post_id, 'tree_id', $tree_id );

			} else {
				$tree_id = $post_id;
				update_post_meta( $post_id, 'tree_id', $post_id );
			}

			$user = get_userdata( $user_id );

			if ( WA_User::is_writer( $user ) ) {
				$vars = array(
					'date' => date( 'Y年n月j日 H:i:s', current_time( 'timestamp' ) ),
					'url'  => add_query_arg( array( 'id' => $tree_id ), WA_View::get_link( 'message_view' ) )
				);

				WA::template_mail( $user->user_email, $vars, 'new_message' );
			}
		}

		if ( count( $user_ids ) > 1 ) {
			wp_redirect( remove_query_arg( array( 'action', 'id' ), add_query_arg( array( 'updated' => 1 ) ) ) );

		} else {
			wp_redirect( add_query_arg( array( 'action' => 'view', 'id' => $tree_id, 'updated' => 1 ) ) );
		}

		exit();
	}

	add_settings_error( 'invalid_post', 'invalid_post', 'フォームの内容にエラーが存在します。', 'error' );

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

return compact( 'val', 'reply_message', 'root_message', 'tree_id', 'to_id' );