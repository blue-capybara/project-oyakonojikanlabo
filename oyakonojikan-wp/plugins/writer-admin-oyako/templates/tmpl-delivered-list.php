<?php
/**
 * Template Name: 請求可能記事一覧
 */
?>
<?php include WA_TMPL_PATH . 'element/header-content.php' ?>
	<!-- Content Header (Page header) -->
	<section class="content-header">
		<h1><i class="fa fa-bars"></i> 請求可能記事一覧</h1>
	</section>
	<!-- Main content -->
	<section class="content container-fluid">
		<div class="row">
			<div class="col-xs-12">
				<div class="box box-primary">
					<?php
					$not_billed_posts = WA_Oyako_Post::get_not_billed_posts( array(
						'author'         => get_current_user_id(),
						'posts_per_page' => - 1,
					) );

					if ( $not_billed_posts ) {
						$not_billed_amount = 0;
						?>
						<div class="box-body no-padding">
							<table id="example1" class="table table-bordered table-striped">
								<colgroup>
									<col>
									<col width="25%">
								</colgroup>
								<thead>
								<tr>
									<th>タイトル</th>
									<th>金額</th>
								</tr>
								</thead>
								<tbody>
								<?php
								foreach ( $not_billed_posts as $not_billed_post ) {
									$unit_price = WA_Oyako_Post::get_unit_price( $not_billed_post->ID );
									?>
									<tr>
										<td>
											<?php
											if ( $not_billed_post->post_status === 'publish' ) {
												?>
												<?php echo get_the_title( $not_billed_post ) ?: '（タイトル無し）' ?>&nbsp;&nbsp;
												<small><a href="<?php echo get_permalink() ?>" target="_blank"><i class="fa fa-external-link"></i> 公開URL</a></small>
												<?php
											} else {
												echo get_the_title( $not_billed_post ) ?: '（タイトル無し）';
											}
											?>
											<div class="m-t-xs-1 m-t-sm-1 visible-xs visible-sm">
												<small></small>
											</div>
										</td>
										<td><?php echo number_format_i18n( $unit_price ) ?> 円</td>
									</tr>
									<?php
									$not_billed_amount += $unit_price;
								}
								?>
								<tr>
									<td class="text-right">合計</td>
									<td><?php echo number_format_i18n( $not_billed_amount ) ?> 円</td>
								</tr>
							</table>
						</div>
						<!-- /.box-body -->
						<div class="box-footer clearfix">
							<?php
							$min_billed_amount = (int) get_user_meta( get_current_user_id(), 'wa_min_billed_amount', true );

							if ( $min_billed_amount <= 0 ) {
								?>
								<div class="alert alert-danger m-b-xs-0">
									<i class="fa fa-exclamation-triangle"></i> 請求可能金額が設定されていません。管理者に連絡をして下さい。
								</div>
								<?php
							} else if ( $not_billed_amount >= $min_billed_amount ) {
								?>
								<a href="<?php echo add_query_arg( 'do_billing', 1 ) ?>" class="btn btn-primary pull-right"><i class="fa fa-usd"></i> 上記金額を請求する</a>
								<?php
							} else {
								?>
								<div class="alert alert-danger m-b-xs-0">
									<i class="fa fa-exclamation-triangle"></i> 請求可能金額 <?php echo number_format_i18n( $min_billed_amount ) ?> 円に達していませんので、請求を行うことは出来ません。
								</div>
								<?php
							}
							?>
						</div>
						<?php
					} else {
						?>
						<div class="box-body ">
							<div class="text-center">請求可能な記事がありません。</div>
						</div>
						<?php
					}
					?>
				</div>
				<!-- /.box -->
			</div>
		</div>
	</section>
	<!-- /.content -->
<?php include WA_TMPL_PATH . 'element/footer-content.php' ?>