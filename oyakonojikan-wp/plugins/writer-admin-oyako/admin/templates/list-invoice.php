<div id="wa" class="wrap">
	<h1 class="wp-heading-inline">請求書</h1>
	<hr class="wp-header-end">
	<?php settings_errors() ?>
	<?php
	require_once WA_OYAKO_PATH . 'lib/wa/oyako/invoice-list-table.php';
	$table = new WA_Oyako_Invoice_List_Table();
	$table->prepare_items();
	$table->display();
	?>
</div>