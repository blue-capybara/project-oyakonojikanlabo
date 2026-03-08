<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_post_page_balloon($load_setting) {

	
	require_once WORD_BALLOON_DIR . 'inc/settings/custom_balloon_style.php';
	word_balloon_custom_balloon_style($load_setting);


	$border_style = array(
		'none' => esc_html__( 'none', 'word-balloon' ),
		'solid' => esc_html__( 'Solid', 'word-balloon' ),
		'double' => esc_html__( 'Double', 'word-balloon' ),
		'groove' => esc_html__( 'Groove', 'word-balloon' ),
		'ridge' => esc_html__( 'Ridge', 'word-balloon' ),
		'inset' => esc_html__( 'Inset', 'word-balloon' ),
		'outset' => esc_html__( 'Outset', 'word-balloon' ),
		'dashed' => esc_html__( 'Dashed', 'word-balloon' ),
		'dotted' => esc_html__( 'Dotted', 'word-balloon' ),
	);
	?>


	<div class="w_b_balloon_panel w_b_panel_wrap">
		<div class="w_b_balloon_contents w_b_panel_contents">
			<span class="w_b_panel_title"><i class="wb-comment-o" aria-hidden="true"></i> <?php _e('Balloon','word-balloon'); ?></span>


			<div class="w_b_o_s_t">
				<?php /*
				<label class="w_b_contents_side_heading"><i class="wb-paint-brush" aria-hidden="true"></i> <?php _e('Color','word-balloon'); ?></label>
				*/ ?>
				<div class="w_b_flex_box w_b_jc_sb w_b_ai_c">

					<div id="w_b_edit_balloon_text_color_wrap" class="w_b_color_pick_wrap w_b_balloon_sub_contents">
						<div class="w_b_flex_box w_b_ai_c">
							<label class=""><?php _e('Text','word-balloon'); ?></label>
							<input id="w_b_edit_balloon_text_color" type="text" name="text_color" class="w_b_color_pick w_b_change_balloon_text_color" data-color_change_type="text_color" data-balloon_css="color" />
						</div>
					</div>

					<div class="w_b_flex_box w_b_ai_c">
						<label class="" for="w_b_font_size"><?php _e('Size','word-balloon'); ?></label>
						<select id="w_b_font_size" class="change_font_size" name="font_size" style="width:auto" onchange="word_balloon_change_balloon_font_size();">
							<?php
							$i = 6;
							while($i<16){
								echo '<option value="'.$i.'"';
								selected( $load_setting['font_size'], $i );
								echo '>'.$i.'</option>';
								++$i;
							}
							echo '<option value=""';
							selected( $load_setting['font_size'], '' );
							echo '></option>';
							while($i<33){
								echo '<option value="'.$i.'"';
								selected( $load_setting['font_size'], $i );
								echo '>'.$i.'</option>';
								++$i;
							}
							?>
						</select>px
						<input type="hidden" name="font_size_default" value="<?php echo esc_attr( $load_setting['font_size'] ); ?>" id="w_b_font_size_default" />
					</div>


					<div class="w_b_flex_box w_b_ai_c" style="">
						<label class="" for="w_b_text_align"><?php _e('Alignment','word-balloon'); ?></label>
						<select id="w_b_text_align" name="text_align" style="width:auto" onchange="word_balloon_change_balloon_text_align(this.value);">
							<option value="L"<?php selected( $load_setting['text_align'], 'L' ); ?>>
								<?php _e('Left','word-balloon'); ?>
							</option>
							<option value="C"<?php selected( $load_setting['text_align'], 'C' ); ?>>
								<?php _e('Center','word-balloon'); ?>
							</option>
							<option value="R"<?php selected( $load_setting['text_align'], 'R' ); ?>>
								<?php _e('Right','word-balloon'); ?>
							</option>
						</select>
						<input type="hidden" name="text_align_default" value="<?php echo esc_attr( $load_setting['text_align'] ); ?>" id="w_b_text_align_default" />
					</div>



					<div id="w_b_edit_balloon_background_wrap" class="w_b_color_pick_wrap w_b_balloon_sub_contents w_b_flex_box">
						<div class="w_b_flex_box w_b_ai_c">
							<label class=""><?php _e('Background','word-balloon'); ?></label>
							<input id="w_b_edit_balloon_background" type="text" name="balloon_background" class="w_b_color_pick w_b_change_balloon_background" data-color_change_type="balloon_background" />
						</div>
					</div>

					<div id="w_b_edit_balloon_background_alpha_wrap" class="w_b_color_pick_wrap w_b_balloon_sub_contents w_b_flex_box">
						<div class="w_b_flex_box w_b_ai_c">
							<label class=""><?php _e('Background','word-balloon'); ?></label>
							<input id="w_b_edit_balloon_background_alpha" type="text" name="balloon_background_alpha" class="w_b_color_pick color-picker w_b_change_balloon_background_alpha" data-color_change_type="balloon_background_alpha" data-alpha-enabled="true" data-alpha-color-type="hex" />
						</div>
					</div>
				</div>
			</div>

			<div id="w_b_edit_border_wrap" class="w_b_border_block w_b_o_s_t">
				<hr>
				<label id="w_b_edit_border_label" class="w_b_contents_side_heading w_b_border_label"><i class="wb-square-o" aria-hidden="true"></i> <?php _e('Border','word-balloon'); ?></label>
				<div class="w_b_flex_box w_b_ai_c">
					<div id="w_b_edit_balloon_border_color_wrap" class="w_b_color_pick_wrap w_b_balloon_sub_contents">
						<div class="w_b_flex_box w_b_ai_c">
							<label class=""><?php _e('Color','word-balloon'); ?></label>
							<input id="w_b_edit_balloon_border_color" type="text" name="balloon_border_color" class="w_b_color_pick w_b_change_balloon_border_color" data-color_change_type="balloon_border_color" />
						</div>
					</div>

					<div id="w_b_edit_balloon_shadow_color_wrap" class="w_b_color_pick_wrap w_b_balloon_sub_contents">
						<div class="w_b_flex_box w_b_ai_c">
							<label class=""><?php _e('Shadow Color','word-balloon'); ?></label>
							<input id="w_b_edit_balloon_shadow_color" type="text" name="balloon_shadow_color" class="w_b_color_pick w_b_change_balloon_shadow_color" data-color_change_type="balloon_shadow_color" />
						</div>
					</div>

					<div id="w_b_edit_balloon_border_style_wrap" class="w_b_border_style_wrap w_b_balloon_sub_contents">
						<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">

							<label class=""><?php _e('Style','word-balloon'); ?></label>
							<select id="w_b_edit_balloon_border_style" name="balloon_border_style" class="w_b_balloon_border_custom" data-balloon_css="border-style" onchange="word_balloon_change_balloon_border_style(this.value);">
								<?php
								foreach ($border_style as $bs_key => $bs_value) {
									echo '<option value="'.$bs_key.'">'.$bs_value.'</option>';
								}
								?>
							</select>

						</div>
					</div>
					<div id="w_b_edit_balloon_border_width_wrap" class="w_b_border_width_wrap w_b_balloon_sub_contents">
						<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">
							<label class="" for="w_b_edit_balloon_border_width">
								<?php _e( 'Width','word-balloon' ); ?>
							</label>
							<input id="w_b_edit_balloon_border_width" type="number" name="balloon_border_width" class="w_b_balloon_border_width_custom" value="" data-balloon_css="border-width" min="1" max="50" onchange="word_balloon_change_balloon_border_width(this.value);" />

						</div>
					</div>
				</div>

			</div>

			<div class="w_b_balloon_sub_contents">
				<hr>
				<div class="w_b_flex_box w_b_ai_c w_b_jc_sb w_b_o_s_t">

					<div class="">
						<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">
							<label class="" for="w_b_edit_balloon_shadow"><?php _e('Shadow','word-balloon'); ?></label>
							<div class="w_b_checkbox">
								<input id="w_b_edit_balloon_shadow" class="change_balloon_shadow" type="checkbox" name="balloon_shadow"<?php checked( $load_setting['balloon_shadow'] , 'true'); ?> onchange="word_balloon_change_balloon_shadow();" />
								<label for="w_b_edit_balloon_shadow"></label>
							</div>
						</div>

					</div>


					<div class="">

						<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">
							<label class="" for="w_b_balloon_full_width"><?php _e('Full width','word-balloon'); ?></label>
							<div class="w_b_checkbox">
								<input id="w_b_balloon_full_width" class="w_b_balloon_full_width" type="checkbox" name="balloon_full_width"<?php checked( $load_setting['balloon_full_width'] , 'true'); ?> onchange="word_balloon_change_balloon_full_width();" />
								<label for="w_b_balloon_full_width"></label>
							</div>
						</div>

						<div class="w_b_flex_box w_b_ai_c w_b_jc_sb" style="margin-top:12px;">
							<label class="" for="w_b_edit_box_center"><?php _e('Center','word-balloon'); ?></label>
							<div class="w_b_checkbox">
								<input id="w_b_edit_box_center" class="w_b_box_center_input" type="checkbox" name="box_center"<?php checked( $load_setting['box_center'] , 'true'); ?> onchange="word_balloon_change_balloon_box_center();" />
								<label for="w_b_edit_box_center"></label>
							</div>
						</div>

					</div>



					<div class="">

						<div class="w_b_flex_box w_b_ai_c w_b_jc_sb">
							<label class="" for="w_b_edit_balloon_hide"><?php _e('Hide','word-balloon'); ?></label>
							<div class="w_b_checkbox">
								<input id="w_b_edit_balloon_hide" class="w_b_balloon_hide_input" type="checkbox" name="balloon_hide"<?php checked( $load_setting['balloon_hide'] , 'true'); ?> onchange="word_balloon_change_balloon_hide();" />
								<label for="w_b_edit_balloon_hide"></label>
							</div>
						</div>

						<?php
						if ( function_exists( 'word_balloon_pro_post_page_balloon_box_margin_button' ) ){
							word_balloon_pro_post_page_balloon_box_margin_button($load_setting);
						}
						?>

					</div>

					<?php
					$w_b_writing_mode = '';
					if (!strstr($_SERVER['HTTP_USER_AGENT'], 'Firefox') ) {
						$w_b_writing_mode = ' class="w_b_balloon_not_preview_pop w_b_relative" title="'.esc_html__( 'Can\'t preview','word-balloon' ).'"';
					}
					?>
					<div<?php echo $w_b_writing_mode; ?>>

					<div class="w_b_flex_box w_b_ai_c w_b_jc_sb" style="">
						<label class="" for="w_b_edit_balloon_vertical_writing"><?php _e('Vertical writing','word-balloon'); ?></label>
						<div class="w_b_checkbox">
							<input id="w_b_edit_balloon_vertical_writing" class="change_balloon_vertical_writing" type="checkbox" name="balloon_vertical_writing"<?php checked( $load_setting['balloon_vertical_writing'] , 'true'); ?> onchange="word_balloon_change_balloon_vertical_writing();" />
							<label for="w_b_edit_balloon_vertical_writing"></label>
						</div>
					</div>

				</div>

			</div>



		</div>






	</div>


</div>


<?php
}

