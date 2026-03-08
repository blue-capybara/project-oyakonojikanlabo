<?php
/**
 * アンインストール時に実行
 */
if( !defined( 'ABSPATH') && !defined('WP_UNINSTALL_PLUGIN') )
    exit();

public function wce_delete_plugin() {
    delete_option( 'wce_options' );
}
wce_delete_plugin();