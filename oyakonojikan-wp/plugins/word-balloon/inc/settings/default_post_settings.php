<?php
defined( 'ABSPATH' ) || exit;


function word_balloon_default_post_settings(){

	return array(
		'avatar_custom_size' => array(
			'S' => 64,
			'M' => 96,
			'L' => 128,
		),
		'icon_custom_size' => array(
			'S' => 30,
			'M' => 40,
			'L' => 50,
		),
		'name_font_size' => 10,
		'amp_enable' => 'false',
		'amp_balloon_base' => 'talk',
		'amp_balloon_think' => 'think',
		'amp_balloon_3' => 'none',
		'amp_balloon_4' => 'none',
		'amp_balloon_5' => 'none',
		'inview' => 'true',
		'fade_balloon' => 'slide_in',
		//'box_margin' => 'false',
		'is_mobile' => false,
		'is_under' => false,
		'is_over' => false,
		'box_margin_require' => 'false',
	);

}


