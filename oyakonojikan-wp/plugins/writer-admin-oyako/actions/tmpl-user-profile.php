<?php
$user = wp_get_current_user();

IWF_Token::initialize();

$val = IWF_Validation::instance( 'oyako_member', array(
	'form_field_prefix' => WA::get_config( 'form.field_prefix' ),
	'error_open'        => '<span class="has-error"><span class="help-block"><i class="fa fa-exclamation-triangle"></i> ',
	'error_close'       => '</span></span>'
) );

$gender_list      = array( '男性' => 'male', '女性' => 'female' );
$work_status_list = array( '働いている', '専業主婦' );

$val->add_field( 'last_name', '姓' )
    ->add_rule( 'not_empty' )
    ->add_rule( 'max_length', 10 );

$val->add_field( 'first_name', '名' )
    ->add_rule( 'not_empty' )
    ->add_rule( 'max_length', 10 );

$val->add_field( 'kana_last_name', 'セイ' )
    ->add_rule( 'not_empty' )
    ->add_rule( 'match_pattern', '/^[ァ-ヶー]+$/u' )->set_message( '%label%はカタカナのみで入力してください。' )
    ->add_rule( 'max_length', 10 );

$val->add_field( 'kana_first_name', 'メイ' )
    ->add_rule( 'not_empty' )
    ->add_rule( 'match_pattern', '/^[ァ-ヶー]+$/u' )->set_message( '%label%はカタカナのみで入力してください。' )
    ->add_rule( 'max_length', 10 );

$val->add_field( 'gender', '性別', 'radio', $gender_list )
    ->add_rule( 'not_empty' );

$val->add_field( 'zip', '郵便番号' )
    ->add_rule( 'not_empty' )
    ->add_rule( 'max_length', 8 );

$val->add_field( 'address', '住所' )
    ->add_rule( 'not_empty' )
    ->add_rule( 'max_length', 60 );

$val->add_field( 'tel', '電話番号' )
    ->add_rule( 'not_empty' )
    ->add_rule( 'max_length', 12 );

$val->add_field( 'birth_day', '生年月日' );

$val->add_field( 'work_status', '仕事について', 'radio', $work_status_list )
    ->add_rule( 'not_empty' );

$val->add_field( 'family_no_child', '子供なし', 'checkbox', 1 );

$val->add_field( 'family_child_data_1_gender', '子供1：性別', 'radio', $gender_list );

$val->add_field( 'family_child_data_1_birth_day', '子供1：誕生日' );

$val->add_field( 'family_child_data_2_gender', '子供2：性別', 'radio', $gender_list );

$val->add_field( 'family_child_data_2_birth_day', '子供2：誕生日' );

$val->add_field( 'family_child_data_3_gender', '子供3：性別', 'radio', $gender_list );

$val->add_field( 'family_child_data_3_birth_day', '子供3：誕生日' );

$val->add_field( 'thumbnail_file', 'プロフィール画像' );

$val->add_field( 'thumbnail_url' );

$val->add_field( 'payment_bank', '金融機関名' )
    ->add_rule( 'max_length', 20 );

$val->add_field( 'payment_branch', '支店名' )
    ->add_rule( 'max_length', 20 );

$val->add_field( 'payment_number', '口座番号' )
    ->add_rule( 'match_pattern', '/^[0-9]+$/' )->set_message( '%label%は半角数字のみで入力してください。' )
    ->add_rule( 'max_length', 20 );

$val->add_field( 'payment_name', '口座名義人' )
    ->add_rule( 'match_pattern', '/^[ァ-ヶー\s]+$/u' )->set_message( '%label%はカタカナのみで入力してください。' )
    ->add_rule( 'max_length', 20 );

$thumbnail = get_field( 'thumbnail', $user );

if ( ! iwf_request_is( 'post' ) ) {
	$child_data = get_field( 'family_child_data', $user );

	$val->set_data( array(
		'last_name'                     => $user->last_name,
		'first_name'                    => $user->first_name,
		'kana_last_name'                => get_field( 'kana_last_name', $user ),
		'kana_first_name'               => get_field( 'kana_first_name', $user ),
		'gender'                        => get_field( 'gender', $user ),
		'zip'                           => get_field( 'zip', $user ),
		'address'                       => get_field( 'address', $user ),
		'tel'                           => get_field( 'tel', $user ),
		'birth_day'                     => get_field( 'birth_day', $user ),
		'work_status'                   => get_field( 'work_status', $user ),
		'family_no_child'               => get_field( 'family_no_child', $user ),
		'family_child_data_1_gender'    => ! empty( $child_data[0] ) ? $child_data[0]['gender'] : '',
		'family_child_data_1_birth_day' => ! empty( $child_data[0] ) ? $child_data[0]['birth_day'] : '',
		'family_child_data_2_gender'    => ! empty( $child_data[1] ) ? $child_data[1]['gender'] : '',
		'family_child_data_2_birth_day' => ! empty( $child_data[1] ) ? $child_data[1]['birth_day'] : '',
		'family_child_data_3_gender'    => ! empty( $child_data[2] ) ? $child_data[2]['gender'] : '',
		'family_child_data_3_birth_day' => ! empty( $child_data[2] ) ? $child_data[2]['birth_day'] : '',
		'payment_bank'                  => get_field( 'payment_bank', $user ),
		'payment_branch'                => get_field( 'payment_branch', $user ),
		'payment_number'                => get_field( 'payment_number', $user ),
		'payment_name'                  => get_field( 'payment_name', $user ),
		'thumbnail_file'                => ! empty( $thumbnail['url'] ) ? str_replace( WP_CONTENT_URL, WP_CONTENT_DIR, $thumbnail['url'] ) : '',
		'thumbnail_url'                 => ! empty( $thumbnail['url'] ) ? $thumbnail['url'] : '',
	) );
}

if ( iwf_request_is( 'post' ) ) {
	$val->set_data( $_POST );
	$val->run();

	if ( ! empty( $_FILES['_thumbnail']['tmp_name'] ) ) {
		$result = WA_Post::upload_file( $_FILES['_thumbnail'], array(
			'allowed_types'   => WA::get_config( 'form.image_types' ),
			'max_upload_size' => WA::get_config( 'form.max_file_size' ),
		) );

		if ( is_wp_error( $result ) ) {
			$val->set_error( 'thumbnail_file', 'プロフィール画像の' . $result->get_error_message() );

		} else {
			$val->set_data( 'thumbnail_file', $result['file'] );
			$val->set_validated( 'thumbnail_file', $result['file'] );

			$val->set_data( 'thumbnail_url', $result['url'] );
			$val->set_validated( 'thumbnail_url', $result['url'] );
		}

	} else if ( $val->get_data( 'thumbnail_file' ) ) {
		$file_type = wp_check_filetype( $val->get_data( 'thumbnail_file' ) );

		if ( ! is_file( $val->get_data( 'thumbnail_file' ) ) ) {
			$val->set_error( 'thumbnail_file', 'プロフィール画像の登録に失敗しました。' );

		} else if ( ! in_array( $file_type['ext'], WA::get_config( 'form.image_types' ) ) ) {
			$val->set_error( 'thumbnail_file', 'プロフィール画像の形式が不正です。' );
		}
	}

	if ( $val->is_valid() && IWF_Token::verify_request( 'oyako_member', null, false ) ) {
		if ( ! empty( $thumbnail['url'] ) || str_replace( WP_CONTENT_URL, WP_CONTENT_DIR, $thumbnail['url'] ) != $val->validated( 'thumbnail_file' ) ) {
			$attachment_id = WA_Post::insert_attachment( $val->validated( 'thumbnail_file' ), $val->validated( 'thumbnail_url' ) );

			if ( is_wp_error( $attachment_id ) ) {
				iwf_log( 'サムネイル画像の登録に失敗 - ' . $attachment_id->get_error_message() );
				die( 'Error' );
			}

		} else {
			$attachment_id = $thumbnail['id'];
		}

		update_field( 'last_name', $val->validated( 'last_name' ), $user );
		update_field( 'first_name', $val->validated( 'first_name' ), $user );
		update_field( 'kana_last_name', $val->validated( 'kana_last_name' ), $user );
		update_field( 'kana_first_name', $val->validated( 'kana_first_name' ), $user );
		update_field( 'gender', $val->validated( 'gender' ), $user );
		update_field( 'zip', $val->validated( 'zip' ), $user );
		update_field( 'address', $val->validated( 'address' ), $user );
		update_field( 'tel', $val->validated( 'tel' ), $user );
		update_field( 'birth_day', $val->validated( 'birth_day' ), $user );
		update_field( 'work_status', $val->validated( 'work_status' ), $user );

		update_field( 'field_5b0e2e1e1f24b', array(
			'field_5b0e2e321f24c' => '0',
			'field_5b0e2e581f24d' => array()
		), $user ); // 形式的に保存しておかないとACF側に反映されない

		update_field( 'family_no_child', $val->validated( 'family_no_child' ), $user );

		if ( ! $val->validated( 'family_no_child' ) ) {
			$child_data = array();

			for ( $i = 1; $i <= 3; $i ++ ) {
				$child_data[] = array(
					'gender'    => $val->validated( 'family_child_data_' . $i . '_gender' ),
					'birth_day' => $val->validated( 'family_child_data_' . $i . '_birth_day' )
				);
			}

			update_field( 'family_child_data', $child_data, $user );
		}

		update_field( 'payment_bank', $val->validated( 'payment_bank' ), $user );
		update_field( 'payment_branch', $val->validated( 'payment_branch' ), $user );
		update_field( 'payment_number', $val->validated( 'payment_number' ), $user );
		update_field( 'payment_name', $val->validated( 'payment_name' ), $user );
		update_field( 'thumbnail', $attachment_id, $user );

		wp_redirect( add_query_arg( array( 'saved' => 1 ) ) );
		exit();
	}

}

return compact( 'val', 'user' );