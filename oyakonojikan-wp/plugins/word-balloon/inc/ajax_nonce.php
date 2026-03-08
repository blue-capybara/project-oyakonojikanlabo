<?php
defined( 'ABSPATH' ) || exit;


if ( ! function_exists( 'word_balloon_nonce_action_event' ) ) :

  function word_balloon_nonce_action_event() {

    $w_b_json['column'] = '';
    $w_b_json['message'] = __('Unexpected Error','word-balloon');
    $w_b_json['status'] = 999;
    status_header( 999 );

    
    $action = 'word_balloon_nonce_action_center';
    
    if( check_ajax_referer($action, 'nonce', false) ) {
      
      $id   = (int) sanitize_text_field(esc_textarea( $_POST['id'] ) );
      $url  = sanitize_textarea_field( $_POST['url'] );
      $name = sanitize_text_field(esc_textarea( $_POST['name'] ) );
      $text = sanitize_text_field(esc_textarea( $_POST['text'] ) );
      $priority = (int) sanitize_text_field(esc_textarea( $_POST['priority'] ) );
      $originalid = (int) sanitize_text_field(esc_textarea( $_POST['originalid'] )) ;
      $date = current_time( 'mysql' );



      if( $_POST['datauri'] === 'true' && defined('WORD_BALLOON_PRO_DIR') && file_exists( WORD_BALLOON_PRO_DIR . 'inc/save/admin-avatar_save.php' ) ){

        require_once WORD_BALLOON_PRO_DIR . 'inc/save/admin-avatar_save.php';

        if( function_exists( 'word_balloon_pro_admin_page_avatar_encode' ) ){

          $return_data = word_balloon_pro_admin_page_avatar_encode($url);

          if( $return_data['success'] ){
            $url = $return_data['url'];
          }else{
            $w_b_json['message'] = $return_data['message'];
            header( 'Content-Type: application/json; charset=UTF-8' );
            echo json_encode( $w_b_json );
            die();
          }

        }

      }

      
      global $wpdb,$w_b_success;
      $w_b_success = 200;
      $table_name = $wpdb->prefix . 'word_balloon';

      if ($originalid == $id) {
        $wpdb->update($table_name,array(
          'date' => $date,
          'name' => $name,
          'text' => $text,
          'url' => $url,
          'priority' =>  (int) $priority,
        ),
        array( 'id' => (int) $id ),
        array( '%s','%s','%s','%s'),
        array( '%d' ));


      } else {
        $sql = $wpdb->prepare( "SELECT * FROM $table_name WHERE id = %d", $id, '%');
        $query = $wpdb->get_results($sql);
        if (!is_null($query)){
          foreach ($query as $key_value) {
            $databaseid = $key_value->id;
          }
        }
        if ($databaseid != $id){
          $wpdb->insert($table_name,array(
           'id' => (int) $id,
           'date' => $date,
           'name' => $name,
           'text' => $text,
           'url' => $url,
           'priority' => (int) $priority,
         ));

          $wpdb->delete($table_name,array('ID' => $originalid));

        } else {
          $w_b_success = 999;
          $w_b_json['message'] = __('Do not overwrite existing ID.','word-balloon');

        }

      }

      if( $w_b_success === 200){
        status_header( 200 );
        $w_b_json['message'] = __('Avatar updated successfully!','word-balloon');
        $w_b_json['column'] = '<th scope="row" class="check-column"><input type="checkbox" name="avatar[]" value="'.$id.'" /></th><td class="url column-url has-row-actions column-primary" data-colname="'.__('Avatar','word-balloon').'"><img src="'.$url.'" class="w_b_avatar_list_img" /><button type="button" class="toggle-row"><span class="screen-reader-text">'.__('Show more details','word-balloon').'</span></button></td><td class="name column-name" data-colname="'.__('Name','word-balloon').'"><span class="column_avatar_name">'.$name.'</span> <span class="column_avatar_id" style="color:silver">(id:'.$id.')</span><div class="row-actions"><span class="edit"><a href="javascript:void(0)" class="w_b_editinline">'.__('Edit','word-balloon').'</a> | </span><span class="delete"><a href="'.wp_nonce_url(sprintf(admin_url('options-general.php?page=%s&action=%s&id=%s'),$_REQUEST['page'],'delete',$item['id']), 'word_balloon_nonce_field_action', 'word_balloon_nonce_name').'" class="delete_link">'.__('Delete','word-balloon').'</a></span></div><button type="button" class="toggle-row"><span class="screen-reader-text">'.__('Show more details','word-balloon').'</span></button></td><td class="text column-text" data-colname="'.__('Note','word-balloon').'"><span class="column_avatar_text">'.$text.'</span></td><td class="priority column-priority" data-colname="'.__('Priority','word-balloon').'">'.$priority.'</td><td class="date column-date" data-colname="'.__('Date Modified','word-balloon').'">'.current_time( 'mysql' ).'</td>';
        $w_b_json['status'] = 200;
      }




    }

    header( 'Content-Type: application/json; charset=UTF-8' );
    echo json_encode( $w_b_json );
    die();
  }

endif;

