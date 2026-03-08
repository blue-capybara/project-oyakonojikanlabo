<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_post_page_status($load_setting) {
	?>

	<div class="w_b_status_panel w_b_panel_wrap">
		<div class="w_b_status_contents w_b_panel_contents">
			<span class="w_b_panel_title"><i class="wb-commenting-o" aria-hidden="true"></i> <?php _e('Status','word-balloon'); ?></span>
			<div class="w_b_flex_box w_b_o_s_t">
				<div class="w_b_status_sub_contents w_b_flex_box w_b_ai_c">
					<label class="w_b_contents_side_heading" for="w_b_status_comment"><?php _e('Comment','word-balloon'); ?></label>
					<input id="w_b_status_comment" class="change_status_comment" type="text" name="status" style="width:100%;min-width:164px" onKeyUp="word_balloon_change_status_comment()" />
				</div>

				<div id="w_b_edit_status_color_wrap" class="w_b_status_sub_contents w_b_flex_box w_b_ai_c w_b_jc_fe" style="margin-right: 0;">
					<label class="w_b_contents_side_heading"><i class="wb-paint-brush" aria-hidden="true"></i> <?php _e('Color','word-balloon'); ?></label>

					<input id="w_b_edit_status_color" type="text" name="status_color" class="w_b_color_pick change_status_color" data-color_change_type="status_color" data-default_color="<?php echo $load_setting['status_color']; ?>" value="<?php echo $load_setting['status_color']; ?>" />
				</div>
			</div>

			<?php
			if($load_setting['enable_sound'] === 'true'): ?>

				<div class="w_b_flex_box">

					<div class="w_b_status_sub_contents w_b_flex_box w_b_ai_c w_b_o_s_t">
						<label class="w_b_contents_side_heading" for="w_b_status_sound"><i class="wb-volume-up" aria-hidden="true"></i> <?php _e('Sound','word-balloon'); ?></label>
						<button type="button" id="w_b_status_sound" class="w_b_status_sound_button" onclick="word_balloon_set_status_sound(event);"><?php _e('Select','word-balloon'); ?></button>
						<input id="w_b_status_sound_filename" class="w_b_status_sound_filename" type="text" name="status_sound_filename" style="margin:0 10px;" readonly>
						<input id="w_b_status_sound_url" class="w_b_status_sound_url" type="hidden" name="status_sound_url">
						<input id="w_b_status_sound_id" class="w_b_status_sound_id" type="hidden" name="status_sound_id">
						<input id="w_b_status_sound_icon" class="w_b_status_sound_icon" type="hidden" name="status_sound_icon" data-speaker="<?php echo WORD_BALLOON_URI?>img/speaker.svg" data-play="<?php echo WORD_BALLOON_URI?>img/play.svg" data-stop="<?php echo WORD_BALLOON_URI?>img/stop.svg">
						<button type="button" id="w_b_status_sound_clear" class="w_b_status_sound_clear_button"><?php _e('Clear','word-balloon'); ?></button>
					</div>

				</div>

			<?php endif; ?>

		</div>
	</div>

	<?php
}

