<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_post_page_avatar($load_setting) {
	?>


	<div class="w_b_avatar_panel w_b_panel_wrap">
		<div class="w_b_avatar_contents w_b_panel_contents">
			<span class="w_b_panel_title"><i class="wb-user" aria-hidden="true"></i> <?php _e('Avatar','word-balloon'); ?></span>

			<div class="w_b_flex_box w_b_jc_sb w_b_o_s_t">





				<div class="w_b_flex_box w_b_ai_c">
					<label class="w_b_contents_side_heading"><i class="wb-expand" aria-hidden="true"></i> <?php _e('Size','word-balloon'); ?></label><br>
					<select id="w_b_select_avatar_size" name="avatar_size" class="change_avatar_size" onchange="word_balloon_change_avatar_size();">
						<option value="S"<?php selected( $load_setting['avatar_size'], 'S' ); ?>>
							<?php _e('Small','word-balloon'); ?>
						</option>
						<option value="M"<?php selected( $load_setting['avatar_size'], 'M' ); ?>>
							<?php _e('Medium','word-balloon'); ?>
						</option>
						<option value="L"<?php selected( $load_setting['avatar_size'], 'L' ); ?>>
							<?php _e('Large','word-balloon'); ?>
						</option>
					</select>
					<input type="hidden" name="avatar_custom_size[S]" value="<?php echo esc_attr( $load_setting['avatar_custom_size']['S'] ); ?>" id="w_b_avatar_custom_size_S" />
					<input type="hidden" name="avatar_custom_size[M]" value="<?php echo esc_attr( $load_setting['avatar_custom_size']['M'] ); ?>" id="w_b_avatar_custom_size_M" />
					<input type="hidden" name="avatar_custom_size[L]" value="<?php echo esc_attr( $load_setting['avatar_custom_size']['L'] ); ?>" id="w_b_avatar_custom_size_L" />
				</div>

				<div class="w_b_avatar_sub_contents">
					<label class="w_b_contents_side_heading"><i class="wb-refresh" aria-hidden="true"></i> <?php _e('Flip','word-balloon'); ?></label>

					<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">
						<label for="w_b_avatar_flip_h" style=""><?php _e('Horizontal','word-balloon'); ?></label>
						<div class="w_b_checkbox">
							<input type="checkbox" id="w_b_avatar_flip_h" class="change_avatar_flip_h" name="avatar_flip_h" onchange="word_balloon_change_avatar_flip();" />
							<label for="w_b_avatar_flip_h"></label>
						</div>
					</div>
					<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">
						<label for="w_b_avatar_flip_v" style=""><?php _e('Vertical','word-balloon'); ?></label>
						<div class="w_b_checkbox">
							<input type="checkbox" id="w_b_avatar_flip_v" class="change_avatar_flip_v" name="avatar_flip_v" onchange="word_balloon_change_avatar_flip();" />
							<label for="w_b_avatar_flip_v"></label>
						</div>
					</div>

				</div>



				<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">


					<label for="w_b_edit_avatar_hide" style="margin-right:10px;"><?php _e('Hide','word-balloon'); ?></label>
					<div class="w_b_checkbox">
						<input type="checkbox" id="w_b_edit_avatar_hide" class="change_avatar_hide" name="avatar_hide"<?php checked( $load_setting['avatar_hide'] , 'true'); ?> onchange="word_balloon_change_avatar_hide();" />
						<label for="w_b_edit_avatar_hide"></label>
					</div>


				</div>

			</div>



			<hr>
			<label class="w_b_contents_side_heading" style="display: inline-block;"><i class="wb-vcard-o" aria-hidden="true"></i> <?php _e('Name','word-balloon'); ?></label>
			<div class="w_b_flex_box w_b_jc_sb w_b_o_s_t">

				<div class="w_b_name_sub_contents w_b_flex_box w_b_ai_c">
					<label class="w_b_contents_side_heading"><i class="wb-crosshairs" aria-hidden="true"></i> <?php _e('Position','word-balloon'); ?></label>
					<div>
						<select id="w_b_edit_avatar_name_position" class="w_b_change_name_position" name="name_position" onchange="word_balloon_change_avatar_name_position();">
							<option value="under_avatar" selected="selected">
								<?php _e('under the avatar','word-balloon'); ?>
							</option>
							<option value="on_avatar">
								<?php _e('on the avatar','word-balloon'); ?>
							</option>
							<option value="hide">
								<?php _e('hide','word-balloon'); ?>
							</option>
							<option value="on_balloon">
								<?php _e('on the balloon','word-balloon'); ?>
							</option>
							<option value="under_balloon">
								<?php _e('under the balloon','word-balloon'); ?>
							</option>

						</select>
					</div>
				</div>
				<input id="w_b_name_font_size" type="hidden" name="name_font_size" value="<?php echo esc_attr( function_exists('word_balloon_pro_post_page_avatar_name') ? $load_setting['name_font_size'] : 10  ); ?>" />
				<input id="w_b_atts_name_font_size" type="hidden" name="atts_name_font_size" value="" />
				<div class="w_b_name_sub_contents w_b_flex_box w_b_ai_c" style="margin: 0 10px;">
					<label class="w_b_contents_side_heading"><?php _e('a display name','word-balloon'); ?></label>
					<div>
						<input id="w_b_avatar_name" class="change_avatar_name" type="text" name="avatar_name" class="" style="width:100%;" onKeyUp="word_balloon_change_avatar_name(event)">
					</div>
				</div>
				<div id="w_b_edit_avatar_name_color_wrap" class="w_b_name_sub_contents w_b_flex_box w_b_ai_c">
					<label class="w_b_contents_side_heading"><i class="wb-paint-brush" aria-hidden="true"></i> <?php _e('Color','word-balloon'); ?></label>
					<div>
						<input id="w_b_edit_avatar_name_color" type="text" name="name_color" class="w_b_color_pick change_avatar_name_color" data-color_change_type="name_color" data-default_color="<?php echo $load_setting['name_color']; ?>" value="<?php echo $load_setting['name_color']; ?>" />
					</div>
				</div>


			</div>

			<?php if(function_exists('word_balloon_pro_post_page_avatar_name') ) word_balloon_pro_post_page_avatar_name($load_setting); ?>

			<hr>
			<div class="w_b_o_s_t" style="">

				<label class="w_b_contents_side_heading" style="display: inline-block;"><i class="wb-square-o" aria-hidden="true"></i> <?php _e('Border','word-balloon'); ?></label>
				<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">

					<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">

						<label class="" for="w_b_edit_avatar_border" style="margin-right:10px;"><?php _e('Border','word-balloon'); ?></label>
						<div class="w_b_checkbox">
							<input type="checkbox" id="w_b_edit_avatar_border" class="change_avatar_border" name="avatar_border" <?php checked( $load_setting['avatar_border'] , 'true'); ?> onchange="word_balloon_change_avatar_border();" />
							<label for="w_b_edit_avatar_border"></label>
						</div>

					</div>

					<div class="w_b_avatar_sub_contents">


						<div class="w_b_flex_box w_b_flex_column">
							<div class="w_b_flex_box w_b_ai_c">
								<label class="w_b_contents_side_heading" for="w_b_edit_avatar_border_radius" style="margin-right:10px;"><i class="wb-square-o" aria-hidden="true"></i> <?php _e('Rounded corners','word-balloon'); ?></label>
							</div>

							<select id="w_b_edit_avatar_border_radius" class="change_avatar_border_radius" name="avatar_border_radius" onchange="word_balloon_change_avatar_border_radius();">
								<?php
								foreach ($load_setting['type_radius'] as $key => $value) {
									echo '<option value="'.$key.'"';
									selected( $load_setting['avatar_border_radius'], $key );
									echo '>'.$value.'</option>';
								}
								?>
							</select>

						</div>

					</div>

					<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">

						<label class="" for="w_b_avatar_shadow" style="margin-right:10px;"><?php _e('Shadow','word-balloon'); ?></label>
						<div class="w_b_checkbox">
							<input id="w_b_avatar_shadow" class="change_avatar_shadow" type="checkbox" name="avatar_shadow" <?php checked( $load_setting['avatar_shadow'] , 'true'); ?> onchange="word_balloon_change_avatar_shadow();" />
							<label for="w_b_avatar_shadow"></label>
						</div>

					</div>

				</div>
				<?php
				if(function_exists('word_balloon_pro_post_page_avatar') ) word_balloon_pro_post_page_avatar($load_setting);
				?>

			</div>


			<?php
			if(function_exists('word_balloon_pro_post_page_avatar_background') ) word_balloon_pro_post_page_avatar_background($load_setting);
			?>



		</div>

	</div>
	<?php
}

