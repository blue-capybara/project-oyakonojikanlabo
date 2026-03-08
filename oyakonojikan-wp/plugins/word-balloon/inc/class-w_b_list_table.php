<?php
defined( 'ABSPATH' ) || exit;



if(!class_exists('WP_List_Table')){
  require_once( ABSPATH . 'wp-admin/includes/class-wp-list-table.php' );
}

class word_balloon_List_Table extends WP_List_Table {
  
  function __construct(){
    global $status, $page;
    
    parent::__construct( array(
      'singular'  => 'avatar',
      'plural'    => 'avatars',
      'ajax'      => true
    ) );
  }
  
  function column_default($item, $column_name){
    switch($column_name){
      case 'id':
      return sanitize_text_field(esc_textarea($item[$column_name]));
      break;
      case 'name':
      return sanitize_text_field(esc_textarea($item[$column_name]));
      break;
      case 'url':
      echo '<img src="'.sanitize_textarea_field($item[$column_name]).'" class="w_b_avatar_list_img" />';
      break;
      case 'text':
      return '<span class="column_avatar_text">'.sanitize_text_field(esc_textarea($item[$column_name])).'</span>';
      break;
      case 'priority':
      return sanitize_text_field(esc_textarea($item[$column_name]));
      break;
      case 'date':
      return sanitize_text_field(esc_textarea($item[$column_name]));
      break;
      default:
      return print_r($item,true);
    }
  }

  
  function column_name($item){
    
    $actions = array(
      'edit'      => '<a href="javascript:void(0)" class="w_b_editinline"><i class="wb-pencil" aria-hidden="true"></i> '.__('Edit','word-balloon').'</a>',
      'delete'    => sprintf('<a href="%s" class="delete_link"><i class="wb-user-times" aria-hidden="true"></i> '.__('Delete','word-balloon').'</a>',wp_nonce_url(sprintf(admin_url('options-general.php?page=%s&action=%s&id=%s'),$_REQUEST['page'],'delete',$item['id']), 'word_balloon_nonce_field_action', 'word_balloon_nonce_name')),
    );
    
    return sprintf('<span class="column_avatar_name">%1$s</span> <span class="column_avatar_id" style="color:silver">(id:%2$s)</span>%3$s',
      sanitize_text_field(esc_textarea($item['name'])),
      sanitize_text_field(esc_textarea($item['id'])),
      $this->row_actions($actions)
    );
  }


  


  function column_cb($item){
    return sprintf(
      '<input type="checkbox" class="w_b_avatar_delete_lists" name="%1$s[]" value="%2$s" />',
      $this->_args['singular'],
      $item['id']
    );
  }


  

  function get_columns(){
    $columns = array(
      'cb'        => '<input type="checkbox" />',
      'url'     => '<i class="wb-user" aria-hidden="true"></i> '.__('Avatar','word-balloon'),
      'name'    => __('Name','word-balloon'),
      'text'  => __('Note','word-balloon'),
      'priority'  => __('Priority','word-balloon'),
      'date'  => '<i class="wb-history" aria-hidden="true"></i> '.__('Date Modified','word-balloon')
    );
    return $columns;
  }


  
  
  function get_sortable_columns() {
    $sortable_columns = array(
      'id'     => array('id',true),
      'name'    => array('name',false),
      'text'  => array('text',false),
      'priority'  => array('priority',true),
      'date'  => array('date',true)
    );
    return $sortable_columns;
  }


  
  

  function get_bulk_actions() {
    $actions = array(
      'delete-selected'    => __('Delete','word-balloon')
    );
    return $actions;
  }

  
  function process_bulk_action() {
    if( 'delete'===$this->current_action() ) {
      global $wpdb;
      $table_name = $wpdb->prefix . 'word_balloon';
      $wpdb->delete($table_name,array('ID' => sanitize_text_field(esc_textarea($_REQUEST ['id']))));
    }
    
    if( 'delete-selected'===$this->current_action() ) {
      if (isset($_POST['avatar']) && is_array($_POST['avatar'])) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'word_balloon';
        foreach ($_POST['avatar'] as $value) {
          $wpdb->delete($table_name,array('ID' => sanitize_text_field(esc_textarea($value))));
        }
      }
    }
  }

  
  function prepare_items() {
    global $wpdb;

    $per_page = 20;

    

    $columns = $this->get_columns();
    $hidden = array();
    $sortable = $this->get_sortable_columns();

    

    $this->_column_headers = array($columns, $hidden, $sortable);

    

    $this->process_bulk_action();


    $table_name = $wpdb->prefix . 'word_balloon';

    $data = $wpdb->get_results("SELECT * FROM $table_name", 'ARRAY_A');

    

    if (isset($_REQUEST['orderby'])) {
      function usort_reorder($a,$b){
        $orderby = (!empty($_REQUEST['orderby'])) ? sanitize_text_field(esc_textarea($_REQUEST['orderby'])) : 'title';

        $order = (!empty($_REQUEST['order'])) ? sanitize_text_field(esc_textarea($_REQUEST['order'])) : 'asc';

        $result = strcmp($a[$orderby], $b[$orderby]);

        return ($order==='asc') ? $result : -$result;
      }
      usort($data, sanitize_sql_orderby('usort_reorder'));
    }
    
    $current_page = $this->get_pagenum();
    
    $total_items = count($data);
    
    $data = array_slice($data,(($current_page-1)*$per_page),$per_page);
    
    $this->items = $data;

    $this->set_pagination_args( array(
      'total_items' => sanitize_text_field(esc_textarea($total_items)),
      'per_page'    => sanitize_text_field(esc_textarea($per_page)),
      'total_pages' => sanitize_text_field(esc_textarea(ceil($total_items/$per_page)))
    ) );

    return $total_items;
  }
}
