<?php
if ( filter_input( INPUT_GET, 'deleted' ) ) {
	add_settings_error( 'deleted_message', 'deleted_message', 'メッセージを削除しました。', 'updated' );
}