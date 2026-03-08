<?php
/**
 * Template Name: 記事作成・編集
 */
?>
<?php include WA_TMPL_PATH . 'element/header-content.php' ?>
<!-- Content Header (Page header) -->
<section class="content-header">
	<h1><i class="fa fa-bars"></i> 記事</h1>
</section>
<!-- Main content -->
<section class="content container-fluid">
	<form role="form" action="" method="post" enctype="multipart/form-data">
		<?php echo IWF_Token::hidden_field( 'post' ) ?>
		<div class="row">
			<div class="col-xs-12">
				<?php
				if ( $val->error() ) {
					?>
					<div class="alert alert-danger alert-dismissible">
						<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
						入力内容にエラーが存在します。
					</div>
					<?php
				}
				?>
				<?php
				if ( filter_input( INPUT_GET, 'updated_draft' ) ) {
					?>
					<div class="alert alert-success alert-dismissible">
						<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
						下書きで保存しました。
					</div>
					<?php
				}
				?>
				<?php
				if ( filter_input( INPUT_GET, 'updated_preview' ) ) {
					?>
					<div class="alert alert-success alert-dismissible">
						<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
						下書きで保存しました。
					</div>
					<?php
				}
				?>
				<div class="box box-primary">
					<div class="box-header with-border">
						<h3 class="box-title">新規投稿</h3>
					</div>
					<!-- /.box-header -->
					<div class="box-body">
						<!-- text input -->
						<div class="form-group">
							<label>タイトル</label>
							<?php echo $val->form_field( 'title', 'text', null, array( 'class' => 'form-control' ) ) ?>
							<?php echo $val->error( 'title' ) ?>
						</div>
						<div class="form-group">
							<label>カテゴリー</label>
							<?php echo $val->form_field( 'category', null, null, array( 'class' => 'form-control', 'style' => 'width: 100%' ) ) ?>
							<?php echo $val->error( 'category' ) ?>
						</div>
						<!-- textarea -->
						<div class="form-group">
							<label>アイキャッチ画像</label>
							<input type="file" name="_eyecatch">
							<?php
							if ( $val->get_data( 'eyecatch_url' ) ) {
								echo $val->form_field( 'eyecatch_file', 'hidden', $val->get_data( 'eyecatch_file' ) );
								echo $val->form_field( 'eyecatch_url', 'hidden', $val->get_data( 'eyecatch_url' ) );
								?>
								<div class="help-block"><img src="<?php echo iwf_timthumb( $val->get_data( 'eyecatch_url' ), 200 ) ?>" alt=""></div>
								<?php
							}
							?>
							<?php echo $val->error( 'eyecatch_file' ) ?>
						</div>
					</div>
					<!-- /.box-body -->
				</div>
				<!-- /.box -->
				<div class="box box-primary writer-form">
					<div class="box-header with-border">
						<h3 class="box-title">コンテンツ</h3>
					</div>
					<!-- /.box-header -->
					<div class="box-body">
						<?php echo $val->error( 'contents' ) ?>
						<div class="editable-content"></div>
					</div>
					<!-- /.box-body -->
					<div class="box-footer">
						<div class="row">
							<div class="col-md-5 col-md-offset-2 col-sm-12 m-b-md-0 m-b-xs-2">
								<?php echo WA_Content::get_contents_dropdown( '', array( 'class' => 'form-control js-block-list' ) ) ?>
							</div>
							<div class="col-md-3 col-sm-12">
								<button class="btn btn-default btn-block js-append-block">ブロックを追加</button>
							</div>
						</div>
					</div>
					<!-- /.box-footer -->
				</div>
				<!-- /.box -->
				<div class="box">
					<div class="box-body">
						<div class="row">
							<div class="col-md-3 col-sm-12 m-b-md-0 m-b-xs-2">
								<button type="submit" name="do_review" value="1" class="btn btn-warning btn-block">納品申請</button>
							</div>
							<div class="col-md-3 col-sm-6 m-b-md-0 m-b-xs-2">
								<button type="submit" name="do_draft" value="1" class="btn btn-primary btn-block">下書き保存</button>
							</div>
							<div class="col-md-3 col-sm-6 m-b-md-0 m-b-xs-2">
								<button type="submit" name="do_preview" value="1" class="btn btn-primary btn-block">プレビュー</button>
							</div>
							<?php
							if ( $post ) {
								?>
								<div class="col-md-3 col-sm-12">
									<button type="submit" name="do_delete" value="1" class="btn btn-danger btn-block" onclick="return confirm('本当に削除してもよろしいですか？')">削除</button>
								</div>
								<?php
							}
							?>
						</div>
					</div>
					<!-- /.box-body -->
				</div>
				<!-- /.box -->
			</div>
		</div>
	</form>
</section>
<!-- /.content -->
<?php
add_action( 'wa/footer', function () use ( $val ) {
	$contents = apply_filters( 'wa/post_edit/contents', $val->get_data( 'contents' ) );
	?>
	<script>
		$(function () {
			new WriterScript({
				blockSelectClass: '.js-block-list',
				appendBtnClass: '.js-append-block',
				contents: <?php echo $contents && is_array( $contents ) ? json_encode( array_values( $contents ) ) : '[]' ?>
			});
		})
	</script>
	<script type="text/javascript">
		$(function () {
			$('[name="do_review"]').click(function () {
				return confirm("納品申請を行うと記事の編集ができなくなります。\nよろしいですか？");
			});

			$('[name="do_preview"]').click(function () {
				var previewWindow = window.open('', 'wa_post_preview');
				previewWindow.focus();
			});
		});
	</script>
	<?php
	if ( filter_input( INPUT_GET, 'updated_preview' ) ) {
		$preview_url = WA_View::get_link( 'post_preview' );
		$post_id     = filter_input( INPUT_GET, 'id' );

		if ( $preview_url && $post_id ) {
			?>
			<script type="text/javascript">
				$(function () {
					var previewWindow = window.open('<?php echo add_query_arg( array( 'id' => $post_id ), $preview_url ) ?>', 'wa_post_preview');
					previewWindow.focus();
				});
			</script>
			<?php
		} else {
			?>
			<script type="text/javascript">
				jQuery(function ($) {
					var previewWindow = window.open('', 'wa_post_preview');
					previewWindow.close();

					window.location = '<?php echo add_query_arg( 'updated_draft', 1, remove_query_arg( 'updated_preview' ) ) ?>';
				});
			</script>
			<?php
		}
	}
	?>
	<?php
	echo WA_Content::get_contents_templates();
} );
?>
<?php include WA_TMPL_PATH . 'element/footer-content.php' ?>
