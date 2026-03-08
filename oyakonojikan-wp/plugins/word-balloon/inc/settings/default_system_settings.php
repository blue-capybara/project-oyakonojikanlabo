<?php
defined( 'ABSPATH' ) || exit;


function word_balloon_default_system_settings(){

	return array(
		'delete_db' => 'true',
		'delete_option' => 'true',
		'delete_pro_option' => 'true',
		'capability_post' => 'author',
		'capability_edit_avatar' => 'administrator',
		'capability_edit_various' => 'administrator',
		'capability_edit_favorite' => 'administrator',
	);

}


