<?php
defined( 'ABSPATH' ) || exit;





function word_balloon_create_db() {
  
  $db_ver = get_option( "word_balloon_db_version" );

  if( empty($db_ver) ) $db_ver = 99999;

  if ( $db_ver === WORD_BALLOON_VERSION ) return;

  global $wpdb;

  $charset_collate = $wpdb->get_charset_collate();
  $table_name = $wpdb->prefix . 'word_balloon';

  if ( !empty($wpdb->charset) )
    $charset_collate = "DEFAULT CHARACTER SET {$wpdb->charset} ";

  if ( !empty($wpdb->collate) )
    $charset_collate .= "COLLATE {$wpdb->collate}";


  $sql = "CREATE TABLE ".$table_name." (
  id mediumint(3) NOT NULL AUTO_INCREMENT,
  date datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
  name varchar(50) NOT NULL,
  text varchar(100) NOT NULL,
  url varchar(3000000) NOT NULL,
  priority mediumint(4) DEFAULT 500 NOT NULL,
  UNIQUE KEY id (id) ) {$charset_collate} AUTO_INCREMENT=1;";

  require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
  dbDelta( $sql );

  update_option( 'word_balloon_db_version', WORD_BALLOON_VERSION );


}
