<?php
defined( 'ABSPATH' ) || exit;




function word_balloon_admin_avatar_register() {
  ?>

  <div class="w_b_box_design w_b_avatar_regist_wrapper w_b_admin_edit_content_wrap">
    <span class="w_b_headding_text">
      <i class="wb-user-plus" aria-hidden="true" style=""></i> <?php _e('Register for avatar','word-balloon'); ?>
    </span>
    <hr>
    <div class="w_b_avatar_edit_contents">
      <div class="w_b_avatar_regist_sidebar w_b_admin_edit_content_wrap">
        <div id="w_b_register_avatar_wrap" class="">
          <img id="w_b_register_avatar_img" class="w_b_select_avatar_image_button w_b_cursor_pointer" src="<?php echo WORD_BALLOON_URI . 'img/mystery_men.svg'; ?>" alt="avatar" />
          <input type="button" id="w_b_avatar_clear" name="w_b_avatar_clear" value="" style="visibility: hidden;" />
        </div>
        <button id="" class="button w_b_select_avatar_image_button w_b_cursor_pointer"><?php _e('Select Image','word-balloon'); ?></button>
      </div>
      <div class="w_b_avatar_edit_content">
        <form name="w_b_avatar_new_edit_form" method="post" action="<?php print wp_nonce_url( admin_url( ( function_exists('word_balloon_pro_avatar_register_nonce_url') ? word_balloon_pro_avatar_register_nonce_url() : 'options-general.php?page=word-balloon') ) , 'w_b_nonce_field_action', 'w_b_nonce_name');?>" onsubmit="return false;">
          <?php wp_nonce_field( 'w_b_nonce_field_action','w_b_nonce_name' ); ?>
          <input type="hidden" name="posted" value="w_b_new_avatar_save">
          <input name="w_b_avatar_src" type="hidden" value="<?php echo WORD_BALLOON_URI . 'img/mystery_men.svg'; ?>" id="w_b_avatar_src"/>
          <input type="hidden" name="w_b_avatar_src_id" id="w_b_avatar_src_id" value="" />
          <label for="w_b_avatar_name"><?php _e('Name','word-balloon'); ?></label>
          <input id="w_b_avatar_name" name="w_b_avatar_name" class="" type="text" placeholder="<?php _e('Enter a name for the avatar(optional)','word-balloon'); ?>" maxlength="50" />
          <label for="w_b_avatar_text"><?php _e('Note','word-balloon'); ?></label>
          <input id="w_b_avatar_text" name="w_b_avatar_text" class="" type="text" placeholder="<?php _e('Note to avatar(optional)','word-balloon'); ?>" maxlength="100" />
          <?php
          if( function_exists('word_balloon_pro_admin_avatar_data_uri_settings') ){
            word_balloon_pro_admin_avatar_data_uri_settings();
          }
          ?>
          <input type="button" id="w_b_avatar_submit" class="button button-primary" value="<?php _e('Registration for avatar','word-balloon'); ?>" />
        </form>
        <input type="hidden" id="w_b_mystery_men_url" value="<?php echo WORD_BALLOON_URI . 'img/mystery_men.svg'; ?>" />
      </div>
    </div>
  </div>
  <?php
}
