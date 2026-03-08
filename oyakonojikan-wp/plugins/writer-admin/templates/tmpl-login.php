<?php
/**
 * Template Name: ログイン
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
		<?php
		if ( $val->error() ) {
			?>
			<div class="alert alert-danger alert-dismissible">
				<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
				ログインに失敗しました。
			</div>
			<?php
		}
		?>
		<form action="" method="post">
			<div class="form-group has-feedback">
				<?php echo $val->form_field( 'user_login', 'text', null, array( 'class' => 'form-control', 'placeholder' => 'メールアドレス' ) ) ?>
				<span class="glyphicon glyphicon-envelope form-control-feedback"></span>
			</div>
			<div class="form-group has-feedback">
				<?php echo $val->form_field( 'user_pass', 'password', null, array( 'class' => 'form-control', 'placeholder' => 'パスワード' ) ) ?>
				<span class="glyphicon glyphicon-lock form-control-feedback"></span>
			</div>
			<div class="row">
				<div class="col-xs-8">
					<div class="checkbox icheck">
						<label><?php echo $val->form_field( 'remember' ) ?> ログイン情報を保存</label>
					</div>
				</div>
				<!-- /.col -->
				<div class="col-xs-4">
					<button type="submit" class="btn btn-primary btn-block btn-flat">ログイン</button>
				</div>
				<!-- /.col -->
			</div>
		</form>
		<div class="m-t-xs-2"><a href="<?php echo WA_View::get_link( 'password_forget' ) ?>"><i class="fa fa-sign-out"></i> パスワードを忘れた方</a></div>
		<div class="m-t-xs-2"><a href="<?php echo home_url( '/registration/' ) ?>"><i class="fa fa-user"></i> 会員登録</a></div>
	</div>
	<!-- /.login-box-body -->
</div>
<?php include WA_TMPL_PATH . 'element/footer.php' ?>
