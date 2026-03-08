<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_post_page_filter($load_setting) {
	?>

	<div class="w_b_filter_panel w_b_panel_wrap">
		<div class="w_b_filter_contents w_b_panel_contents">
			<span class="w_b_panel_title"><i class="wb-filter" aria-hidden="true"></i> <?php _e('Filters','word-balloon'); ?></span>
			<div class="w_b_flex_box w_b_jc_sb w_b_o_s_t">

				<div class="w_b_filter_sub_contents w_b_flex_box w_b_ai_c">
					<label class="w_b_contents_side_heading"><i class="wb-user" aria-hidden="true"></i> </label>
					<select id="w_b_edit_avatar_filter" class="change_avatar_filter" name="w_b_avatar_filter" onchange="word_balloon_change_avatar_filter();">
						<option value="" selected></option>
						<?php
						foreach ($load_setting['type_filter'] as $key => $value) {
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
				if($load_setting['enable_icon']): ; ?>
					<div class="w_b_filter_sub_contents w_b_flex_box w_b_ai_c">
						<label class="w_b_contents_side_heading"><i class="wb-smile-o" aria-hidden="true"></i> </label>
						<select id="w_b_edit_icon_filter" class="change_icon_filter" name="w_b_icon_filter" onchange="word_balloon_change_icon_filter();">
							<option value="" selected></option>
							<?php
							foreach ($load_setting['type_filter'] as $key => $value) {
								?>
								<option value="<?php echo $key; ?>">
									<?php echo $value; ?>
								</option>
								<?php
							}
							?>
						</select>
					</div>
				<?php endif; ?>

				<div class="w_b_filter_sub_contents w_b_flex_box w_b_ai_c">
					<label class="w_b_contents_side_heading"><i class="wb-comment-o" aria-hidden="true"></i> </label>
					<select id="w_b_edit_balloon_filter" class="change_balloon_filter" name="w_b_balloon_filter" onchange="word_balloon_change_balloon_filter();">
						<option value="" selected></option>
						<?php
						foreach ($load_setting['type_filter'] as $key => $value) {
							?>
							<option value="<?php echo $key; ?>">
								<?php echo $value; ?>
							</option>
							<?php
						}
						?>
					</select>
					<?php
					$filter_jquery = '';
					foreach ($load_setting['type_filter'] as $key => $value) {
						$filter_jquery .= '"'.$key.'",';
					}
					?>
					<input type="hidden" id="w_b_type_filter" data-type='[<?php echo rtrim($filter_jquery , ','); ?>]' />
				</div>

			</div>


		</div>
	</div>



	<?php
}

