<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_post_page() {

	$system_info = word_balloon_system_settings_load();
	if( !current_user_can( word_balloon_capability( $system_info['capability_post'] ) ) ) return;

	$load_setting = word_balloon_full_option_load();

	
	require_once WORD_BALLOON_DIR . 'inc/settings/default_atts.php';
	$atts = word_balloon_default_atts();


	
	require_once WORD_BALLOON_DIR . 'inc/shortcode/shortcode_function.php';
	
	require_once WORD_BALLOON_DIR . 'inc/shortcode/shortcode_build_box.php';



	if(!empty($load_setting['disable_balloon'])){
		foreach ($load_setting['disable_balloon'] as $key => $value) {
			if($value === 'true')unset($load_setting['type_balloon'][$key]);
		}
	}

	$load_setting['enable_icon'] = $load_setting['enable_effect'] = $load_setting['enable_filter'] = false;


	foreach ($load_setting['type_icon'] as $key => $value) {
		if( isset($load_setting['disable_icon'][$key]) ) {
			if($load_setting['disable_icon'][$key] === 'true'){
				unset($load_setting['type_icon'][$key]);
			}else{
				$load_setting['enable_icon'] = true;
			}
		}else{
			$load_setting['enable_icon'] = true;
		}
	}



	foreach ($load_setting['type_effect'] as $key => $value) {
		if( isset($load_setting['disable_effect'][$key]) ) {
			if($load_setting['disable_effect'][$key] === 'true'){
				unset($load_setting['type_effect'][$key]);
			}else{
				$load_setting['enable_effect'] = true;
			}
		}else{
			$load_setting['enable_effect'] = true;
		}
	}



	foreach ($load_setting['type_filter'] as $key => $value) {
		if( isset($load_setting['disable_filter'][$key]) ){
			if($load_setting['disable_filter'][$key] === 'true'){
				unset($load_setting['type_filter'][$key]);
			}else{
				$load_setting['enable_filter'] = true;
			}
		}else{
			$load_setting['enable_filter'] = true;
		}
	}





	if(	$load_setting['open_button'] === 'true' ){
		?>
		<div class="w_b_open_button" onclick="document.getElementById('w_b_modal_open').onclick();">
			<i class="wb-comment-o" aria-hidden="true" ></i>
		</div>
		<?php
	}

	
	?>
	<button type="button" id="w_b_modal_open" class="button" data-target="w_b_modal1" style="display: none;"></button>
	<div id="w_b_overlay" style="display: none;">
		<div class="w_b_container">
			<div class="w_b_inner">
				<div class="w_b_modal" ontouchstart="">

					<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">
						<input type="hidden" id="w_b_wordballoon_url" data-w_b_url="<?php echo WORD_BALLOON_URI; ?>" />
						<h2 class="w_b_modal_title w_b_flex_box w_b_mobile_none" style="margin:0;"><i class="wb-comment" aria-hidden="true" style="margin-right:5px"></i> <?php _e('Insert of word balloon','word-balloon'); ?></h2>
						<div class="w_b_modal_close_box"><button type="button" id="w_b_modal_close" class="w_b_modal_close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="#fff" d="M28,2.8L16.8,14L28,25.2L25.2,28L14,16.8L2.8,28L0,25.2L11.1,14L0,2.8L2.8,0L14,11.2L25.2,0L28,2.8z"/></svg></button></div>

					</div>
					<div class="w_b_box_pre_load" style="padding:0 10px 0;">

						<?php word_balloon_balloon_base_template(); ?>


					</div>



					<form class="w_b_avatar_select_form" name="w_b_avatar_select_form">

						<input id="w_b_avatar_settings" class="w_b_dn w_b_panel_check" type="checkbox"<?php echo ($load_setting['panel_type_hidden']['avatar'] === 'true' ? '' : ' checked'); ?> />
						<input id="w_b_balloon_settings" class="w_b_dn w_b_panel_check" type="checkbox"<?php echo ($load_setting['panel_type_hidden']['balloon'] === 'true' ? '' : ' checked'); ?> />
						<input id="w_b_icon_settings" class="w_b_dn w_b_panel_check" type="checkbox"<?php echo ($load_setting['panel_type_hidden']['icon'] === 'true' ? '' : ' checked'); ?> />
						<input id="w_b_effect_settings" class="w_b_dn w_b_panel_check" type="checkbox"<?php echo ($load_setting['panel_type_hidden']['effect'] === 'true' ? '' : ' checked'); ?> />
						<input id="w_b_filter_settings" class="w_b_dn w_b_panel_check" type="checkbox"<?php echo ($load_setting['panel_type_hidden']['filter'] === 'true' ? '' : ' checked'); ?> />
						<input id="w_b_status_settings" class="w_b_dn w_b_panel_check" type="checkbox"<?php echo ($load_setting['panel_type_hidden']['status'] === 'true' ? '' : ' checked'); ?> />
						<input id="w_b_mobile_settings" class="w_b_dn w_b_panel_check" type="checkbox"<?php echo ($load_setting['panel_type_hidden']['mobile'] === 'true' ? '' : ' checked'); ?> />
						<input id="w_b_in_view_settings" class="w_b_dn w_b_panel_check" type="checkbox"<?php echo ($load_setting['panel_type_hidden']['in_view'] === 'true' ? '' : ' checked'); ?> />
						<input id="w_b_side_by_side_settings" class="w_b_dn w_b_panel_check" type="checkbox"<?php echo ($load_setting['panel_type_hidden']['side_by_side'] === 'true' ? '' : ' checked'); ?> />
						<input id="w_b_wallpaper_settings" class="w_b_dn w_b_panel_check" type="checkbox"<?php echo ($load_setting['panel_type_hidden']['wallpaper'] === 'true' ? '' : ' checked'); ?> />


						<div class="w_b_flex_box w_b_ai_c w_b_main_select_box w_b_o_s_t">
							<?php
							require_once WORD_BALLOON_DIR . 'inc/admin/post/admin-post_main_select.php';
							word_balloon_post_page_main_select($load_setting);
							?>
						</div>
						<div class="w_b_avatar_data_submit_wrap">
							<button type="button" class="" id="w_b_avatar_data_submit" title="<?php _e('Insert','word-balloon'); ?>" onclick="return false;">
								<i class="wb-sign-in" aria-hidden="true"></i>
							</button>
						</div>

						<div class="w_b_flex_box w_b_ai_c w_b_avatar_template_wrap">


							<div class="w_b_flex_box w_b_ai_c" style="margin-right:12px;">
								<div class="w_b_flex_box w_b_ai_c w_b_tooltip" data-tooltip="<?php _e('Copy','word-balloon'); ?>" style="white-space: nowrap;">
									<i id="w_b_do_copy" class="wb-copy" aria-hidden="true" style="font-size:20px;"></i>
								</div>
								<?php
								if(function_exists('word_balloon_pro_post_page_restore_icon') ) word_balloon_pro_post_page_restore_icon();
								?>
							</div>



							<?php

							if(function_exists('word_balloon_pro_post_page_favorite') ) word_balloon_pro_post_page_favorite($load_setting);


							if(array_filter($load_setting['template'])){
								if(function_exists('word_balloon_pro_post_page_template') ) word_balloon_pro_post_page_template($load_setting);
							}

							?>



						</div>





						<div class="w_b_icon_menu w_b_flex_box w_b_jc_sb w_b_o_s_t">
							<?php
							if(function_exists('word_balloon_pro_post_page_mobile_icon') ) word_balloon_pro_post_page_mobile_icon();
							?>
							<label for="w_b_avatar_settings" title="<?php _e('Avatar','word-balloon'); ?>">
								<i class="wb-user" aria-hidden="true"></i>
							</label>
							<label for="w_b_balloon_settings" title="<?php _e('Balloon','word-balloon'); ?>">
								<i class="wb-comment-o" aria-hidden="true"></i>
							</label>

							<?php if($load_setting['enable_icon']):?>
								<label for="w_b_icon_settings" title="<?php _e('Icon','word-balloon'); ?>">
									<i class="wb-smile-o" aria-hidden="true"></i>
								</label>
							<?php endif; ?>

							<?php if($load_setting['enable_effect']):?>
								<label for="w_b_effect_settings" title="<?php _e('Effects','word-balloon'); ?>">
									<i class="wb-magic" aria-hidden="true"></i>
								</label>
							<?php endif; ?>

							<?php
							if(function_exists('word_balloon_pro_post_page_in_view_icon') ){
								$wallpaper_check = word_balloon_pro_post_page_in_view_icon();
							}
							?>
							<?php if($load_setting['enable_filter']):?>
								<label for="w_b_filter_settings" title="<?php _e('Filters','word-balloon'); ?>">
									<i class="wb-filter" aria-hidden="true"></i>
								</label>
							<?php endif; ?>

							<label for="w_b_status_settings" title="<?php _e('Status','word-balloon'); ?>">
								<i class="wb-commenting-o" aria-hidden="true"></i>
							</label>
							<?php

							$wallpaper_check = false;
							if(function_exists('word_balloon_pro_post_page_wallpaper_check') ){
								$wallpaper_check = word_balloon_pro_post_page_wallpaper_check($load_setting);
							}


							if($wallpaper_check && $load_setting['enable_wallpaper'] !== 'false'){
								if(function_exists('word_balloon_pro_post_page_wallpaper_icon') ) word_balloon_pro_post_page_wallpaper_icon();
							}

							if($load_setting['side_by_side'] !== 'false'){
								if(function_exists('word_balloon_pro_post_page_side_by_side_icon') ) word_balloon_pro_post_page_side_by_side_icon();
							} ?>
						</div>




						<?php
						if(function_exists('word_balloon_pro_post_page_mobile') ) word_balloon_pro_post_page_mobile($load_setting);

						require_once WORD_BALLOON_DIR . 'inc/admin/post/admin-post_avatar.php';
						word_balloon_post_page_avatar($load_setting);

						require_once WORD_BALLOON_DIR . 'inc/admin/post/admin-post_balloon.php';
						word_balloon_post_page_balloon($load_setting);


						if($load_setting['enable_icon']){

							require_once WORD_BALLOON_DIR . 'inc/admin/post/admin-post_icon.php';
							word_balloon_post_page_icon($load_setting);

						}

						if($load_setting['enable_effect']){

							require_once WORD_BALLOON_DIR . 'inc/admin/post/admin-post_effect.php';
							word_balloon_post_page_effect($load_setting);

						}else{
							echo '<input type="hidden" id="w_b_type_effect" data-type=\'[]\' />';
						}

						
						if(function_exists('word_balloon_pro_post_page_in_view') ) word_balloon_pro_post_page_in_view($load_setting);

						if($load_setting['enable_filter']){

							require_once WORD_BALLOON_DIR . 'inc/admin/post/admin-post_filter.php';
							word_balloon_post_page_filter($load_setting);

						}else{
							echo '<input type="hidden" id="w_b_type_filter" data-type=\'[]\' />';
						}

						require_once WORD_BALLOON_DIR . 'inc/admin/post/admin-post_status.php';
						word_balloon_post_page_status($load_setting);



						if($wallpaper_check){
							if(function_exists('word_balloon_pro_post_page_wallpaper') ) word_balloon_pro_post_page_wallpaper($load_setting);
						}


						if($load_setting['side_by_side'] !== 'false'){
							if(function_exists('word_balloon_pro_post_page_side_by_side') ) word_balloon_pro_post_page_side_by_side($load_setting);
						}
						$restore_data_name = "";
						$restore_data_type = "";
						foreach (word_balloon_restore_data_name() as $key) {
							$restore_data_name .= ' data-'.$key;
							$restore_data_type .= '"'.$key.'",';
						}
						?>

					</form>


				</div>
			</div>
		</div>


		<div id="w_b_insert_dialog" class="w_b_dialog_box w_b_flex_box"><i class="wb-check" aria-hidden="true" style="margin-right:5px;"></i> <span><?php _e('Insert was successful!','word-balloon'); ?></span></div>
		<div id="w_b_restore_dialog" class="w_b_dialog_box w_b_flex_box"><i class="wb-check" aria-hidden="true" style="margin-right:5px;"></i> <span><?php _e('Restore was successful!','word-balloon'); ?></span></div>
		<div id="w_b_copy_dialog" class="w_b_dialog_box w_b_flex_box"><i class="wb-check" aria-hidden="true" style="margin-right:5px;"></i> <span><?php _e('Copy was successful!','word-balloon'); ?></span></div>
		<input type="hidden" id="w_b_type_restore" data-type='[<?php echo rtrim($restore_data_type , ','); ?>]' />
		<input type="hidden" id="w_b_restore" data-enable="false" <?php echo $restore_data_name; ?> />
		<input type="hidden" id="w_b_restore_copy" />
		<input type="hidden" id="w_b_set_quote" />
		<?php
		$w_b_writing_mode = 'false';
		if (strstr($_SERVER['HTTP_USER_AGENT'], 'Firefox') ) {
			$w_b_writing_mode = 'true';
		}
		?>
		<input type="hidden" id="w_b_restore_load" value="false" />
		<input type="hidden" id="w_b_writing_mode" value="<?php echo $w_b_writing_mode; ?>" />
		<input id="w_b_enable_sound" type="hidden" name="enable_sound" data-enable_sound="<?php echo $load_setting['enable_sound'] ?>" >

		<style type="text/css" id="w_b_post_page"></style>
		<style type="text/css">.dn{display:none;}.w_b_vertical_writing{-webkit-writing-mode:vertical-rl;-ms-writing-mode:tb-rl;writing-mode:vertical-rl;-webkit-text-orientation:upright;text-orientation:upright;}</style>


	</div>
	<div id="w_b_pop_up_message"></div>

	<?php
}


function word_balloon_balloon_base_template() {

	
	$textarea_size = '16px';
	$ua = array('iPhone','iPod','iPad');
	$pattern = '/' . implode( '|', $ua ) . '/i';
	if ( preg_match( $pattern, $_SERVER['HTTP_USER_AGENT'] ) ) {
		$textarea_size = '16px';
	}
	?>

	<div id="w_b_box" class="w_b_box w_b_w100 w_b_flex">
		<div id="w_b_wrap" class="w_b_wrap w_b_flex w_b_div" style="">
			<div id="w_b_ava_box" class="w_b_ava_box w_b_relative w_b_ava_L w_b_f_n w_b_div">
				<div id="w_b_name_on_avatar" class="w_b_name w_b_name_C w_b_ta_C w_b_mp0 w_b_lh w_b_div"></div>
				<div id="w_b_icon_wrap" class="w_b_icon_wrap w_b_relative w_b_div">
					<div id="w_b_icon" class="w_b_icon w_b_icon_L w_b_icon_T w_b_icon-M w_b_direction_L w_b_div w_b_outview w_b_inview w_b_inclass">
						<div id="w_b_icon_effect" class="w_b_icon_effect w_b_w100 w_b_h100 w_b_div" style="">
							<img id="w_b_icon_svg" class="" src="" />
						</div>
					</div>
					<div id="w_b_ava_wrap" class="w_b_ava_wrap w_b_direction_L w_b_mp0 w_b_div w_b_outview w_b_inview w_b_inclass">
						<div id="w_b_ava_effect" class="w_b_ava_effect w_b_relative w_b_oh w_b_div w_b_radius w_b_size_M" style="">
							<img id="w_b_ava_img" src="<?php echo WORD_BALLOON_URI; ?>img/mystery_men.svg" width="" height="" alt="" class="w_b_ava_img w_b_w100 w_b_h100 w_b_mp0 w_b_img" style="">
						</div>
					</div>
				</div>
				<div id="w_b_name_under_avatar" class="w_b_name w_b_name_C w_b_ta_C w_b_mp0 w_b_lh w_b_div"></div>
				<div id="w_b_name_side_avatar" class="w_b_name w_b_mp0 w_b_lh w_b_div"></div>
			</div>
			<div id="w_b_bal_box" class="w_b_bal_box w_b_relative w_b_direction_L w_b_w100 w_b_div w_b_outview w_b_inview w_b_inclass" style="width: 100%; min-width: 0px;">
				<div id="w_b_space_on_balloon" class="w_b_space w_b_mp0 w_b_div"></div>
				<div id="w_b_bal_outer" class="w_b_bal_outer w_b_flex w_b_mp0 w_b_relative w_b_div" style="">
					<div id="w_b_bal_wrap" class="w_b_bal_wrap w_b_bal_wrap_L w_b_div">
						<div id="w_b_name_on_balloon" class="w_b_name w_b_name_R w_b_ta_R w_b_lh w_b_name_on_balloon w_b_div"></div>
						<div id="w_b_bal" class="w_b_bal w_b_relative w_b_talk w_b_bal_L w_b_talk_L w_b_shadow_L w_b_ta_L w_b_div" onclick="word_balloon_set_quote_focus()">
							<div id="w_b_quote" class="w_b_quote w_b_post_text_wrap w_b_div" style="width: auto; max-width: 100%; min-width: auto; min-height: 26px; position: relative;">


								<textarea id="w_b_post_text" rows="" cols="" name="balloon_quote" class="w_b_post_text" style="border: 0px solid transparent;box-shadow:none;resize:none;background:transparent;width:100%;height:100%;position:absolute;top:0;right:0;line-height:1.4;padding:0;margin:0;text-rendering:auto;letter-spacing:normal;word-spacing:normal;text-transform:none;text-indent:0px;font-size:<?php echo $textarea_size; ?>;overflow:hidden;max-width:100%;min-width:100%;overflow-wrap:break-word;word-wrap:break-word;"></textarea>
								<div id="w_b_post_text_ph" class="w_b_post_text_ph" style="border: 0px solid transparent;box-shadow:none;line-height:1.4;padding:0;margin:0;color:#999;overflow:hidden;font-size:<?php echo $textarea_size; ?>;max-height:200px;width:125%;opacity:.4;"><?php _e('Place avatar\'s message here','word-balloon'); ?></div>
								<div id="w_b_post_pre_text" class="w_b_post_pre_text" style="border: 0px solid transparent;box-shadow:none;background:transparent;width:auto;line-height:1.4;padding:0;margin:0;text-rendering:auto;letter-spacing:normal;word-spacing:normal;text-transform:none;text-indent:0px;font-size:<?php echo $textarea_size; ?>;color:transparent;visibility:hidden;overflow-wrap:break-word;word-wrap:break-word;"></div>




							</div>
						</div>
						<div id="w_b_name_under_balloon" class="w_b_name w_b_name_R w_b_ta_R w_b_lh w_b_name_under_balloon w_b_div"></div>
					</div>
					<div id="w_b_status_box" class="w_b_status_box w_b_relative w_b_flex w_b_col w_b_f_n w_b_lh w_b_div">
						<div id="w_b_status_sound" class="w_b_status_sound w_b_mba w_b_div">
							<div id="w_b_sound" class="w_b_sound w_b_div" style="cursor:pointer;">
								<div id="w_b_sound_icon_wrap" class="w_b_stop_sound w_b_div" data-current="stop" data-play="<?php echo WORD_BALLOON_URI; ?>img/play.svg" data-stop="<?php echo WORD_BALLOON_URI; ?>img/stop.svg" data-speaker="<?php echo WORD_BALLOON_URI; ?>img/speaker.svg" data-audio_id="" data-audio_url="" onmouseover="word_balloon_hover_status_sound_icon('enter')" onmouseleave="word_balloon_hover_status_sound_icon('leave')" style="display:none">
									<img id="w_b_sound_icon" alt="" class="w_b_mp0 w_b_img" src="<?php echo WORD_BALLOON_URI; ?>img/speaker.svg" width="26" height="26" />
								</div>
							</div>
						</div>
						<div id="w_b_status" class="w_b_status w_b_mta w_b_h100 w_b_flex w_b_col w_b_jc_fe w_b_div"></div>
					</div>
				</div>
				<div id="w_b_space_under_balloon" class="w_b_space w_b_mp0 w_b_div"></div>
			</div>
		</div>
	</div>

	<?php
}










