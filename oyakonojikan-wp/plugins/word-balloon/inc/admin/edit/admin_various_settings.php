<?php
defined( 'ABSPATH' ) || exit;




function word_balloon_admin_various_settings($load_setting) {
  ?>

      <div id="w_b_settings_content" class="w_b_box_design w_b_any_settings_wrap w_b_admin_edit_content_wrap" style="">
        <form name="w_b_avatar_favorite_form" method="post" action="<?php print wp_nonce_url( admin_url('options-general.php?page=word-balloon') , 'w_b_nonce_field_action', 'w_b_nonce_name');?>" onsubmit="return false;">
          <?php wp_nonce_field( 'w_b_nonce_field_action','w_b_nonce_name' ); ?>
          <input type="hidden" name="posted" value="w_b_new_favorite_save" />

          <span class="w_b_headding_text"><?php _e('Settings','word-balloon'); ?></span>
          <label for="w_b_menu_tab_word_balloon_pro" class="" style="color: #0073aa;" ><?php _e('need more settings ?','word-balloon'); ?></label>
          <div class="w_b_other_contents w_b_option_contents w_b_flex_box w_b_flex_column">
            <div class="w_b_other_settings_wrap">
              <div class="w_b_flex_box w_b_ai_c" style="margin-bottom:24px;">
                <label class="w_b_mr10" for="w_b_label_inview">
                  <?php _e('Animate when balloon is displayed in the screen','word-balloon'); ?>
                </label>
                <div class="w_b_checkbox">
                  <input type="checkbox" name="inview"<?php checked( $load_setting['inview'] , 'true' ); ?> id="w_b_label_inview" value="1" />
                  <label for="w_b_label_inview"></label>
                </div>
              </div>

              <div class="w_b_flex_box w_b_ai_c" style="margin-bottom:24px;">
                <label class="w_b_mr10" for="w_b_label_innerblocks_mode"><?php _e('InnerBlocks mode','word-balloon'); ?></label>
                <div class="w_b_checkbox">
                  <input type="checkbox" name="innerblocks_mode"<?php checked( $load_setting['innerblocks_mode'] , 'true' ); ?> id="w_b_label_innerblocks_mode" value="1" />
                  <label for="w_b_label_innerblocks_mode"></label>
                </div>
              </div>

              <div class="w_b_flex_box w_b_ai_c" style="margin-bottom:24px;">
                <label class="w_b_mr10" for="w_b_label_open_button"><?php _e('Show Word Balloon button','word-balloon'); ?></label>
                <div class="w_b_checkbox">
                  <input type="checkbox" name="open_button"<?php checked( $load_setting['open_button'] , 'true' ); ?> id="w_b_label_open_button" value="1" />
                  <label for="w_b_label_open_button"></label>
                </div>

              </div>

              <div class="w_b_flex_box w_b_ai_c" style="margin-bottom:24px;">
                <label class="w_b_mr10" for="w_b_label_delete_db"><?php _e('Delete database of Word Balloon when uninstall','word-balloon'); ?></label>
                <div class="w_b_checkbox">
                  <input type="checkbox" name="delete_db"<?php checked( $load_setting['delete_db'] , 'true' ); ?> id="w_b_label_delete_db" value="1" />
                  <label for="w_b_label_delete_db"></label>
                </div>
              </div>

              <div class="w_b_flex_box w_b_ai_c" style="margin-bottom:24px;">
                <label class="w_b_mr10" for="w_b_label_delete_option"><?php _e('Delete option of Word Balloon when uninstall','word-balloon'); ?></label>
                <div class="w_b_checkbox">
                  <input type="checkbox" name="delete_option"<?php checked( $load_setting['delete_option'] , 'true' ); ?> id="w_b_label_delete_option" value="1" />
                  <label for="w_b_label_delete_option"></label>
                </div>
              </div>





              <?php

              $capability = array(
               'administrator' => esc_html__('Administrator','word-balloon'),
               'editor' => esc_html__('Editor','word-balloon'),
               'author' => esc_html__('Author','word-balloon'),
               'contributor' => esc_html__('Contributor','word-balloon'),
             );

              $capability_type = array(
               'capability_post' => sprintf( esc_html__( 'Permissions of user required to use %s', 'word-balloon' ) , esc_html__('Word Balloon when posting','word-balloon') ),
               'capability_edit_avatar' => sprintf( esc_html__( 'Permissions of user required to use %s', 'word-balloon' ) , esc_html__('settings','word-balloon') ),
             );

             foreach ($capability_type as $type_key => $type_value): ?>

              <div class="w_b_other_settings_wrap w_b_flex_box w_b_ai_c" style="margin-bottom:24px;">
                <div class="w_b_flex_box w_b_ai_c">
                  <label class="w_b_mr10" for="w_b_label_<?php esc_attr_e($type_key); ?>"><?php esc_html_e($type_value); ?></label>

                  <select id="w_b_label_<?php esc_attr_e($type_key); ?>" name="<?php esc_attr_e($type_key); ?>">
                    <?php
                    foreach ($capability as $key => $value) {
                      echo '<option value="'.$key.'"';
                      selected( $load_setting[$type_key], $key );
                      echo '>'.$value.'</option>';
                    }
                    ?>
                  </select>

                </div>
              </div>
              <?php
            endforeach; ?>





          </div>


        </div>
        <input type="button" id="w_b_favorite_submit" class="button button-primary" value="<?php _e('Save','word-balloon'); ?>" onclick="submit();" />
      </form>
    </div>

  <?php
}
