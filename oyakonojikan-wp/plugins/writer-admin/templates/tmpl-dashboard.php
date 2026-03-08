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
		<div class="col-md-6 col-sm-12 col-xs-12">
			<div class="info-box">
				<span class="info-box-icon bg-aqua"><i class="fa fa-cloud"></i></span>
				<div class="info-box-content">
					<span class="info-box-text">納品済み記事数</span>
					<span class="info-box-number">1
						<small>記事</small>
					</span>
				</div>
			</div>
		</div>
		<!-- /.col -->
		<div class="col-md-6 col-sm-12 col-xs-12">
			<div class="info-box">
				<span class="info-box-icon bg-red"><i class="fa fa-cloud-upload"></i></span>
				<div class="info-box-content">
					<span class="info-box-text">下書き記事数</span>
					<span class="info-box-number">1
						<small>記事</small>
					</span>
				</div>
			</div>
		</div>
		<!-- /.col -->
	</div>
	<!-- /.row -->
</section>
<!-- /.content -->
<?php include WA_TMPL_PATH . 'element/footer-content.php' ?>
