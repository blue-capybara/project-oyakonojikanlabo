<div id="wa" class="wrap">
	<h1 class="wp-heading-inline">メッセージの新規作成</h1>
	<?php
	if ( $tree_id ) {
		?>
		<a href="<?php echo remove_query_arg( 'tree_id', add_query_arg( array( 'action' => 'view', 'id' => $tree_id ) ) ) ?>" class="page-title-action">スレッドに戻る</a>
		<?php
	}
	?>
	<hr class="wp-header-end">
	<?php settings_errors() ?>
	<?php
	if ( $reply_message ) {
		?>
		<ul class="wa-msg">
			<li class="wa-msg__item -collapsed">
				<div class="wa-msg__header">
					<h2 class="wa-msg-title"><?php echo get_the_title( $reply_message ) ?></h2>
					<div class="wa-msg-meta">
						<p class="wa-msg-sender">
							<?php
							if ( get_post_meta( $reply_message->ID, 'to_admin', true ) ) {
								?>
								<a href="" class="wa-msg-sender__name"><span class="dashicons dashicons-admin-users"></span> <?php echo WA_User::get_name( $reply_message->post_author ) ?></a>&nbsp;&nbsp;→&nbsp;&nbsp;<span class="wa-msg-sender__name">管理者</span>
								<?php
							} else {
								?>
								<span class="wa-msg-sender__name">管理者</span>&nbsp;&nbsp;→&nbsp;&nbsp;<a href="" class="wa-msg-sender__name"><span class="dashicons dashicons-admin-users"></span> <?php echo WA_User::get_name( $reply_message->post_author ) ?></a>
								<?php
							}
							?>
						</p>
						<p class="wa-msg-date"><span class="dashicons dashicons-clock"></span> <?php echo get_the_time( 'Y/m/d H:i:s', $reply_message ) ?></p>
					</div>
				</div>
				<div class="wa-msg__body">
					<?php echo nl2br( $reply_message->post_content ) ?>
				</div>
			</li>
		</ul>
		<?php
	} else if ( $root_message ) {
		?>
		<ul class="wa-msg">
			<li class="wa-msg__item -collapsed">
				<div class="wa-msg__header">
					<h2 class="wa-msg-title"><?php echo get_the_title( $root_message ) ?></h2>
					<div class="wa-msg-meta">
						<p class="wa-msg-sender">
							<?php
							if ( get_post_meta( $root_message->ID, 'to_admin', true ) ) {
								?>
								<a href="" class="wa-msg-sender__name"><span class="dashicons dashicons-admin-users"></span> <?php echo WA_User::get_name( $root_message->post_author ) ?></a>&nbsp;&nbsp;→&nbsp;&nbsp;<span class="wa-msg-sender__name">管理者</span>
								<?php
							} else {
								?>
								<span class="wa-msg-sender__name">管理者</span>&nbsp;&nbsp;→&nbsp;&nbsp;<a href="" class="wa-msg-sender__name"><span class="dashicons dashicons-admin-users"></span> <?php echo WA_User::get_name( $root_message->post_author ) ?></a>
								<?php
							}
							?>
						</p>
						<p class="wa-msg-date"><span class="dashicons dashicons-clock"></span> <?php echo get_the_time( 'Y/m/d H:i:s', $root_message ) ?></p>
					</div>
				</div>
				<div class="wa-msg__body">
					<?php echo nl2br( $root_message->post_content ) ?>
					<div class="wa-msg-action">
						<a href="<?php echo add_query_arg( array( 'action' => 'compose', 'id' => $root_message->ID ) ) ?>" class="wa-msg-action__btn"><span class="dashicons dashicons-redo"></span> 返信</a>
					</div>
				</div>
			</li>
		</ul>
		<?php
	}
	?>
	<form action="" method="post">
		<?php wp_nonce_field( 'wa_message_compose' ) ?>
		<?php
		if ( $reply_message || $root_message ) {
			echo $val->form_field( 'user', 'hidden' );
			echo $val->form_field( 'title', 'hidden' );
		}
		?>
		<div class="wa-form">
			<?php
			if ( ! $reply_message && ! $root_message ) {
				?>
				<div class="wa-form__field">
					<select name="_user[]" class="js-select-writer" style="width: 100%" multiple>
						<option value="">宛先を選択</option>
						<?php
						if ( $val->validated( 'user' ) ) {
							foreach ( $val->validated( 'user' ) as $user_id ) {
								if ( ! WA_User::is_writer( $user_id ) ) {
									continue;
								}

								$selected_user = get_userdata( $user_id );
								?>
								<option value="<?php echo $user_id ?>" selected><?php echo WA_User::get_name( $user_id ) . ' (' . $selected_user->user_email . ')' ?></option>
								<?php
							}

						} else if ( $to_id ) {
							foreach ( $to_id as $user_id ) {
								if ( ! WA_User::is_writer( $user_id ) ) {
									continue;
								}

								$selected_user = get_userdata( $user_id );
								?>
								<option value="<?php echo $user_id ?>" selected><?php echo WA_User::get_name( $user_id ) . ' (' . $selected_user->user_email . ')' ?></option>
								<?php
							}
						}
						?>
					</select>
					<?php echo $val->error( 'user' ) ?>
				</div>
				<div class="wa-form__field">
					<?php echo $val->form_field( 'title', 'text', null, array( 'placeholder' => '件名' ) ) ?>
					<?php echo $val->error( 'title' ) ?>
				</div>
				<?php
			}
			?>
			<div class="wa-form__field">
				<?php echo $val->form_field( 'content', 'textarea' ) ?>
				<?php echo $val->error( 'content' ) ?>
			</div>
			<div class="wa-form-action">
				<button type="submit" class="button button-primary"><span class="dashicons dashicons-email-alt"></span> 送信する</button>
			</div>
		</div>
	</form>
</div>