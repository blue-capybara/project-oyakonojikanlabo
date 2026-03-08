<?php
/**
 * Template Name: パスワードを忘れた方
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
		<p class="login-box-msg">パスワードを忘れた方</p>
		<?php
		if ( filter_input( INPUT_GET, 'completed' ) ) {
			?>
			<div class="alert alert-success alert-dismissible">
				<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
				確認メールを送信しました。
			</div>
			<?php
		}
		?>
		<form action="" method="post">
			<div class="form-group has-feedback">
				<input type="email" name="_email" placeholder="メールアドレス" class="form-control">
				<span class="glyphicon glyphicon-envelope form-control-feedback"></span>
			</div>
			<div class="row">
				<div class="col-xs-12">
					<button type="submit" class="btn btn-primary btn-block btn-flat">確認メールを送信</button>
				</div>
				<!-- /.col -->
			</div>
		</form>
		<div class="m-t-xs-2"><a href="<?php echo WA_View::get_link( 'login' ) ?>"><i class="fa fa-sign-in"></i> ログイン画面</a></div>
	</div>
	<!-- /.login-box-body -->
</div>
<?php include WA_TMPL_PATH . 'element/footer.php' ?>
