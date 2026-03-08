<?php
/**
 * Template Name: メッセージ新規作成
 */
?>
<?php include WA_TMPL_PATH . 'element/header-content.php' ?>
<!-- Content Header (Page header) -->
<section class="content-header">
	<h1><i class="fa fa-envelope-o"></i> メッセージ</h1>
</section>
<!-- Main content -->
<section class="content">
	<div class="row">
		<div class="col-md-12">
			<?php
			if ( $reply_message ) {
				?>
				<div class="box box-wa-mailbox box-primary box-collapsed">
					<div class="box-body no-padding">
						<div class="mailbox-read-info mailbox-toggle">
							<h3><?php echo get_the_title( $reply_message ) ?></h3>
							<h5>
								<?php
								if ( get_post_meta( $reply_message->ID, 'to_admin', true ) ) {
									?>
									<strong><span class="fa fa-user"></span> <?php echo WA_User::get_name( $reply_message->post_author ) ?></strong>&nbsp;&nbsp;→&nbsp;&nbsp;管理者
									<?php
								} else {
									?>
									管理者&nbsp;&nbsp;→&nbsp;&nbsp;<strong><span class="fa fa-user"></span> <?php echo WA_User::get_name( $reply_message->post_author ) ?></strong>
									<?php
								}
								?>
								<span class="mailbox-read-time pull-right"><?php echo get_the_time( 'Y.m.d H:i:s', $reply_message ) ?></span>
							</h5>
						</div>
						<div class="mailbox-read-message">
							<?php echo nl2br( $reply_message->post_content ) ?>
						</div>
					</div>
					<!-- /.box-body -->
				</div>
				<!-- /. box -->
				<?php
			}
			?>
			<?php
			if ( $root_message ) {
				?>
				<div class="box box-wa-mailbox box-primary box-collapsed">
					<div class="box-body no-padding">
						<div class="mailbox-read-info mailbox-toggle">
							<h3><?php echo get_the_title( $root_message ) ?></h3>
							<h5>
								<?php
								if ( get_post_meta( $root_message->ID, 'to_admin', true ) ) {
									?>
									<strong><span class="fa fa-user"></span> <?php echo WA_User::get_name( $root_message->post_author ) ?></strong>&nbsp;&nbsp;→&nbsp;&nbsp;管理者
									<?php
								} else {
									?>
									管理者&nbsp;&nbsp;→&nbsp;&nbsp;<strong><span class="fa fa-user"></span> <?php echo WA_User::get_name( $root_message->post_author ) ?></strong>
									<?php
								}
								?>
								<span class="mailbox-read-time pull-right"><?php echo get_the_time( 'Y.m.d H:i:s', $root_message ) ?></span>
							</h5>
						</div>
						<div class="mailbox-read-message">
							<?php echo nl2br( $root_message->post_content ) ?>
						</div>
					</div>
					<!-- /.box-body -->
				</div>
				<!-- /. box -->
				<?php
			}
			?>
			<form action="" method="post">
				<?php echo IWF_Token::hidden_field( 'wa_message_compose' ) ?>
				<div class="box box-primary">
					<div class="box-header with-border">
						<h3 class="box-title"><?php echo ! $reply_message && ! $root_message ? '新規メッセージ' : '返信メッセージ' ?></h3>
					</div>
					<!-- /.box-header -->
					<div class="box-body">
						<?php
						if ( ! $reply_message && ! $root_message ) {
							?>
							<div class="form-group">
								<?php echo $val->form_field( 'title', 'text', null, array( 'placeholder' => '件名を入力', 'class' => 'form-control' ) ) ?>
								<?php echo $val->error( 'title' ) ?>
							</div>
							<?php
						}
						?>
						<div class="form-group">
							<?php echo $val->form_field( 'content', 'textarea', null, array( 'class' => 'form-control', 'style' => 'height: 400px;' ) ) ?>
							<?php echo $val->error( 'content' ) ?>
						</div>
					</div>
					<!-- /.box-body -->
					<div class="box-footer">
						<div class="pull-right">
							<button type="submit" class="btn btn-primary"><i class="fa fa-envelope-o"></i> 送信する</button>
						</div>
					</div>
					<!-- /.box-footer -->
				</div>
				<!-- /. box -->
			</form>
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
