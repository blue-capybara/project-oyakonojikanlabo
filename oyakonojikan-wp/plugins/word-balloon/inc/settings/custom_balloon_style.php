<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_custom_balloon_style($load_setting){
	$direction = array(
		'L' => 'left',
		'R' => 'right',
	);
	foreach ( $load_setting['type_balloon'] as $key => $val ):
		foreach ($direction as $direction_key => $direction_value):

			$color_value = $background_value = $border_color_value = $border_style_value = $border_width_value = $border_radius_value = $balloon_shadow_color_value = $avatar_name_position_value = $gradient_color_value = '';

			if(isset($load_setting['custom_balloon'][$key][$direction_key]['color'])){
				$color_value = $load_setting['custom_balloon'][$key][$direction_key]['color'];
			}
			if($color_value === ''){
				$color_value = $load_setting['default_balloon_style'][$key][$direction_key]['color'];
			}

			if(isset($load_setting['custom_balloon'][$key][$direction_key]['background'])){
				$background_value = $load_setting['custom_balloon'][$key][$direction_key]['background'];
			}
			if($background_value === ''){
				$background_value = $load_setting['default_balloon_style'][$key][$direction_key]['background'];
			}

			if(isset($load_setting['custom_balloon'][$key][$direction_key]['border_color'])){
				$border_color_value = $load_setting['custom_balloon'][$key][$direction_key]['border_color'];
			}
			if($border_color_value === ''){
				$border_color_value = $load_setting['default_balloon_style'][$key][$direction_key]['border_color'];
			}


			if(isset($load_setting['custom_balloon'][$key][$direction_key]['border_style'])){
				$border_style_value = $load_setting['custom_balloon'][$key][$direction_key]['border_style'];
			}
			if($border_style_value === ''){
				$border_style_value = $load_setting['default_balloon_style'][$key][$direction_key]['border_style'];
			}

			if(isset($load_setting['custom_balloon'][$key][$direction_key]['border_width'])) {
				$border_width_value = $load_setting['custom_balloon'][$key][$direction_key]['border_width'];
			}
			if($border_width_value === ''){
				$border_width_value = $load_setting['default_balloon_style'][$key][$direction_key]['border_width'];
			}

			if(isset($load_setting['custom_balloon'][$key][$direction_key]['border_radius'])) {
				$border_radius_value = $load_setting['custom_balloon'][$key][$direction_key]['border_radius'];
			}
			if($border_radius_value === ''){
				$border_radius_value = $load_setting['default_balloon_style'][$key][$direction_key]['border_radius'];
			}

			if(isset($load_setting['custom_balloon'][$key][$direction_key]['balloon_shadow_color'])) {
				$balloon_shadow_color_value = $load_setting['custom_balloon'][$key][$direction_key]['balloon_shadow_color'];
			}
			if($balloon_shadow_color_value === ''){
				$balloon_shadow_color_value = $load_setting['default_balloon_style'][$key][$direction_key]['balloon_shadow_color'];
			}

			if(isset($load_setting['custom_balloon'][$key][$direction_key]['avatar_name_position'])) {
				$avatar_name_position_value = $load_setting['custom_balloon'][$key][$direction_key]['avatar_name_position'];
			}
			if($avatar_name_position_value === ''){
				$avatar_name_position_value = $load_setting['default_balloon_style'][$key][$direction_key]['avatar_name_position'];
			}

			$i = 1;
			while($i < 6 ):
				${'gradient_color_' . $i . '_value'} = '';
				if(isset($load_setting['custom_balloon'][$key][$direction_key]['gradient_color_'.$i ])) {
					${'gradient_color_' . $i . '_value'} = $load_setting['custom_balloon'][$key][$direction_key]['gradient_color_'.$i];
				}
				if(${'gradient_color_' . $i . '_value'} === ''){
					${'gradient_color_' . $i . '_value'} = $load_setting['default_balloon_style'][$key][$direction_key]['gradient_color_'.$i];
				}

				$gradient_color_value .= ' data-gradient_color_'.$i.'_value="'.esc_attr( ${'gradient_color_' . $i . '_value'} ).'"';
				++$i;
			endwhile;

			?>
			<input id="custom_balloon_<?php echo $key.'_'.$direction_key; ?>" type="hidden" name="custom_balloon_<?php echo $key.'_'.$direction_key; ?>" data-color_value="<?php echo esc_attr( $color_value ); ?>" data-background_value="<?php echo esc_attr( $background_value ); ?>" data-border_color_value="<?php echo esc_attr( $border_color_value ); ?>" data-border_style_value="<?php echo esc_attr( $border_style_value ); ?>" data-border_width_value="<?php echo esc_attr( $border_width_value ); ?>" data-border_radius_value="<?php echo esc_attr( $border_radius_value ); ?>" data-balloon_shadow_color_value="<?php echo esc_attr( $balloon_shadow_color_value ); ?>" data-avatar_name_position_value="<?php echo esc_attr( $avatar_name_position_value ); ?>" <?php echo $gradient_color_value; ?>/>
			<?php
		endforeach;

	endforeach;

}

