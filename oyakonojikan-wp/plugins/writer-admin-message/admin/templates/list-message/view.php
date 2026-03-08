<div id="wa" class="wrap">
	<h1 class="wp-heading-inline">メッセージ</h1>
	<a href="<?php echo remove_query_arg( array( 'updated', 'id' ), add_query_arg( array( 'action' => 'compose', 'tree_id' => $tree_id ) ) ) ?>" class="page-title-action">このスレッドに返信</a>
	<hr class="wp-header-end">
	<?php settings_errors() ?>
	<ul class="wa-msg">
		<?php
		foreach ( $messages as $i => $message ) {
			?>
			<li class="wa-msg__item<?php echo $i < 2 ? '' : ' -collapsed' ?>">
				<div class="wa-msg__header">
					<?php
					if ( $i === 0 ) {
						?>
						<h2 class="wa-msg-title"><?php echo get_the_title( $message ) ?></h2>
						<?php
					}
					?>
					<div class="wa-msg-meta">
						<p class="wa-msg-sender">
							<?php
							if ( get_post_meta( $message->ID, 'to_admin', true ) ) {
								?>
								<a href="" class="wa-msg-sender__name"><span class="dashicons dashicons-admin-users"></span> <?php echo WA_User::get_name( $message->post_author ) ?></a>&nbsp;&nbsp;→&nbsp;&nbsp;<span class="wa-msg-sender__name">管理者</span>
								<?php
							} else {
								?>
								<span class="wa-msg-sender__name">管理者</span>&nbsp;&nbsp;→&nbsp;&nbsp;<a href="" class="wa-msg-sender__name"><span class="dashicons dashicons-admin-users"></span> <?php echo WA_User::get_name( $message->post_author ) ?></a>
								<?php
							}
							?>
						</p>
						<p class="wa-msg-date"><span class="dashicons dashicons-clock"></span> <?php echo get_the_time( 'Y/m/d H:i:s', $message ) ?></p>
					</div>
				</div>
				<div class="wa-msg__body">
					<?php echo nl2br( $message->post_content ) ?>
					<div class="wa-msg-action">
						<a href="<?php echo remove_query_arg( array( 'updated' ), add_query_arg( array( 'action' => 'compose', 'id' => $message->ID ) ) ) ?>" class="wa-msg-action__btn"><span class="dashicons dashicons-redo"></span> 返信</a>
					</div>
				</div>
			</li>
			<?php
		}
		?>
	</ul>
</div>