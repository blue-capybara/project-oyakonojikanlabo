<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_post_page_effect($load_setting) {
	?>

	<div class="w_b_effect_panel w_b_panel_wrap">
		<div class="w_b_effect_contents w_b_panel_contents">
			<span class="w_b_panel_title"><i class="wb-magic" aria-hidden="true"></i> <?php _e('Effects','word-balloon'); ?></span>
			<div class="w_b_flex_box w_b_jc_sb w_b_o_s_t">
				<div>
					<div class="w_b_effect_sub_contents w_b_flex_box w_b_ai_c">
						<label class="w_b_contents_side_heading"><i class="wb-user" aria-hidden="true"></i> </label>
						<select id="w_b_edit_avatar_effect" class="change_avatar_effect" name="w_b_avatar_effect" onchange="word_balloon_change_avatar_effect();">
							<option value="" selected></option>
							<?php
							foreach ($load_setting['type_effect'] as $key => $value) {
								?>
								<option value="<?php echo $key; ?>">
									<?php echo $value; ?>
								</option>
								<?php
							}
							?>
						</select>

					</div>

					<?php
					if(function_exists('word_balloon_pro_post_page_effect_avatar') ){
						word_balloon_pro_post_page_effect_avatar($load_setting);
					}
					?>
				</div>
				<?php
				if($load_setting['enable_icon']): ; ?>
					<div>
						<div class="w_b_effect_sub_contents w_b_flex_box w_b_ai_c">
							<label class="w_b_contents_side_heading"><i class="wb-smile-o" aria-hidden="true"></i> </label>
							<select id="w_b_edit_icon_effect" class="change_icon_effect" name="w_b_icon_effect" onchange="word_balloon_change_icon_effect();">
								<option value="" selected></option>
								<?php
								foreach ($load_setting['type_effect'] as $key => $value) {
									?>
									<option value="<?php echo $key; ?>">
										<?php echo $value; ?>
									</option>
									<?php
								}
								?>
							</select>
						</div>

						<?php
						if(function_exists('word_balloon_pro_post_page_effect_icon') ){
							word_balloon_pro_post_page_effect_icon($load_setting);
						}
						?>
					</div>
				<?php endif; ?>

				<div>
					<div class="w_b_effect_sub_contents w_b_flex_box w_b_ai_c">
						<label class="w_b_contents_side_heading"><i class="wb-comment-o" aria-hidden="true"></i> </label>
						<select id="w_b_edit_balloon_effect" class="change_balloon_effect" name="w_b_balloon_effect" onchange="word_balloon_change_balloon_effect();">
							<option value="" selected></option>
							<?php
							foreach ($load_setting['type_effect'] as $key => $value) {
								?>
								<option value="<?php echo $key; ?>">
									<?php echo $value; ?>
								</option>
								<?php
							}
							?>
						</select>
						<?php
						$effect_jquery = '';
						foreach ($load_setting['type_effect'] as $key => $value) {
							$effect_jquery .= '"'.$key.'",';
						}
						?>
						<input type="hidden" id="w_b_type_effect" data-type='[<?php echo rtrim($effect_jquery , ','); ?>]' />
					</div>
					<?php
					if(function_exists('word_balloon_pro_post_page_effect_balloon') ){
						word_balloon_pro_post_page_effect_balloon($load_setting);
					}
					?>
				</div>

			</div>



		</div>
	</div>


	<?php
}

