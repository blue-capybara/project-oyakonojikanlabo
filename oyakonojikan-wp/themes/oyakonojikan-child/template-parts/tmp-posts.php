		<!-- posts -->
		<div class="postcards">
			<div class="postcards__image"><a href="<?php the_permalink(); ?>"><img src="<?php if (has_post_thumbnail()) { ?><?php the_post_thumbnail_url('full'); ?><?php } else { ?><?php echo get_stylesheet_directory_uri() ?>/assets/img/noimage.jpg<?php } ?>" alt="<?php the_title(); ?>"></a></div>
			<div class="postcards__inner">
				<div class="postcards__tags">
					<?php
					$tags = get_the_tags();
					if (!empty($tags)) {
						foreach ($tags as $tag) {
							printf(
								'<a href="%s">%s</a>',
								get_tag_link($tag->term_id),
								$tag->name
							);
						}
					}
					?>
				</div>
				<?php keika_time(3); ?>
				<div class="postcards__title">
					<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
				</div>
				<?php
				$scf_text = get_post_meta(get_the_ID(), 'sub-title', true);

				if (!empty($scf_text)) { ?>
					<div class="postcards__sub-ttl"><?php echo $scf_text; ?></div>
				<?php } ?>
			</div>
		</div>
		<!-- /posts -->