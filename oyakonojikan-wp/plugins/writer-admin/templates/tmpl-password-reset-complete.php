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
		<div class="alert alert-success">
			パスワードの再設定を完了しました。
		</div>
		<div class="m-t-xs-2"><a href="<?php echo WA_View::get_link( 'login' ) ?>"><i class="fa fa-sign-in"></i> ログイン画面</a></div>
	</div>
	<!-- /.login-box-body -->
</div>
<?php include WA_TMPL_PATH . 'element/footer.php' ?>
