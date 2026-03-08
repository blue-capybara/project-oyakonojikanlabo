<?php
/**
 * Template Name: パスワードの再設定
 */
?>
<?php
add_filter( 'wa/body_class', function () {
	return 'old-transition login-page';
} );
?>
<?php include WA_TMPL_PATH . 'element/header.php' ?>
<div class="login-box">
	<div class="login-logo">
		<?php echo WA::get_config( 'title.full' ) ?>
	</div>
	<!-- /.login-logo -->
	<div class="login-box-body">
		<p class="login-box-msg">パスワードの再設定</p>
		<?php
		if ( $val->error() ) {
			?>
			<div class="alert alert-danger alert-dismissible">
				<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
				入力内容にエラーがあります。
			</div>
			<?php
		}
		?>
		<form action="" method="post">
			<div class="form-group has-feedback">
				<?php echo $val->form_field( 'password', 'password', null, array( 'class' => 'form-control', 'placeholder' => 'パスワード' ) ) ?>
				<?php echo $val->error( 'password' ) ?>
			</div>
			<div class="form-group has-feedback">
				<?php echo $val->form_field( 'password_confirm', 'password', null, array( 'class' => 'form-control', 'placeholder' => 'パスワードの確認入力' ) ) ?>
				<?php echo $val->error( 'password_confirm' ) ?>
			</div>
			<div class="row">
				<div class="col-xs-12">
					<button type="submit" class="btn btn-primary btn-block btn-flat">パスワードをリセット</button>
				</div>
				<!-- /.col -->
			</div>
		</form>
	</div>
	<!-- /.login-box-body -->
</div>
<?php include WA_TMPL_PATH . 'element/footer.php' ?>
