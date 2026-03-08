<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_default_balloon_style(){

	$default_property = array(
		'color' => '',
		'background' => '',
		'border_color' => '',
		'border_style' => '',
		'border_width' => '',
		'border_radius' => '',
		'balloon_shadow_color' => '',
		'gradient_color_1' => '',
		'gradient_color_2' => '',
		'gradient_color_3' => '',
		'gradient_color_4' => '',
		'gradient_color_5' => '',
		'avatar_name_position' => 'under_avatar',
	);

	$default_settings = array(
		'talk' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'think' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 34,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 34,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'line' => array(
			'L' => array(
				'background' => '#e6e5eb',
				'avatar_name_position' => 'on_balloon',
			),
			'R' => array(
				'background' => '#b1ed8b',
				'avatar_name_position' => 'on_balloon',
			),
		),
		'round' => array(
			'L' => array(
				'background' => '#f1f0f0',
				'border_style' => 'none',
				'border_width' => 1,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#ffffff',
				'background' => '#0084ff',
				'border_style' => 'none',
				'border_width' => 1,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'tail' => array(
			'L' => array(
				'color' => '#ffffff',
				'background' => '#e65687',
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#ffffff',
				'background' => '#43b66c',
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'bump' => array(
			'L' => array(
				'background' => '#fff6dc',
				'border_color' => '#ffbc00',
				'border_style' => 'solid',
				'border_width' => 2,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#ffffff',
				'background' => '#ac499c',
				'border_color' => '#ac499c',
				'border_style' => 'solid',
				'border_width' => 2,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'upper' => array(
			'L' => array(
				'background' => '#f6f2ef',
				'border_color' => '#9dd8cb',
				'border_style' => 'solid',
				'border_width' => 3,
				'border_radius' => 8,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'background' => '#f6f2ef',
				'border_color' => '#adebbe',
				'border_style' => 'solid',
				'border_width' => 3,
				'border_radius' => 8,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'lower' => array(
			'L' => array(
				'background' => '#f6f2ef',
				'border_color' => '#f39a45',
				'border_style' => 'solid',
				'border_width' => 3,
				'border_radius' => 8,
				'avatar_name_position' => 'side_avatar',
			),
			'R' => array(
				'background' => '#f6f2ef',
				'border_color' => '#f3eb5a',
				'border_style' => 'solid',
				'border_width' => 3,
				'border_radius' => 8,
				'avatar_name_position' => 'side_avatar',
			),
		),
		'soi' => array(
			'L' => array(
				'background' => '#e5e5ea',
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#ffffff',
				'background' => '#1d8efe',
				'avatar_name_position' => 'under_avatar',
			),
		),
		'rpg_1' => array(
			'L' => array(
				'color' => '#ffffff',
				'background' => '#000000',
				'border_color' => '#ffffff',
				'border_style' => 'solid',
				'border_width' => 2,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#ffffff',
				'background' => '#000000',
				'border_color' => '#ffffff',
				'border_style' => 'solid',
				'border_width' => 2,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'rpg_2' => array(
			'L' => array(
				'color' => '#ffffff',
				'border_style' => 'none',
				'border_color' => '#f7f8f4',
				'gradient_color_1' => '#4c59b7',
				'gradient_color_2' => '#171e79',
				'gradient_color_3' => '#03002d',
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#ffffff',
				'border_style' => 'none',
				'border_color' => '#f7f8f4',
				'gradient_color_1' => '#4c59b7',
				'gradient_color_2' => '#171e79',
				'gradient_color_3' => '#03002d',
				'avatar_name_position' => 'under_avatar',
			),
		),
		'rpg_3' => array(
			'L' => array(
				'color' => '#303020',
				'background' => '#d0c8a8',
				'border_color' => '#787868',
				'border_style' => 'solid',
				'border_width' => 1,
				'balloon_shadow_color' => '#202018',
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#303021',
				'background' => '#d0c8a9',
				'border_color' => '#787869',
				'border_style' => 'solid',
				'border_width' => 1,
				'balloon_shadow_color' => '#202019',
				'avatar_name_position' => 'under_avatar',
			),
		),
		'talk_2' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#000000',
				'border_style' => 'solid',
				'border_width' => 5,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#000000',
				'border_style' => 'solid',
				'border_width' => 5,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'bump_2' => array(
			'L' => array(
				'border_color' => '#86f3b2',
				'border_style' => 'solid',
				'border_width' => 2,
				'border_radius' => 10,
				'gradient_color_1' => '#ffffff',
				'gradient_color_2' => '#92ffbe',
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'border_color' => '#ffc355',
				'border_style' => 'solid',
				'border_width' => 2,
				'border_radius' => 10,
				'gradient_color_1' => '#ffffff',
				'gradient_color_2' => '#ffd255',
				'avatar_name_position' => 'under_avatar',
			),
		),
		'round_2' => array(
			'L' => array(
				'color' => '#222222',
				'border_style' => 'none',
				'border_width' => 1,
				'gradient_color_1' => '#ffffff',
				'gradient_color_2' => '#ffeed9',
				'gradient_color_3' => '#ff8100',
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'border_style' => 'none',
				'border_width' => 1,
				'gradient_color_1' => '#ffffff',
				'gradient_color_2' => '#dceeff',
				'gradient_color_3' => '#0084ff',
				'avatar_name_position' => 'under_avatar',
			),
		),
		'heart' => array(
			'L' => array(
				'border_color' => '#d169b8',
				'border_style' => 'solid',
				'border_width' => 15,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'border_color' => '#d169b8',
				'border_style' => 'solid',
				'border_width' => 15,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'wriggle' => array(
			'L' => array(
				'color'  => '#efefef',
				'border_width' => 32.5,
				'border_color' => '#0784AA',
				'border_style' => 'solid',
				'gradient_color_1' => '#0c90f2',
				'gradient_color_2' => '#4eabf1',
				'gradient_color_3' => '#86c3f0',
				'gradient_color_4' => '#b3d7ef',
				'gradient_color_5' => '#dfe8ed',
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color'  => '#ffe9e9',
				'border_width' => 32.5,
				'border_color' => '#bc358f',
				'border_style' => 'solid',
				'gradient_color_1' => '#ea619a',
				'gradient_color_2' => '#e985af',
				'gradient_color_3' => '#e8a9c4',
				'gradient_color_4' => '#e6cad6',
				'gradient_color_5' => '#e6e6e6',
				'avatar_name_position' => 'under_avatar',
			),
		),
		'freehand' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#000000',
				'border_style' => 'solid',
				'border_width' => 40,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#000000',
				'border_style' => 'solid',
				'border_width' => 40,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'pointy' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'8bit' => array(
			'L' => array(
				'background' => '',
				'border_color' => '',
				'border_style' => 'none',
				'border_width' => 1,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'background' => '',
				'border_color' => '',
				'border_style' => 'none',
				'border_width' => 1,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'8bit_2' => array(
			'L' => array(
				'background' => '',
				'border_color' => '',
				'border_style' => 'none',
				'border_width' => 1,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'background' => '',
				'border_color' => '',
				'border_style' => 'none',
				'border_width' => 1,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'tail_2' => array(
			'L' => array(
				'color' => '#ffffff',
				'background' => '#e65687',
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#ffffff',
				'background' => '#43b66c',
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'scream' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#222222',
				'border_style' => 'solid',
				'border_width' => 24,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#222222',
				'border_style' => 'solid',
				'border_width' => 24,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'talk_o' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'talk_u' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 10,
				'avatar_name_position' => 'side_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 10,
				'avatar_name_position' => 'side_avatar',
			),
		),
		'think_2' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#000000',
				'border_style' => 'solid',
				'border_width' => 24,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#000000',
				'border_style' => 'solid',
				'border_width' => 24,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'talk_oc' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'talk_uc' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 10,
				'avatar_name_position' => 'on_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#dddddd',
				'border_style' => 'solid',
				'border_width' => 1,
				'border_radius' => 10,
				'avatar_name_position' => 'on_avatar',
			),
		),
		'freehand_o' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#000000',
				'border_style' => 'solid',
				'border_width' => 40,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#000000',
				'border_style' => 'solid',
				'border_width' => 40,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'freehand_u' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#000000',
				'border_style' => 'solid',
				'border_width' => 40,
				'avatar_name_position' => 'side_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#000000',
				'border_style' => 'solid',
				'border_width' => 40,
				'avatar_name_position' => 'side_avatar',
			),
		),
		'tail_3' => array(
			'L' => array(
				'background' => '#ffffff',
				'border_color' => '#e65687',
				'border_style' => 'solid',
				'border_width' => 3,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'background' => '#ffffff',
				'border_color' => '#43b66c',
				'border_style' => 'solid',
				'border_width' => 3,
				'border_radius' => 10,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'twin_t' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#eeee22',
				'border_color' => '#f44336',
				'border_style' => 'solid',
				'border_width' => 3,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#eeee22',
				'border_color' => '#00bcd4',
				'border_style' => 'solid',
				'border_width' => 3,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'slash' => array(
			'L' => array(
				'border_color' => '#222222',
				'border_style' => 'solid',
				'border_width' => 24,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'border_color' => '#222222',
				'border_style' => 'solid',
				'border_width' => 24,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'slash_oc' => array(
			'L' => array(
				'border_color' => '#222222',
				'border_style' => 'solid',
				'border_width' => 24,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'border_color' => '#222222',
				'border_style' => 'solid',
				'border_width' => 24,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'slash_uc' => array(
			'L' => array(
				'border_color' => '#222222',
				'border_style' => 'solid',
				'border_width' => 24,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'border_color' => '#222222',
				'border_style' => 'solid',
				'border_width' => 24,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'geek' => array(
			'L' => array(
				'color' => '#ffffff',
				'background' => 'rgba(62,216,62,0.8)',
				'border_style' => 'none',
				'border_width' => 1,
				'border_radius' => 6,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#ffffff',
				'background' => 'rgba(0,255, 161,0.8)',
				'border_style' => 'none',
				'border_width' => 1,
				'border_radius' => 6,
				'avatar_name_position' => 'under_avatar',
			),
		),
		'think_3' => array(
			'L' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#000000',
				'border_style' => 'solid',
				'border_width' => 24,
				'avatar_name_position' => 'under_avatar',
			),
			'R' => array(
				'color' => '#222222',
				'background' => '#ffffff',
				'border_color' => '#000000',
				'border_style' => 'solid',
				'border_width' => 24,
				'avatar_name_position' => 'under_avatar',
			),
		),
	);

foreach ($default_settings as $balloon_type => $balloon_key) {


	foreach ($balloon_key as $balloon_side=> $balloon_property) {

		if ( empty($balloon_property) ) {
			$default_settings[$balloon_type][$balloon_side] = $default_property;
		}else{
			$difference = array_diff_key($default_property ,$balloon_property);

			$default_settings[$balloon_type][$balloon_side] = array_merge($default_settings[$balloon_type][$balloon_side],$difference);
		}
	}
}


return $default_settings;

}

