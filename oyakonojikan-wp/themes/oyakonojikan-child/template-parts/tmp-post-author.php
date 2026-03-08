<section>
	<h2>この記事を書いた人</h2>
	<div class="postfooter">
		<div class="author-box">
			<div class="author-avatar">
				<?php echo get_avatar(get_the_author_meta('ID'), 150); ?>
			</div>
			<div class="author-info">
				<div class="author-name">
					<?php
					$userid = get_the_author_meta("user_login");
					$username = get_the_author_meta("display_name");
					if ($userid === $username) {
					?>
						ママサポーター
					<?php
					} else {
						the_author_meta("display_name");
					}
					?>
				</div>
				<p><?php the_author_meta("description"); ?></p>
			</div>
		</div>
	</div>
</section>
