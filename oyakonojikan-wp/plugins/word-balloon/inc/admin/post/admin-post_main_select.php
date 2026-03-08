<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_post_page_main_select($load_setting) {
	global $wpdb;
	$table_name = $wpdb->prefix . 'word_balloon';
	$array = $wpdb->get_results("SELECT * FROM $table_name", 'ARRAY_A');
	?>

	<div class="w_b_flex_box w_b_ai_c" style="">
		<label for="w_b_avatar_select" class="w_b_contents_side_heading"><i class="wb-user" aria-hidden="true"></i></label>
		<select id="w_b_avatar_select" name="w_b_avatar_select" style="width:100%;" class="change_avatar_select" onchange="word_balloon_change_avatar();">

			<?php
			if(function_exists('word_balloon_pro_sort_avatar_list') ) $array = word_balloon_pro_sort_avatar_list($array , $load_setting['avatar_priority']);



			foreach($array as $key => $value){
				echo '<option value="'.$value['id'].'" data-avatar_name="'.$value['name'].'" data-avatar_img="'.$value['url'].'">'.$value['name'].($value['text'] != "" ?  ' ('.$value['text'].')' : '').'</option>';
			}


			if (empty($array) || $load_setting['keep_mystery_men'] === 'true') {
				echo '<option value="mystery_men" data-avatar_name="'.__('Mystery Men','word-balloon').'" data-avatar_img="'.WORD_BALLOON_URI . 'img/mystery_men.svg'.'">'.__('Mystery Men(mysterious figure)','word-balloon').'</option>';
			}
			?>
		</select>



	</div>

	<div class="w_b_flex_box w_b_ai_c">


		<div class="w_b_radiobox" style="margin:0 16px 0 0;">
			<input id="avatar_position_L" type="radio" name="post_avatar_position" value="L"<?php checked( $load_setting['avatar_position'], 'L' ); ?> class="w_b_radio change_avatar_position" data-post_avatar_position="L" onchange="word_balloon_change_avatar_position();" />
			<label for="avatar_position_L"><i class="wb-arrow-left wb_select_arrow" aria-hidden="true"></i></label>
		</div>


		<div class="w_b_radiobox">
			<input id="avatar_position_R" type="radio" name="post_avatar_position" value="R"<?php checked( $load_setting['avatar_position'], 'R' ); ?> class="w_b_radio change_avatar_position" data-post_avatar_position="R" onchange="word_balloon_change_avatar_position();" />
			<label for="avatar_position_R"><i class="wb-arrow-right wb_select_arrow" aria-hidden="true"></i></label>
		</div>

	</div>

	<div class="w_b_flex_box w_b_ai_c">
		<label for="w_b_choice_balloon" class="w_b_contents_side_heading"><i class="wb-comment-o" aria-hidden="true"></i></label>
		<select id="w_b_choice_balloon" name="post_choice_balloon" class="change_choice_balloon" onchange="word_balloon_reset_balloon();">
			<?php
			foreach ($load_setting['type_balloon'] as $key => $value) {
				echo '<option value="'.$key.'"';
				selected( $load_setting['choice_balloon'], $key );
				echo '>'.$value.'</option>';
			}
			?>
		</select>
	</div>




	<div class="w_b_flex_box w_b_ai_c" style="margin-left:auto;position:relative;width:48px;">

	</div>

	<?php
}

