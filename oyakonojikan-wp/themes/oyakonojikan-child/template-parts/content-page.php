<?php

/**
 * Template part for displaying page content in page.php
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
		if (is_singular()) :
			the_title('<div class="header topics__title"><h1 class="entry-title main__title">', '</h1></div>');
		else :
			the_title('<h2 class="entry-title main__title"><a href="' . esc_url(get_permalink()) . '" rel="bookmark">', '</a></h2>');
		endif;
		?>
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
</a