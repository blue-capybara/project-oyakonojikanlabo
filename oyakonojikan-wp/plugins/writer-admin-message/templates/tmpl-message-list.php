<?php
/**
 * Template Name: メッセージ一覧
 */
?>
<?php include WA_TMPL_PATH . 'element/header-content.php' ?>
<!-- Content Header (Page header) -->
<section class="content-header">
	<h1><i class="fa fa-envelope-o"></i> メッセージ <a href="<?php echo WA_View::get_link( 'message_compose' ) ?>" class="btn btn-primary btn-xs">新規作成</a></h1>
</section>
<!-- Main content -->
<section class="content container-fluid">
	<div class="box box-primary">
		<?php
		if ( $messages ) {
			?>
			<div class="box-header with-border mailbox-controls">
				<!-- /.btn-group -->
				<button type="button" class="btn btn-default btn-sm" onclick="location.reload();"><i class="fa fa-refresh"></i></button>
				<div class="pull-right">
					1-50/<?php echo $total_pages ?>
					<div class="btn-group">
						<button type="button" class="btn btn-default btn-sm"><i class="fa fa-chevron-left"></i></button>
						<button type="button" class="btn btn-default btn-sm"><i class="fa fa-chevron-right"></i></button>
					</div>
					<!-- /.btn-group -->
				</div>
				<!-- /.pull-right -->
			</div>
			<div class="box-body no-padding">
				<div class="table-responsive mailbox-messages">
					<table class="table table-striped">
						<colgroup>
							<col>
							<col width="20%">
							<col width="20%">
						</colgroup>
						<thead>
						<tr>
							<th>件名</th>
							<th>最終送信者</th>
							<th>日付</th>
						</tr>
						</thead>
						<tbody>
						<?php
						foreach ( $messages as $message ) {
							?>
							<tr>
								<td class="mailbox-subject">
									<?php
									if ( ! $message->user_read ) {
										?>
										<span class="badge bg-red margin-r-5">未読</span>
										<?php
									}
									?>
									<a href="<?php echo add_query_arg( 'id', $message->ID, WA_View::get_link( 'message_view' ) ) ?>"><?php echo get_the_title( $message ) ?></a>
									<span class="badge bg-blue pull-right"><?php echo $message->count ?></span>
								</td>
								<td class="mailbox-name"><?php echo WA_Message::to_admin( $message->ID ) ? '自分' : '管理者' ?></td>
								<td class="mailbox-date"><?php echo get_the_time( 'Y.m.d H:i:s', $message ) ?></td>
							</tr>
							<?php
						}
						?>
						</tbody>
					</table>
					<!-- /.table -->
				</div>
				<!-- /.mail-box-messages -->
			</div>
			<!-- /.box-body -->
			<div class="box-footer no-padding">
				<div class="mailbox-controls">
					<!-- /.btn-group -->
					<button type="button" class="btn btn-default btn-sm" onclick="location.reload();"><i class="fa fa-refresh"></i></button>
					<div class="pull-right">
						1-50/<?php echo $total_pages ?>
						<div class="btn-group">
							<button type="button" class="btn btn-default btn-sm"><i class="fa fa-chevron-left"></i></button>
							<button type="button" class="btn btn-default btn-sm"><i class="fa fa-chevron-right"></i></button>
						</div>
						<!-- /.btn-group -->
					</div>
					<!-- /.pull-right -->
				</div>
			</div>
			<?php
		} else {
			?>
			<div class="box-body">
				<div class="text-center">メッセージがありません。</div>
			</div>
			<?php
		}
		?>
	</div>
</section>
<?php include WA_TMPL_PATH . 'element/footer-content.php' ?>
