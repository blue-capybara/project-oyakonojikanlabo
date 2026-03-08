<?php
defined( 'ABSPATH' ) || exit;




function word_balloon_admin_page() {


  
  require_once WORD_BALLOON_DIR . 'inc/settings/default_post_settings.php';
  require_once WORD_BALLOON_DIR . 'inc/settings/default_system_settings.php';
  require_once WORD_BALLOON_DIR . 'inc/settings/default_admin_settings.php';

  
  if (isset($_POST['posted']) && $_POST['posted'] == 'w_b_new_avatar_save') {
    if (check_admin_referer( 'w_b_nonce_field_action', 'w_b_nonce_name' ) ) {



      global $wpdb;
      $url = sanitize_text_field(esc_textarea($_POST['w_b_avatar_src']));
      $name = sanitize_text_field(esc_textarea($_POST['w_b_avatar_name']));
      $text = sanitize_text_field(esc_textarea($_POST['w_b_avatar_text']));
      $date = current_time( 'mysql' );
      
      $table_name = $wpdb->prefix . 'word_balloon';
      $wpdb->insert(
        $table_name,
        array(
         'date' => $date,
         'name' => $name,
         'text' => $text,
         'url' => $url,
       )
      );

    }
  }




  if (isset($_POST['posted']) && $_POST['posted'] == 'w_b_new_favorite_save') {

    if (check_admin_referer( 'w_b_nonce_field_action', 'w_b_nonce_name' ) ) {

      
      $load_setting = array_merge(word_balloon_admin_settings_load() , word_balloon_type_settings_load());
      $instance = array();

      $checkbox_settings = array(
        'open_button',
        'innerblocks_mode',
      );

      foreach ($checkbox_settings as $key) {
        if(isset($_POST[$key])){
          $instance[$key] = 'true';
        }else{
          $instance[$key] = 'false';
        }
      }

      update_option('word_balloon_admin_settings', word_balloon_merge_option($load_setting ,$instance) );




      $load_setting = get_option('word_balloon_post_settings');

      if ( !$load_setting ) $load_setting = word_balloon_default_post_settings();

      $instance = array();

      $checkbox_settings = array(
       'inview',
     );

      foreach ($checkbox_settings as $key) {
        if(isset($_POST[$key])){
          $instance[$key] = 'true';
        }else{
          $instance[$key] = 'false';
        }
      }

      update_option('word_balloon_post_settings', array_merge($load_setting , $instance) );




      $instance = array();

      $checkbox_settings = array(
       'delete_db',
       'delete_option',
     );

      foreach ($checkbox_settings as $key) {
        if(isset($_POST[$key])){
          $instance[$key] = 'true';
        }else{
          $instance[$key] = 'false';
        }
      }

      $default_settings = array(
        'capability_post' => sanitize_text_field(esc_textarea($_POST['capability_post'])),
        'capability_edit_avatar' => sanitize_text_field(esc_textarea($_POST['capability_edit_avatar'])),
      );

      update_option('word_balloon_system_settings', word_balloon_merge_option( word_balloon_merge_option(word_balloon_system_settings_load(), $default_settings) , $instance ) );
    }

  }





  require_once WORD_BALLOON_DIR . 'inc/class-w_b_list_table.php';
  $w_b_ListTable = new word_balloon_List_Table();
  $total_items = $w_b_ListTable->prepare_items();

  $load_setting = word_balloon_merge_option( word_balloon_merge_option(word_balloon_post_settings_load() , word_balloon_system_settings_load() ) , word_balloon_admin_settings_load() );

  $local_url = ''; if( get_locale() !== 'ja' ) $local_url = 'en/';
  ?>
  <style>
    #w_b_loading {
     width: 60px;
     height: 60px;
     border: 10px solid #f6f2ef;
     border-top-color: #00b9eb;
     border-radius: 50%;
     animation: loading_spin 1.2s linear 0s infinite;
     text-align: center;
     z-index: 10;
     position:absolute;
     top: 0;
     bottom: 0;
     left: 0;
     right: 0;
     margin: auto;
   }
   @keyframes loading_spin {
     0% {transform: rotate(0deg);}
     100% {transform: rotate(360deg);}
   }
   #w_b_loading_bg{
     width: 100%;
     height: 100%;
     z-index: 10000;
     position: fixed;
     top: 0;
     left: 0;
     right: 0;
     bottom: 0;
     background-color: rgba(0,0,0,0.90);
     overflow: hidden;
     overflow-y: auto;
     -webkit-overflow-scrolling: touch;
     -webkit-backface-visibility: hidden;
     backface-visibility: hidden;
     -webkit-box-sizing: border-box;
     -moz-box-sizing: border-box;
     -o-box-sizing: border-box;
     -ms-box-sizing: border-box;
     box-sizing: border-box;
   }
 </style>

 <div id="w_b_loading_bg"><div id="w_b_loading"></div></div>
 <div id="w_b_pop_up_message"></div>

 <input id="w_b_menu_tab_avatar" class="tabs" type="radio" name="tab_item" checked="checked" />
 <input id="w_b_menu_tab_various_settings" class="tabs" type="radio" name="tab_item" />
 <input id="w_b_menu_tab_usage_environment" class="tabs" type="radio" name="tab_item" />
 <input id="w_b_menu_tab_word_balloon_pro" class="tabs" type="radio" name="tab_item" />

 <div class="w_b_admin_edit_header" style="position:relative;">
  <div class="w_b_flex_box w_b_ai_c w_b_jc_c w_b_flex_wrap">
    <img width="254" height="80" src="<?php echo WORD_BALLOON_URI; ?>img/word_balloon.svg" alt="Word Balloon">
  </div>
  <div class="w_b_admin_edit_version"><?php echo WORD_BALLOON_VERSION; ?></div>
  <div class="w_b_flex_box w_b_ai_c w_b_o_s_t" style="margin-top: 20px;">
    <div style="margin-left:auto;"></div>
    <?php
    if ( current_user_can( word_balloon_capability( $load_setting['capability_edit_avatar'] ) ) ) { ?>
      <label id="w_b_admin_edit_menu_avatar" class="w_b_admin_edit_menu w_b_flex_box w_b_ai_c w_b_jc_c" for="w_b_menu_tab_avatar">
        <i class="wb-user" aria-hidden="true"></i>
        <span><?php esc_html_e('Avatar','word-balloon'); ?></span>
      </label>
    <?php }
    if ( current_user_can( word_balloon_capability( $load_setting['capability_edit_various'] ) ) ) { ?>
      <label id="w_b_admin_edit_menu_various_settings" class="w_b_admin_edit_menu w_b_flex_box w_b_ai_c w_b_jc_c" for="w_b_menu_tab_various_settings">
        <i class="wb-cogs" aria-hidden="true" ></i>
        <span><?php esc_html_e('Settings','word-balloon'); ?></span>
      </label>
    <?php } ?>

    <label id="w_b_admin_edit_menu_usage_environment" class="w_b_admin_edit_menu w_b_flex_box w_b_ai_c w_b_jc_c" for="w_b_menu_tab_usage_environment">
      <i class="wb-gear" aria-hidden="true"></i>
      <span><?php esc_html_e('Usage environment','word-balloon'); ?></span>
    </label>

    <label id="w_b_admin_edit_menu_word_balloon_pro" class="w_b_admin_edit_menu w_b_flex_box w_b_ai_c w_b_jc_c" for="w_b_menu_tab_word_balloon_pro">
      <i class="wb-comment-o" aria-hidden="true"></i>
      <span><?php esc_html_e('Word Balloon PRO','word-balloon'); ?></span>
    </label>
    <div style="margin-right:auto;"></div>
  </div>
</div>

<div class="w_b_admin_edit_wrap">


  <?php

  if(isset($_POST['posted']) && $_POST['posted'] === 'w_b_new_avatar_save'){
    echo '<div id="message" class="updated notice notice-success is-dismissible notice-alt updated-message" style="margin-bottom: 16px;"><p>'.__('Avatar saved successfully.','word-balloon').'</p></div>'; 
  }
  if((isset($_GET['action']) && $_GET['action'] === 'delete') || (isset($_POST['action']) && $_POST['action'] === 'delete-selected' && (isset($_POST['avatar']) )) || (isset($_POST['action2']) && $_POST['action2'] === 'delete-selected' && (isset($_POST['avatar']) )) && !isset($_POST['posted']) ){ 

    echo '<div id="message" class="updated notice is-dismissible" style="margin-bottom: 16px;"><p>'.__('Avatar is removed from the system successfully.','word-balloon').'</p></div>';
  }

  if (isset($_POST['posted']) && $_POST['posted'] == 'w_b_new_favorite_save') {

    echo '<div id="message" class="updated notice notice-success is-dismissible notice-alt updated-message"><p>'.__('Settings saved successfully.','word-balloon').'</p></div>'; 
  }

  ?>





  <div class="w_b_admin_edit_content_wrap">

    <?php
    if ( current_user_can( word_balloon_capability( $load_setting['capability_edit_avatar'] ) ) ) { ?>
      <div id="w_b_avatar_content" class="tab_content">
        <?php if($total_items < 3 ):

          require_once WORD_BALLOON_DIR . 'inc/admin/edit/admin_avatar_register.php';
          word_balloon_admin_avatar_register();

        endif;

        require_once WORD_BALLOON_DIR . 'inc/admin/edit/admin_avatar_list.php';
        word_balloon_admin_avatar_list($w_b_ListTable)
        ?>

      </div>
    <?php }

    if ( current_user_can( word_balloon_capability( $load_setting['capability_edit_various'] ) ) ) { ?>
      <div id="w_b_various_settings_content" class="tab_content">
        <?php
        require_once WORD_BALLOON_DIR . 'inc/admin/edit/admin_various_settings.php';
        word_balloon_admin_various_settings($load_setting);
        ?>
      </div>

    <?php } ?>

    <div id="w_b_usage_environment_content" class="tab_content">

      <div id="word_balloon_usage_environment" class="w_b_box_design w_b_any_settings_wrap w_b_admin_edit_content_wrap" style="">
        <?php
        require_once WORD_BALLOON_DIR . 'inc/admin/edit/admin_usage_environment.php';
        word_balloon_usage_environment();
        ?>

      </div>
    </div>


    <div id="w_b_word_balloon_pro_content" class="tab_content">
      <div class="w_b_flex_box w_b_flex_column w_b_box_design w_b_any_settings_wrap w_b_admin_edit_content_wrap" style="padding: 5px 30px; text-align: center;">
        <div class="w_b_flex_box w_b_ai_c w_b_jc_c w_b_flex_wrap">
          <img id="word_balloon_pro_logo_svg" width="254" height="80" src="<?php echo WORD_BALLOON_URI; ?>img/word_balloon_pro.svg" alt="Word Balloon PRO" style="width: 100%;max-width: 100%;height: auto;">
        </div>
        <h2><?php esc_html_e('Guide to Word Balloon PRO','word-balloon'); ?></h2>
        <p><?php esc_html_e('Word Balloon various function hugely enhance in Word Balloon PRO.','word-balloon'); ?></p>

        <p><?php esc_html_e('The following things become possible when adding Word Balloon PRO.','word-balloon'); ?></p>

        <ul>
          <li><?php esc_html_e('You can registration an avatar to unlimited(up to the limit of database).','word-balloon'); ?></li>
          <li><?php esc_html_e('Customize speech bubbles, icons and settings','word-balloon'); ?></li>
          <li><?php esc_html_e('You can add the boilerplate text.','word-balloon'); ?></li>
          <li><?php esc_html_e('Set your favorites and easy load.','word-balloon'); ?></li>
          <li><?php esc_html_e('And so on.','word-balloon'); ?></li>
        </ul>

        <p><?php esc_html_e('Word Balloon PRO is license service.','word-balloon'); ?></p>
        <p><a href="https://dev.back2nature.jp/<?php echo $local_url; ?>word-balloon-pro" target="_blank"><?php esc_html_e('Word Balloon PRO is here.','word-balloon'); ?></a></p>

        <p><?php esc_html_e('Please consider it.','word-balloon'); ?></p>

      </div>
    </div>

  </div>

  <div class="w_b_flex_box w_b_ai_c w_b_flex_wrap">

    <div class="w_b_box_design" style="margin-right:16px;">
      <a href="https://wordpress.org/support/plugin/word-balloon/" class="" target="_blank">
        <?php esc_html_e('Support Forum','word-balloon'); ?>
        <p style="margin: 0;">
          <i class="wb-external-link" aria-hidden="true" style=""></i> wordpress.org
        </p>
      </a>
    </div>

    <div class="w_b_box_design" style="margin-right:16px;">
      <a href="https://docs.back2nature.jp/word-balloon" class="" target="_blank">
        <?php esc_html_e('Manual page','word-balloon'); ?>
        <p style="margin: 0;">
          <i class="wb-external-link" aria-hidden="true" style=""></i> <?php esc_html_e('Site of author <Japanese>','word-balloon'); ?>
        </p>
      </a>
    </div>

    <div class="w_b_box_design">

      <?php esc_html_e('Frequently Asked Questions','word-balloon'); ?>
      <a href="https://support.back2nature.jp/word-balloon/faq/" class="" target="_blank" style="text-decoration: none;" >
        <p style="margin: 0;">
          <i class="wb-external-link" aria-hidden="true" style=""></i> <?php esc_html_e('Site of author <Japanese>','word-balloon'); ?>
        </p>
      </a>
    </div>

  </div>

</div>


<?php
}

