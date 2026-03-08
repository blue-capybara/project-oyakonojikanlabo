<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_default_admin_settings(){

	require_once WORD_BALLOON_DIR . 'inc/settings/default_balloon_style.php';
	require_once WORD_BALLOON_DIR . 'inc/settings/default_icon_style.php';

	return array(
		'avatar_size' => 'M',
		'avatar_position' => 'L',
		'avatar_border_radius' => 'true',
		'avatar_border' => 'false',
		'custom_avatar_border' => array(
			'L' => array(2,'solid','#dddddd'),
			'R' => array(2,'solid','#dddddd'),
		),
		'avatar_shadow' => 'false',
		'avatar_hide' => 'false',
		'custom_avatar_shadow' => array(
			'L1' => array(2,2,3,0,'#888888'),
			'L2' => array(0,0,0,0,'#888888'),
			'R1' => array(-2,2,3,0,'#888888'),
			'R2' => array(0,0,0,0,'#888888'),
		),



		'box_center' => 'false',
		'box_margin' => 'false',

		'choice_balloon' => 'talk',
		'balloon_shadow' => 'true',
		'balloon_drop_shadow' => 'false',
		'custom_balloon_shadow' => array(
			'L1' => array(2,2,3,0,'#888888'),
			'L2' => array(0,0,0,0,'#888888'),
			'R1' => array(-2,2,3,0,'#888888'),
			'R2' => array(0,0,0,0,'#888888'),
		),
		'balloon_drop_shadow' => 'false',
		'balloon_box_drop_shadow' => 'false',
		'custom_balloon_drop_shadow' => array(
			'L' => array(3,2,2,'rgba(136, 136, 136, 0.4)'),
			'R' => array(-3,2,2,'rgba(136, 136, 136, 0.4)'),
		),
		'balloon_full_width' => 'false',
		'balloon_vertical_writing' => 'false',
		'balloon_hide' => 'false',

		'inview_once' => 'false',

		'quote_effect_minimum' => 'false',
		'quote_effect_speed' => 90,

		'font_size' => '',
		'text_align' => 'L',
		'custom_balloon' => array(),
		'default_balloon_style' => word_balloon_default_balloon_style(),

		//'name_position' => 'under_avatar',
		'name_color' => '',
		'name_font_family' => '',
		'icon_size' => 'M',
		'default_icon' => word_balloon_default_icon_style(),
		'custom_icon' => array(),

		'template' => array(),


		'panel_type_hidden' => array(
			'avatar' => 'true',
			'balloon' => 'true',
			'icon' => 'true',
			'effect' => 'true',
			'filter' => 'true',
			'name' => 'true',
			'status' => 'true',
			'mobile' => 'true',
			'in_view' => 'true',
			'wallpaper' => 'true',
			'side_by_side' => 'true',
		),

		'disable_balloon' => array(),
		'disable_icon' => array(),
		'disable_effect' => array(),
		'disable_filter' => array(),

		'avatar_priority' => 'false',
		'keep_mystery_men' => 'false',
		'max_favorite' => 50,
		'max_wallpaper' => 5,
		'max_template' => 5,
		'max_avatar_dimensions' => 512,

		'status_color' => '',
		'enable_sound' => 'true',

		'side_by_side' => 'false',
		'side_by_side_position' => 'space-between',
		'side_by_side_wrap' => 'false',

		'enable_wallpaper' => 'false',

		'balloon_m' => '',
		'avatar_size_m' => '',
		'name_position_m' => '',
		'font_size_m' => '',

		'open_button' => 'false',

		'innerblocks_mode' => 'false',

	);

}


