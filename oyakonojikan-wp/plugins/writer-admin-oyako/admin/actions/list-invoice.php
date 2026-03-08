<?php
if ( filter_input( INPUT_GET, 'updated' ) === 'delete' ) {
	add_settings_error( 'deleted_message', 'deleted_message', '請求書を削除しました。', 'updated' );
}

if ( filter_input( INPUT_GET, 'updated' ) === 'status' ) {
	add_settings_error( 'deleted_message', 'deleted_message', '請求書のステータスを変更しました。', 'updated' );
}