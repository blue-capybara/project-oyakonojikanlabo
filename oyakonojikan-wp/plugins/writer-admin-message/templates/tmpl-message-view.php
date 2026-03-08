<?php
/**
 * Template Name: メッセージ閲覧
 */
?>
<?php include WA_TMPL_PATH . 'element/header-content.php' ?>
<!-- Content Header (Page header) -->
<section class="content-header">
	<h1><i class="fa fa-envelope-o"></i> メッセージ <a href="<?php echo add_query_arg( 'tree_id', $tree_id, WA_View::get_link( 'message_compose' ) ) ?>" class="btn btn-primary btn-xs">このスレッドに返信</a></h1>
</section>
<!-- Main content -->
<section class="content">
	<div class="row">
		<div class="col-md-12">
			<?php
			if ( filter_input( INPUT_GET, 'updated' ) ) {
				?>
				<div class="alert alert-success alert-dismissible">
					<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
					メッセージを送信しました。
				</div>
				<?php
			}
			?>
			<?php
			foreach ( $messages as $i => $message ) {
				?>
				<div class="box box-wa-mailbox <?php echo ( $i === 0 ) ? 'box-primary' : '' ?> <?php echo ( $i > 2 ) ? 'box-collapsed' : '' ?>">
					<div class="box-body no-padding">
						<div class="mailbox-read-info mailbox-toggle">
							<?php
							if ( $i === 0 ) {
								?>
								<h3><?php echo get_the_title( $message ) ?></h3>
								<?php
							}
							?>
							<h5>
								<?php
								if ( get_post_meta( $message->ID, 'to_admin', true ) ) {
									?>
									<strong><span class="fa fa-user"></span> <?php echo WA_User::get_name( $message->post_author ) ?></strong>&nbsp;&nbsp;→&nbsp;&nbsp;管理者
									<?php
								} else {
									?>
									管理者&nbsp;&nbsp;→&nbsp;&nbsp;<strong><span class="fa fa-user"></span> <?php echo WA_User::get_name( $message->post_author ) ?></strong>
									<?php
								}
								?>
								<span class="mailbox-read-time pull-right"><?php echo get_the_time( 'Y.m.d H:i:s', $message ) ?></span>
							</h5>
						</div>
						<div class="mailbox-read-message">
							<?php echo nl2br( $message->post_content ) ?>
						</div>
					</div>
					<!-- /.box-body -->
					<div class="box-footer">
						<div class="pull-right">
							<a href="<?php echo add_query_arg( 'id', $message->ID, WA_View::get_link( 'message_compose' ) ) ?>" class="btn btn-default"><i class="fa fa-share"></i> 返信する</a>
						</div>
					</div>
					<!-- /.box-footer -->
				</div>
				<!-- /. box -->
				<?php
			}
			?>
		</div>
		<!-- /.col -->
	</div>
	<!-- /.row -->
</section>
<!-- /.content -->
<?php
add_action( 'wa/footer', function () {
	?>
	<script>
		$(function () {
			$('.box-wa-mailbox').click(function () {
				$(this).toggleClass('box-collapsed');
			});

			$('.box-wa-mailbox a').click(function (e) {
				e.stopPropagation();
			});
		})
	</script>
	<?php
} );
?>
<?php include WA_TMPL_PATH . 'element/footer-content.php' ?>
