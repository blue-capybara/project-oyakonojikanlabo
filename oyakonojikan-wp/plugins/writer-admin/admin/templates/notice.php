<div id="wa" class="wrap">
	<h1>全体通知</h1>
	<?php settings_errors() ?>
	<form method="post" action="">
		<?php wp_nonce_field( 'wa_notice' ) ?>
		<table class="form-table">
			<tr>
				<th scope="row"><label>通知テキスト</label></th>
				<td>
					<?php echo $val->form_field( 'notice', 'textarea', null, array( 'rows' => 10, 'style' => 'width: 100%;' ) ) ?>
					<?php echo $val->error( 'notice' ) ?>
				</td>
			</tr>
			<tr>
				<th scope="row"><label>通知背景色</label></th>
				<td>
					<?php echo $val->form_field( 'notice_color' ) ?>
					<?php echo $val->error( 'notice_color' ) ?>
				</td>
			</tr>
		</table>
		<?php submit_button( '更新する' ) ?>
	</form>
</div>