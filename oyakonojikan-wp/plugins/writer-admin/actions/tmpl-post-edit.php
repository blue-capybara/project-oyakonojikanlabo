<?php
$post_id = filter_input( INPUT_GET, 'id' );
$post    = null;

if ( $post_id ) {
	if ( ! WA_Post::check_post_author( $post_id, get_current_user_id() ) ) {
		wp_redirect( remove_query_arg( 'id' ) );
		exit();
	}

	$post = get_post( $post_id );
}

if ( $post && WA_Post::is_not_editable( $post ) ) {
	wp_redirect( WA_View::get_link( 'post_list' ) );
	exit();
}

IWF_Token::initialize();

$category_list = wp_list_pluck( get_terms( array(
	'taxonomy'   => 'category',
	'hide_empty' => false,
	'all'        => true
) ), 'term_id', 'name' );

$val = IWF_Validation::instance( WA::get_config( 'post_type' ), array(
	'form_field_prefix' => WA::get_config( 'form.field_prefix' ),
	'error_open'        => '<span class="has-error"><span class="help-block"><i class="fa fa-exclamation-triangle"></i> ',
	'error_close'       => '</span></span>'
) );

$val->add_field( 'title', 'タイトル' )
    ->add_rule( 'not_empty' );

$val->add_field( 'category', 'カテゴリー', 'select', $category_list, array( 'empty' => '--' ) )
    ->add_rule( 'not_empty' );

$val->add_field( 'eyecatch_file', 'アイキャッチ画像' );

$val->add_field( 'eyecatch_url' );

$val->add_field( WA_Content::get_field_key(), 'コンテンツ' )
    ->add_rule( 'not_empty' )
    ->add_rule( 'WA_Post::validate_contents' )->set_message( '%label%にエラーがあります。' );

do_action( 'wa/post_edit/init_validator', $val );

$thumbnail_id = 0;

if ( $post ) {
	$category     = IWF_Post::get_first_term( $post, 'category' );
	$thumbnail_id = get_post_thumbnail_id( $post->ID );

	$default_data = array(
		'title'         => get_the_title( $post ),
		'category'      => $category ? $category->term_id : null,
		'eyecatch_file' => $thumbnail_id ? get_attached_file( $thumbnail_id ) : '',
		'eyecatch_url'  => $thumbnail_id ? wp_get_attachment_url( $thumbnail_id ) : '',
	);

	$val->set_data( apply_filters( 'wa/post_edit/default_data', $default_data, $post ) );
}

if ( iwf_request_is( 'post' ) ) {
	$is_review  = filter_input( INPUT_POST, 'do_review' );
	$is_draft   = filter_input( INPUT_POST, 'do_draft' );
	$is_preview = filter_input( INPUT_POST, 'do_preview' );

	if ( $post ) {
		if ( filter_input( INPUT_POST, 'do_delete' ) ) {
			wp_delete_post( $post->ID, true );

			wp_redirect( add_query_arg( array( 'deleted' => 1 ), WA_View::get_link( 'post_list' ) ) );
			exit();
		}
	}

	if ( isset( $_POST[ WA_Content::get_field_key( true ) ] ) ) {
		$_POST[ WA_Content::get_field_key( true ) ] = WA_Content::prepare_data( $_POST[ WA_Content::get_field_key( true ) ] );
	}

	$val->set_data( $_POST );

	apply_filters( 'wa/post_edit/before_validate', $val );

	$val->run();

	if ( ! empty( $_FILES['_eyecatch']['tmp_name'] ) ) {
		$result = WA_Post::upload_file( $_FILES['_eyecatch'], array(
			'allowed_types'   => WA::get_config( 'form.image_types' ),
			'max_upload_size' => WA::get_config( 'form.max_file_size' ),
		) );

		if ( is_wp_error( $result ) ) {
			$val->set_error( 'eyecatch_file', 'アイキャッチ画像の' . $result->get_error_message() );

		} else {
			$val->set_data( 'eyecatch_file', $result['file'] );
			$val->set_validated( 'eyecatch_file', $result['file'] );

			$val->set_data( 'eyecatch_url', $result['url'] );
			$val->set_validated( 'eyecatch_url', $result['url'] );
		}

	} else if ( $val->get_data( 'eyecatch_file' ) ) {
		$file_type = wp_check_filetype( $val->get_data( 'eyecatch_file' ) );

		if ( ! is_file( $val->get_data( 'eyecatch_file' ) ) ) {
			$val->set_error( 'eyecatch_file', 'アイキャッチ画像の登録に失敗しました。' );

		} else if ( ! in_array( $file_type['ext'], WA::get_config( 'form.image_types' ) ) ) {
			$val->set_error( 'eyecatch_file', 'アイキャッチ画像の形式が不正です。' );
		}

	} else {
		$val->set_error( 'eyecatch_file', 'アイキャッチ画像は必須入力です。' );
	}

	if ( $val->is_valid() && IWF_Token::verify_request( 'post', null, false ) ) {
		$post_data = array(
			'post_type'   => WA::get_config( 'post_type' ),
			'post_title'  => $val->validated( 'title' ),
			'post_author' => get_current_user_id(),
		);

		if ( $is_review ) {
			$post_data['post_status'] = 'pending';

		} else if ( $is_draft ) {
			$post_data['post_status'] = 'draft';

		} else if ( $is_preview ) {
			$post_data['post_status'] = 'draft';
		}

		$post_data = apply_filters( 'wa/post_edit/validated_post_data', $post_data, $val );

		if ( empty( $post ) ) {
			$post_id = wp_insert_post( $post_data );

		} else {
			$post_data['ID'] = $post->ID;
			$post_id         = wp_update_post( $post_data );
		}

		if ( is_wp_error( $post_id ) ) {
			iwf_log( '投稿の登録に失敗 - ' . $post_id->get_error_message() );
			die( 'Error' );
		}

		$post_data['ID'] = $post_id;

		if ( ! $thumbnail_id || get_attached_file( $thumbnail_id ) != $val->validated( 'eyecatch_file' ) ) {
			$attachment_id = WA_Post::insert_attachment( $val->validated( 'eyecatch_file' ), $val->validated( 'eyecatch_url' ) );

			if ( is_wp_error( $attachment_id ) ) {
				iwf_log( 'アイキャッチ画像の登録に失敗 - ' . $attachment_id->get_error_message() );
				die( 'Error' );
			}

		} else {
			$attachment_id = $thumbnail_id;
		}

		set_post_thumbnail( $post_id, $attachment_id );

		wp_set_object_terms( $post_id, (int) $val->validated( 'category' ), 'category' );

		do_action( 'wa/post_edit/after_save', $post_id, $post_data, $val );

		if ( $is_draft ) {
			wp_redirect( remove_query_arg( array( 'updated_preview', 'updated_pending' ), add_query_arg( array( 'id' => $post_id, 'updated_draft' => 1 ) ) ) );
			exit();
		}

		if ( $is_review ) {
			$user = wp_get_current_user();
			$vars = array(
				'title' => get_the_title( $post_id ),
				'name'  => WA_User::get_name( $user->ID ),
				'url'   => add_query_arg( array( 'action' => 'edit', 'post' => $post_id ), admin_url( 'post.php' ) )
			);

			WA::template_mail( get_option( 'admin_email' ), $vars, 'to_pending', true );

			wp_redirect( remove_query_arg( 'id', add_query_arg( array( 'updated_pending' => 1 ), WA_View::get_link( 'post_list' ) ) ) );
			exit();
		}

		if ( $is_preview ) {
			wp_redirect( remove_query_arg( array( 'updated_draft', 'updated_pending' ), add_query_arg( array( 'id' => $post_id, 'updated_preview' => 1 ) ) ) );
			exit();
		}
	}

}

return compact( 'val', 'post' );