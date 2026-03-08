<?php
/**
 * Template Name: 会員登録
 */
?>
<?php get_header() ?>
<?php the_post() ?>
<div class="page -one-column">
	<section class="page-content">
		<div class="breadcrumb">
			<ul class="breadcrumb__list">
				<li class="breadcrumb__item"><a href="<?php echo home_url( '/' ) ?>">ホーム</a></li>
				<li class="breadcrumb__item">ログイン</li>
			</ul>
		</div>
		<div class="page__header">
			<h2 class="page__title -login"><span>ログイン</span></h2>
		</div>
		<div class="page__body">
			<form action="" method="post" class="form-cnt -login">
				<?php
				if ( $val->error() ) {
					?>
					<div class="alert -error">
						ログインに失敗しました。
					</div>
					<?php
				}
				?>
				<div class="page-sub">
					<dl class="form-list">
						<dt class="form-list__title">ID<?php echo $val->error( 'id' ) ?></dt>
						<dd class="form-list__content">
							<?php echo $val->form_field( 'user_login', 'text', null, array( 'class' => 'form-component', 'placeholder' => '' ) ) ?>
						</dd>
						<dt class="form-list__title">パスワード</dt>
						<dd class="form-list__content">
							<?php echo $val->form_field( 'user_pass', 'password', null, array( 'class' => 'form-component', 'placeholder' => '' ) ) ?>
						</dd>
						<dd class="form-list__content">
							<label><?php echo $val->form_field( 'remember' ) ?> ログイン情報を記録する</label>
						</dd>
					</dl>
				</div>
				<div class="form-action">
					<button type="submit" class="form-action__btn -writer-login" name="do_confirm" value="1">ログイン</button>
				</div>
				<p class="login-password-forget"><a href="<?php echo WA_View::get_link( 'password_forget' ) ?>">パスワードをお忘れの方はこちら</a></p>
			</form>
			<div class="new-registration">
				<a href="<?php echo iwf_get_permalink_by_template('tmpl-registration.php') ?>">新規登録はこちらから</a>
			</div>
		</div>
	</section>
</div>
<?php get_footer() ?>
