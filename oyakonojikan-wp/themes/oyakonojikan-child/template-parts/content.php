<?php

/**
 * Template part for displaying posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package OyakoNoJikan
 */

?>
<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
	<div class="main__header">
		<div class="main__category">
			<?php
			$posttags = get_the_tags();
			if ($posttags) {
				foreach ($posttags as $tag) {
					echo '<a class="' . $tag->slug . '" href="' . get_tag_link($tag->term_id) . '">' . $tag->name . '</a>';
				}
			}
			?>
		</div>
		<?php
		$subtitle = get_field('subtitle');

		if (is_singular()) : ?>
			<div class="header topics__title">
				<h1 class="entry-title main__title"><?php echo esc_html(get_the_title()); ?></h1>
				<?php if ($subtitle) : ?>
					<div class="post_subtitle"><?php echo esc_html($subtitle); ?></div>
				<?php endif; ?>
			</div>
		<?php else : ?>
			<h2 class="entry-title main__title">
				<a href="<?php echo esc_url(get_permalink()); ?>" rel="bookmark">
					<?php echo esc_html(get_the_title()); ?>
				</a>
			</h2>
			<?php if ($subtitle) : ?>
				<div class="post_subtitle"><?php echo esc_html($subtitle); ?></div>
			<?php endif; ?>
		<?php endif; ?>

		<?php
		$scf_text = get_post_meta(get_the_ID(), 'sub-title', true);

		if (!empty($scf_text)) { ?>
			<div class="postcards__sub-ttl"><?php echo $scf_text; ?></div>
		<?php } ?>
	</div>
	<div class="main__eyechatch">
		<?php oyakonojikan_post_thumbnail(); ?>
	</div>
	<div class="main__body">
		<?php
		the_content(
			sprintf(
				wp_kses(
					/* translators: %s: Name of current post. Only visible to screen readers */
					__('Continue reading<span class="screen-reader-text"> "%s"</span>', 'oyakonojikan'),
					array(
						'span' => array(
							'class' => array(),
						),
					)
				),
				wp_kses_post(get_the_title())
			)
		);

		wp_link_pages(
			array(
				'before' => '<div class="page-links">' . esc_html__('Pages:', 'oyakonojikan'),
				'after'  => '</div>',
			)
		);
		?>
	</div>
</article>