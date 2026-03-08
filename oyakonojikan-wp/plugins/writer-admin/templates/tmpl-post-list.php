<?php
/**
 * Template Name: 記事一覧
 */
?>
<?php include WA_TMPL_PATH . 'element/header-content.php' ?>
	<!-- Content Header (Page header) -->
	<section class="content-header">
		<h1><i class="fa fa-bars"></i> 記事 <a href="<?php echo WA_View::get_link( 'post_edit' ) ?>" class="btn btn-primary btn-xs">新規作成</a></h1>
	</section>
	<!-- Main content -->
	<section class="content container-fluid">
		<div class="row">
			<div class="col-xs-12">
				<?php
				if ( filter_input( INPUT_GET, 'deleted' ) ) {
					?>
					<div class="alert alert-success alert-dismissible">
						<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
						記事を削除しました。
					</div>
					<?php
				}
				?>
				<?php
				if ( filter_input( INPUT_GET, 'updated_pending' ) ) {
					?>
					<div class="alert alert-success alert-dismissible">
						<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
						記事を納品申請しました。
					</div>
					<?php
				}
				?>
				<div class="box box-primary">
					<?php
					global $wp_query, $post;

					$wp_query = new WP_Query( array(
						'ignore_sticky_posts' => true,
						'post_type'           => WA::get_config( 'post_type' ),
						'author'              => get_current_user_id(),
						'posts_per_page'      => 20,
						'post_status'         => 'any',
						'paged'               => max( 1, get_query_var( 'paged' ) )
					) );

					if ( have_posts() ) {
						?>
						<div class="box-body no-padding">
							<table id="example1" class="table table-bordered table-striped">
								<colgroup>
									<col>
									<col width="15%" class="hidden-xs hidden-sm">
									<col width="25%" class="hidden-xs hidden-sm">
								</colgroup>
								<thead>
								<tr>
									<th>タイトル</th>
									<th class="hidden-xs hidden-sm text-center">ステータス</th>
									<th class="hidden-xs hidden-sm text-center">更新日</th>
								</tr>
								</thead>
								<tbody>
								<?php
								while ( have_posts() ) {
									the_post();
									?>
									<tr>
										<td>
											<?php
											if ( WA_Post::is_not_editable( $post ) ) {
												echo get_the_title() ?: '（タイトル無し）';

											} else {
												?>
												<a href="<?php echo add_query_arg( 'id', $post->ID, WA_View::get_link( 'post_edit' ) ) ?>"><?php echo get_the_title() ?: '（タイトル無し）' ?></a>
												<?php
											}

											if ( $post->post_status === 'publish' ) {
												?>
												<small><a href="<?php echo get_permalink() ?>" target="_blank"><i class="fa fa-external-link"></i> 公開URL</a></small>
												<?php
											}
											?>
											<div class="m-t-xs-1 m-t-sm-1 visible-xs visible-sm">
												<small><?php echo WA_View::get_post_status( $post ) ?>&nbsp;&nbsp;<span class="text-muted"><i class="fa fa-clock-o"></i> <?php echo get_the_time( 'Y.m.d H:i:s' ) ?></span></small>
											</div>
										</td>
										<td class="hidden-xs hidden-sm text-center"><?php echo WA_View::get_post_status( $post ) ?></td>
										<td class="hidden-xs hidden-sm text-center"><i class="fa fa-clock-o"></i> <?php echo get_the_time( 'Y.m.d H:i:s' ) ?></td>
									</tr>
									<?php
								}
								?>
							</table>
						</div>
						<!-- /.box-body -->
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
							<div class="text-center">記事がありません。</div>
						</div>
						<?php
					}
					?>
					<?php wp_reset_query() ?>
				</div>
				<!-- /.box -->
			</div>
		</div>
	</section>
	<!-- /.content -->
<?php include WA_TMPL_PATH . 'element/footer-content.php' ?>