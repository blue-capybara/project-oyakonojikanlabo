<?php
/**
 * Template Name: ダッシュボード
 */
?>
<?php include WA_TMPL_PATH . 'element/header-content.php' ?>
<!-- Content Header (Page header) -->
<section class="content-header">
	<h1><i class="fa fa-tachometer"></i> ダッシュボード</h1>
</section>
<!-- Main content -->
<section class="content container-fluid">
	<?php
	$notice = WA::get_option( 'notice' );
	$color  = WA::get_option( 'notice_color' ) ?: 'info';

	if ( $notice ) {
		?>
		<div class="callout callout-<?php echo $color ?>">
			<?php echo nl2br( $notice ) ?>
		</div>
		<?php
	}
	?>
	<div class="row">
		<div class="col-md-4 col-sm-12 col-xs-12">
			<div class="info-box">
				<span class="info-box-icon bg-aqua"><i class="fa fa-cloud"></i></span>
				<div class="info-box-content">
					<span class="info-box-text">未請求記事数</span>
					<span class="info-box-number">
						<?php echo WA_Post::get_delivered_post_count( get_current_user_id() ) - WA_Oyako_Post::get_billed_post_count( get_current_user_id() ) ?>
						<small>記事</small>
					</span>
				</div>
			</div>
		</div>
		<!-- /.col -->
		<div class="col-md-4 col-sm-12 col-xs-12">
			<div class="info-box">
				<span class="info-box-icon bg-red"><i class="fa fa-cloud-upload"></i></span>
				<div class="info-box-content">
					<span class="info-box-text">請求済み記事数</span>
					<span class="info-box-number">
						<?php echo WA_Oyako_Post::get_billed_post_count( get_current_user_id() ) ?>
						<small>記事</small>
					</span>
				</div>
			</div>
		</div>
		<!-- /.col -->
		<div class="col-md-4 col-sm-12 col-xs-12">
			<div class="info-box">
				<span class="info-box-icon bg-green"><i class="fa fa-usd"></i></span>
				<div class="info-box-content">
					<span class="info-box-text">総合計請求額</span>
					<span class="info-box-number">
						<?php echo WA_Oyako_User::get_payed_amount( get_current_user_id() ) ?>
						<small>円</small>
					</span>
				</div>
			</div>
		</div>
	</div>
	<!-- /.row -->
</section>
<!-- /.content -->
<?php include WA_TMPL_PATH . 'element/footer-content.php' ?>
