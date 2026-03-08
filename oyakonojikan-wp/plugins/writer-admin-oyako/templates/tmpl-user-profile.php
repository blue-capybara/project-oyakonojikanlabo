<?php
/**
 * Template Name: ユーザープロフィール
 */
?>
<?php
add_action( 'wa/header', function () {
	?>
	<link rel="stylesheet" href="<?php echo WA_ASSETS_URL ?>bower_components/bootstrap-datepicker/dist/css/bootstrap-datepicker3.css">
	<?php
} );
?>
<?php include WA_TMPL_PATH . 'element/header-content.php' ?>
	<!-- Content Header (Page header) -->
	<section class="content-header">
		<h1><i class="fa fa-bars"></i> プロフィール</h1>
	</section>
	<!-- Main content -->
	<section class="content container-fluid">
		<form role="form" action="<?php echo remove_query_arg( 'saved' ) ?>" method="post" enctype="multipart/form-data">
			<?php echo IWF_Token::hidden_field( 'oyako_member' ) ?>
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
					if ( filter_input( INPUT_GET, 'saved' ) ) {
						?>
						<div class="alert alert-success alert-dismissible">
							<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
							プロフィールを更新しました。
						</div>
						<?php
					}
					?>
					<div class="box box-primary">
						<div class="box-header with-border">
							<h3 class="box-title">新規投稿</h3>
						</div>
						<div class="box-body">
							<!-- text input -->
							<div class="form-group">
								<label>お名前</label>
								<div class="row">
									<div class="col-xs-6">
										<div class="input-group">
											<span class="input-group-addon">姓</span>
											<?php echo $val->form_field( 'last_name', 'text', null, array( 'class' => 'form-control', 'placeholder' => '' ) ) ?>
										</div>
									</div>
									<div class="col-xs-6">
										<div class="input-group">
											<span class="input-group-addon">名</span>
											<?php echo $val->form_field( 'first_name', 'text', null, array( 'class' => 'form-control', 'placeholder' => '' ) ) ?>
										</div>
									</div>
								</div>
								<?php echo $val->error( 'last_name' ) ?>
								<?php echo $val->error( 'first_name' ) ?>
							</div>
							<div class="form-group">
								<label>フリガナ</label>
								<div class="row">
									<div class="col-xs-6">
										<div class="input-group">
											<span class="input-group-addon">セイ</span>
											<?php echo $val->form_field( 'kana_last_name', 'text', null, array( 'class' => 'form-control', 'placeholder' => '' ) ) ?>
										</div>
									</div>
									<div class="col-xs-6">
										<div class="input-group">
											<span class="input-group-addon">メイ</span>
											<?php echo $val->form_field( 'kana_first_name', 'text', null, array( 'class' => 'form-control', 'placeholder' => '' ) ) ?>
										</div>
									</div>
								</div>
								<?php echo $val->error( 'kana_last_name' ) ?>
								<?php echo $val->error( 'kana_first_name' ) ?>
							</div>
							<div class="form-group">
								<label>性別</label>
								<div class="radio">
									<?php echo $val->form_field( 'gender' ) ?>
								</div>
								<?php echo $val->error( 'gender' ) ?>
							</div>
							<div class="form-group">
								<label>郵便番号</label>
								<div class="row">
									<div class="col-xs-12 col-md-4">
										<div class="input-group">
											<span class="input-group-addon">〒</span>
											<?php echo $val->form_field( 'zip', null, null, array( 'class' => 'form-control' ) ) ?>
										</div>
									</div>
								</div>
								<?php echo $val->error( 'zip' ) ?>
							</div>
							<div class="form-group">
								<label>住所</label>
								<?php echo $val->form_field( 'address', null, null, array( 'class' => 'form-control' ) ) ?>
								<?php echo $val->error( 'address' ) ?>
							</div>
							<div class="form-group">
								<label>電話番号</label>
								<?php echo $val->form_field( 'tel', null, null, array( 'class' => 'form-control' ) ) ?>
								<?php echo $val->error( 'tel' ) ?>
							</div>
							<div class="form-group">
								<label>誕生日</label>
								<div class="input-group date">
									<div class="input-group-addon">
										<i class="fa fa-calendar"></i>
									</div>
									<?php echo $val->form_field( 'birth_day', null, null, array( 'class' => 'form-control datepicker' ) ) ?>
								</div>
								<?php echo $val->error( 'birth_day' ) ?>
							</div>
							<div class="form-group">
								<label>仕事について</label>
								<div class="radio">
									<?php echo $val->form_field( 'work_status' ) ?>
								</div>
								<?php echo $val->error( 'work_status' ) ?>
							</div>
						</div>
						<!-- /.box-body -->
					</div>
					<div class="box box-primary">
						<div class="box-header with-border">
							<h3 class="box-title">子供について</h3>
						</div>
						<div class="box-body">
							<div class="form-group">
								<label>子供の状態</label>
								<div class="radio">
									<?php echo $val->form_field( 'family_no_child', null, null, array( 'label' => '子供なし' ) ) ?>
								</div>
								<?php echo $val->error( 'family_no_child' ) ?>
							</div>
							<div class="form-group">
								<label>子供1：性別</label>
								<div class="radio">
									<?php echo $val->form_field( 'family_child_data_1_gender', null, null, array( 'class' => 'form-control' ) ) ?>
								</div>
								<?php echo $val->error( 'family_child_data_1_gender' ) ?>
							</div>
							<div class="form-group">
								<label>子供1：誕生日</label>
								<div class="radio">
									<div class="input-group date">
										<div class="input-group-addon">
											<i class="fa fa-calendar"></i>
										</div>
										<?php echo $val->form_field( 'family_child_data_1_birth_day', null, null, array( 'class' => 'form-control datepicker' ) ) ?>
									</div>
								</div>
								<?php echo $val->error( 'family_child_data_1_birth_day' ) ?>
							</div>
							<div class="form-group">
								<label>子供2：性別</label>
								<div class="radio">
									<?php echo $val->form_field( 'family_child_data_2_gender', null, null, array( 'class' => 'form-control' ) ) ?>
								</div>
								<?php echo $val->error( 'family_child_data_2_gender' ) ?>
							</div>
							<div class="form-group">
								<label>子供2：誕生日</label>
								<div class="radio">
									<div class="input-group date">
										<div class="input-group-addon">
											<i class="fa fa-calendar"></i>
										</div>
										<?php echo $val->form_field( 'family_child_data_2_birth_day', null, null, array( 'class' => 'form-control datepicker' ) ) ?>
									</div>
								</div>
								<?php echo $val->error( 'family_child_data_2_birth_day' ) ?>
							</div>
							<div class="form-group">
								<label>子供3：性別</label>
								<div class="radio">
									<?php echo $val->form_field( 'family_child_data_3_gender', null, null, array( 'class' => 'form-control' ) ) ?>
								</div>
								<?php echo $val->error( 'family_child_data_3_gender' ) ?>
							</div>
							<div class="form-group">
								<label>子供3：誕生日</label>
								<div class="radio">
									<div class="input-group date">
										<div class="input-group-addon">
											<i class="fa fa-calendar"></i>
										</div>
										<?php echo $val->form_field( 'family_child_data_3_birth_day', null, null, array( 'class' => 'form-control datepicker' ) ) ?>
									</div>
								</div>
								<?php echo $val->error( 'family_child_data_3_birth_day' ) ?>
							</div>
						</div>
					</div>
					<div class="box box-primary">
						<div class="box-header with-border">
							<h3 class="box-title">振り込み先</h3>
						</div>
						<div class="box-body">
							<div class="form-group">
								<label>金融機関名</label>
								<div class="radio">
									<?php echo $val->form_field( 'payment_bank', null, null, array( 'class' => 'form-control' ) ) ?>
								</div>
								<?php echo $val->error( 'payment_bank' ) ?>
							</div>
							<div class="form-group">
								<label>支店名</label>
								<div class="radio">
									<?php echo $val->form_field( 'payment_branch', null, null, array( 'class' => 'form-control' ) ) ?>
								</div>
								<?php echo $val->error( 'payment_branch' ) ?>
							</div>
							<div class="form-group">
								<label>口座番号</label>
								<div class="radio">
									<?php echo $val->form_field( 'payment_number', null, null, array( 'class' => 'form-control' ) ) ?>
								</div>
								<?php echo $val->error( 'payment_number' ) ?>
							</div>
							<div class="form-group">
								<label>口座名義人（カタカナのみ）</label>
								<div class="radio">
									<?php echo $val->form_field( 'payment_name', null, null, array( 'class' => 'form-control' ) ) ?>
								</div>
								<?php echo $val->error( 'payment_name' ) ?>
							</div>
						</div>
					</div>
					<div class="box box-primary">
						<div class="box-header with-border">
							<h3 class="box-title">プロフィール画像</h3>
						</div>
						<div class="box-body">
							<div class="form-group">
								<input type="file" name="_thumbnail">
								<?php
								if ( $val->get_data( 'thumbnail_url' ) ) {
									echo $val->form_field( 'thumbnail_file', 'hidden', $val->get_data( 'thumbnail_file' ) );
									echo $val->form_field( 'thumbnail_url', 'hidden', $val->get_data( 'thumbnail_url' ) );
									?>
									<div class="help-block"><img src="<?php echo iwf_timthumb( $val->get_data( 'thumbnail_url' ), 200 ) ?>" alt=""></div>
									<?php
								}
								?>
								<?php echo $val->error( 'thumbnail_file' ) ?>
							</div>
						</div>
					</div>
					<!-- /.box -->
					<div class="box">
						<div class="box-body">
							<div class="row">
								<div class="col-md-3 col-sm-12 m-b-md-0 m-b-xs-2">
									<button type="submit" name="do_submit" value="1" class="btn btn-info btn-block">編集する</button>
								</div>
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
add_action( 'wa/footer', function () {
	?>
	<script src="<?php echo WA_ASSETS_URL ?>bower_components/bootstrap-datepicker/dist/js/bootstrap-datepicker.js"></script>
	<script src="<?php echo WA_ASSETS_URL ?>bower_components/bootstrap-datepicker/dist/locales/bootstrap-datepicker.ja.min.js"></script>
	<script>
		$(function () {
			$('.datepicker').datepicker({
				format: 'yyyy-mm-dd',
				language: 'ja',
				autoclose: true
			});

			$('[name="_family_no_child"]').on('ifChecked', function () {
				familyChildToggle();
			}).on('ifUnchecked', function () {
				familyChildToggle();
			});

			familyChildToggle();

			function familyChildToggle() {
				var checked = !!$('[name="_family_no_child"]:checkbox').is(':checked');

				for (var i = 1; i <= 3; i++) {
					var $genderCheck = $('[name="_family_child_data_' + i + '_gender"]');
					var $birthText = $('[name="_family_child_data_' + i + '_birth_day"]');

					$genderCheck.prop('disabled', checked);
					$birthText.prop('disabled', checked);

					if (checked) {
						$genderCheck.parents('.form-group').hide();
						$birthText.parents('.form-group').hide();

						$genderCheck.iCheck('uncheck');
						$birthText.val('');

					} else {
						$genderCheck.parents('.form-group').show();
						$birthText.parents('.form-group').show();
					}
				}
			}
		});
	</script>
	<?php
} );
?>
<?php include WA_TMPL_PATH . 'element/footer-content.php' ?>