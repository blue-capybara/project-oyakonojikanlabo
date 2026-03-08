<?php
/**
 * Template Name: 請求書一覧
 */
?>
<?php include WA_TMPL_PATH . 'element/header-content.php' ?>
	<!-- Content Header (Page header) -->
	<section class="content-header">
		<h1><i class="fa fa-bars"></i> 請求書一覧</h1>
	</section>
	<!-- Main content -->
	<section class="content container-fluid">
		<div class="row">
			<div class="col-xs-12">
				<?php
				if ( filter_input( INPUT_GET, 'saved' ) ) {
					?>
					<div class="alert alert-success alert-dismissible">
						<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
						請求書を作成しました。
					</div>
					<?php
				}
				?>
				<div class="box box-primary">
					<?php
					global $post, $wp_query;

					$wp_query = new WP_Query( array(
						'post_type' => 'wa_invoice',
						'author'    => get_current_user_id(),
						'paged'     => max( 1, get_query_var( 'paged' ) )
					) );

					if ( have_posts() ) {
						?>
						<div class="box-body no-padding">
							<table id="example1" class="table table-bordered table-striped">
								<colgroup>
									<col>
									<col width="15%">
									<col width="25%">
								</colgroup>
								<thead>
								<tr>
									<th>タイトル</th>
									<th class="hidden-xs hidden-sm">ステータス</th>
									<th>金額</th>
								</tr>
								</thead>
								<tbody>
								<?php
								while ( have_posts() ) {
									the_post();
									$billed_posts  = get_post_meta( $post->ID, 'billed_posts', true );
									$billed_amount = $billed_posts ? array_sum( wp_list_pluck( $billed_posts, 'amount' ) ) : 0;
									?>
									<tr>
										<td><?php echo get_the_title( $post ) ?> - <?php echo count( $billed_posts ) ?>件</td>
										<td>
											<?php
											if ( get_post_meta( $post->ID, 'wa_payed', true ) ) {
												?>
												<span class="badge badge-olive">支払い済み</span>
												<?php
											} else {
												?>
												<span class="badge badge-gray">未払い</span>
												<?php
											}
											?>
										</td>
										<td><?php echo number_format_i18n( $billed_amount ) ?> 円</td>
									</tr>
									<?php
								}
								?>
							</table>
						</div>
						<?php
						if ( $wp_query->max_num_pages > 1 ) {
							?>
							<div class="box-footer">
								<div class="box-tools">
									<?php echo WA_View::get_pager( null, null, 5, 'pagination-sm no-margin pull-right' ) ?>
								</div>
							</div>
							<?php
						}
						?>
						<?php
					} else {
						?>
						<div class="box-body">
							<div class="text-center">請求書がありません。</div>
						</div>
						<?php
					}
					?>
					<?php wp_reset_query() ?>
					<!-- /.box-body -->
				</div>
				<!-- /.box -->
			</div>
		</div>
	</section>
	<!-- /.content -->
<?php include WA_TMPL_PATH . 'element/footer-content.php' ?>