<?php
require_once WA_MESSAGE_PATH . 'lib/wa/message-query.php';

$message_query = new WA_Message_Query( array(
	'per_page' => 20,
	'offset'   => 0,
	'user_id'  => get_current_user_id()
) );

$messages    = $message_query->get_results();
$total_count = $message_query->get_total_count();
$total_pages = $message_query->get_total_pages();

return compact( 'messages', 'total_count', 'total_pages' );