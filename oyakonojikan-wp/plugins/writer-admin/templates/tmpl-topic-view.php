<?php
/**
 * Template Name: お知らせ閲覧
 */
?>
<?php include WA_TMPL_PATH . 'element/header-content.php' ?>
<!-- Content Header (Page header) -->
<section class="content-header">
	<h1><i class="fa fa-comment-o"></i> お知らせ</h1>
</section>
<!-- Main content -->
<section class="content">
	<div class="row">
		<div class="col-md-12">
			<div class="box box-primary">
				<div class="box-body no-padding">
					<div class="mailbox-read-info clearfix">
						<h3><?php echo get_the_title( $topic ) ?></h3>
						<h5><span class="mailbox-read-time pull-right"><?php echo get_the_time( 'Y.m.d H:i:s', $topic ) ?></span></h5>
					</div>
					<div class="mailbox-read-message">
						<?php echo apply_filters( 'the_content', $topic->post_content ) ?>
					</div>
				</div>
			</div>
			<!-- /. box -->
		</div>
		<!-- /.col -->
	</div>
	<!-- /.row -->
</section>
<?php include WA_TMPL_PATH . 'element/footer-content.php' ?>
