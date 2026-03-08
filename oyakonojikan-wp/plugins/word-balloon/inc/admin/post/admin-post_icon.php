<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_post_page_icon($load_setting) {

	
	require_once WORD_BALLOON_DIR . 'inc/settings/custom_icon_style.php';
	word_balloon_custom_icon_style($load_setting);

	?>


	<div class="w_b_icon_panel w_b_panel_wrap">
		<div class="w_b_icon_contents w_b_panel_contents">
			<span class="w_b_panel_title"><i class="wb-smile-o" aria-hidden="true"></i> <?php _e('Icon','word-balloon'); ?></span>




			<div class="w_b_flex_box w_b_jc_sb w_b_ai_c w_b_o_s_t">
				<div class="w_b_icon_sub_contents w_b_flex_box w_b_ai_c">
					<label class="w_b_contents_side_heading"><i class="wb-smile-o" aria-hidden="true"></i></label>
					<select id="w_b_edit_icon_type" class="w_b_change_icon_type" name="w_b_icon_type" onchange="word_balloon_set_icon_type();">
						<option value="" selected></option>
						<?php
						foreach ($load_setting['type_icon'] as $key => $value) {
							?>
							<option value="<?php echo $key; ?>" data-icon_src="<?php echo WORD_BALLOON_URI . 'icon/'.$key.'.svg' ?>">
								<?php echo $value; ?>
							</option>
							<?php
						}
						?>
					</select>
				</div>


				<div class="w_b_icon_sub_contents">
					<div class="w_b_flex_box w_b_ai_c">
						<label class="w_b_contents_side_heading"><i class="wb-crosshairs" aria-hidden="true"></i><span><?php _e('Position','word-balloon'); ?></span></label>
						<div class="w_b_flex_box w_b_flex_column">
							<div class="w_b_flex_box">
								<?php
								foreach ($load_setting['icon_position'] as $key => $value) {
									$arrow = 'arrow-left';
									if($key === 'center')$arrow = 'circle';
									?>
									<div class="w_b_radiobox">
										<input id="icon_position_<?php echo $key; ?>" type="radio" name="icon_position" value="<?php echo $key; ?>"<?php checked( $key, 'top_left' ); ?> class="w_b_radio w_b_change_icon_position" data-icon_position="<?php echo $key; ?>" onchange="word_balloon_change_icon_position();" />
										<label for="icon_position_<?php echo $key; ?>" class="wb_icon_<?php echo $key; ?>"><i class="wb-<?php echo $arrow; ?>" aria-hidden="true"></i></label>
									</div>
									<?php
									if($key === 'top_right'){
										echo '</div><div class="w_b_flex_box">';
									}else if($key === 'center_right'){
										echo '</div><div class="w_b_flex_box">';
									}
								} ?>
							</div>
						</div>
					</div>
				</div>

				<div class="w_b_icon_sub_contents">
					<div class="w_b_flex_box w_b_flex_column">
						<label class="w_b_contents_side_heading"><i class="wb-expand" aria-hidden="true"></i> <?php _e('Size','word-balloon'); ?></label>
						<select id="w_b_edit_icon_size" class="w_b_change_icon_size" name="w_b_icon_size" onchange="word_balloon_change_icon_size();">
							<option value="S"<?php selected( $load_setting['icon_size'], 'S' ); ?>>
								<?php _e('Small','word-balloon'); ?>
							</option>
							<option value="M"<?php selected( $load_setting['icon_size'], 'M' ); ?>>
								<?php _e('Medium','word-balloon'); ?>
							</option>
							<option value="L"<?php selected( $load_setting['icon_size'], 'L' ); ?>>
								<?php _e('Large','word-balloon'); ?>
							</option>
						</select>
						<input id="w_b_icon_custom_size" type="hidden" name="w_b_icon_custom_size" data-size_S="<?php echo esc_attr( $load_setting['icon_custom_size']['S'] ); ?>" data-size_M="<?php echo esc_attr( $load_setting['icon_custom_size']['M'] ); ?>" data-size_L="<?php echo esc_attr( $load_setting['icon_custom_size']['L'] ); ?>" />
					</div>
				</div>

				<div class="w_b_icon_sub_contents">
					<div class="w_b_flex_box w_b_ai_c">
						<label class="w_b_contents_side_heading"><i class="wb-refresh" aria-hidden="true"></i> <?php _e('Flip','word-balloon'); ?></label>
						<div>
							<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">
								<label for="w_b_icon_flip_h" style="flex: none;"><?php _e('Horizontal','word-balloon'); ?></label>
								<div class="w_b_checkbox">
									<input type="checkbox" id="w_b_icon_flip_h" class="change_icon_flip_h" name="icon_flip_h" onchange="word_balloon_change_icon_flip();" />
									<label for="w_b_icon_flip_h"></label>
								</div>
							</div>
							<div class="w_b_flex_box w_b_ai_c w_b_jc_sb" style="margin-top:5px;">
								<label for="w_b_icon_flip_v" style="flex: none;"><?php _e('Vertical','word-balloon'); ?></label>
								<div class="w_b_checkbox">
									<input type="checkbox" id="w_b_icon_flip_v" class="change_icon_flip_v" name="icon_flip_v" onchange="word_balloon_change_icon_flip();" />
									<label for="w_b_icon_flip_v"></label>
								</div>
							</div>
						</div>
					</div>
				</div>

			</div>


			<?php
			if(function_exists('word_balloon_pro_post_page_icon') ){
				word_balloon_pro_post_page_icon($load_setting);
			}
			?>

		</div>
	</div>

	<?php
}

