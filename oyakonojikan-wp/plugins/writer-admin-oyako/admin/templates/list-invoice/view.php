<div id="wa" class="wrap">
	<h1 class="wp-heading-inline">請求書</h1>
	<hr class="wp-header-end">
	<?php settings_errors() ?>
	<table class="wp-list-table widefat fixed striped" style="margin-top: 15px">
		<thead>
		<tr>
			<th scope="col" id="wa_invoice_title" class="manage-column column-wa_invoice_title column-primary">タイトル</th>
			<th scope="col" id="wa_invoice_amount" class="manage-column column-wa_invoice_amount">金額</th>
		</tr>
		</thead>
		<tbody id="the-list">
		<?php
		$total_billed = 0;

		foreach ( $billed_posts as $billed_post ) {
			$total_billed += $billed_post['amount'];
			?>
			<tr>
				<td class="wa_invoice_date column-wa_invoice_title column-primary" data-colname="タイトル">
					<a href="<?php echo add_query_arg( array( 'post' => $billed_post['id'], 'action' => 'edit' ), admin_url( 'post.php' ) ) ?>"><?php echo $billed_post['title'] ?></a>
					<button type="button" class="toggle-row"><span class="screen-reader-text">詳細を追加表示</span></button>
					<button type="button" class="toggle-row"><span class="screen-reader-text">詳細を追加表示</span></button>
				</td>
				<td class="wa_invoice_amount column-wa_invoice_amount" data-colname="金額"><?php echo $billed_post['amount'] ? number_format_i18n( $billed_post['amount'] ) : '-' ?> 円</td>
			</tr>
			<?php
		}
		?>
		</tbody>
	</table>
	<div class="wa-invoice-footer">
		<div class="wa-invoice-total">
			合計 <span class="wa-invoice-total__amount"><?php echo number_format_i18n( $total_billed ) ?>円</span><span class="wa-invoice-total__tax">（外税 <?php echo number_format_i18n( round( $total_billed * 0.08 ) ) ?>円）</span>
		</div>
		<div class="wa-invoice-action">
			<button type="submit" class="button button-primary">支払い済みにする</button>
			<a href="" class="button">一覧に戻る</a>
		</div>
	</div>
</div>