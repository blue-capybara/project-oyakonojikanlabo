<?php

/**
 * The template for displaying all pages
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages
 * and that other 'pages' on your WordPress site may use a
 * different template.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package OyakoNoJikan
 */

get_header();
?>
<main>
	<div class="contents">
		<aside id="g-nav">
			<?php get_sidebar(); ?>
		</aside>
		<article>

			<section>
				<section>
					<div class="main">

						<?php
						while (have_posts()) :
							the_post();
							get_template_part('template-parts/content', get_post_type());
						endwhile; // End of the loop.
						?>

					</div>
				</section>
			</section>
			<?php //get_template_part('template-parts/tmp-adpost'); 
			?>
			<?php get_template_part('template-parts/ads-infomation'); ?>
		</article>
	</div><!-- /.contents -->
</main>
<?php
get_sidebar();
get_footer();
