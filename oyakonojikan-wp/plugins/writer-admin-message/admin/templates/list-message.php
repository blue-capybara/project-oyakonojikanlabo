<div id="wa" class="wrap">
	<h1 class="wp-heading-inline">メッセージ</h1>
	<a href="<?php echo add_query_arg( array( 'action' => 'compose' ) ) ?>" class="page-title-action">新規追加</a>
	<hr class="wp-header-end">
	<?php settings_errors() ?>
	<?php
	require_once WA_MESSAGE_PATH . 'lib/wa/message-list-table.php';
	$table = new WA_Message_List_Table();
	$table->prepare_items();
	$table->display();
	?>
</div>