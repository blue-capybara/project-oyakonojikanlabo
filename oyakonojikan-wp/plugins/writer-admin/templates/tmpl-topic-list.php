<?php
/**
 * Template Name: お知らせ一覧
 */
?>
<?php include WA_TMPL_PATH . 'element/header-content.php' ?>
	<!-- Content Header (Page header) -->
	<section class="content-header">
		<h1><i class="fa fa-comment-o"></i> お知らせ</h1>
	</section>
	<!-- Main content -->
	<section class="content container-fluid">
		<div class="row">
			<div class="col-xs-12">
				<div class="box box-primary">
					<?php
					global $wp_query, $post;

					$wp_query = new WP_Query( array(
						'ignore_sticky_posts' => true,
						'post_type'           => 'wa_topic',
						'posts_per_page'      => 20,
						'post_status'         => 'publish',
						'paged'               => max( 1, get_query_var( 'paged' ) )
					) );

					if ( have_posts() ) {
						?>
						<div class="box-body no-padding">
							<table id="example1" class="table table-bordered table-striped">
								<colgroup>
									<col>
									<col width="25%" class="hidden-xs hidden-sm">
								</colgroup>
								<thead>
								<tr>
									<th>タイトル</th>
									<th class="hidden-xs hidden-sm text-center">更新日</th>
								</tr>
								</thead>
								<tbody>
								<?php
								while ( have_posts() ) {
									the_post();
									?>
									<tr>
										<td><a href="<?php echo add_query_arg( 'id', $post->ID, WA_View::get_link( 'topic_view' ) ) ?>"><?php echo get_the_title() ?: '（タイトル無し）' ?></a></td>
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
							<div class="text-center">お知らせがありません。</div>
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