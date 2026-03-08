<?php

/**
 * The template for displaying archive pages
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
			<div class="navis" id="g-nav-list">
				<nav class="gnavi">
					<?php get_sidebar(); ?>
				</nav>
			</div>
		</aside>
		<article>

			<section>
				<?php if (have_posts()) : ?>
					<div class="header topics__title">
						<span>記事一覧</span>
						<h1>「<?php the_archive_title(); ?>」</h1>
					</div>
					<div class="topics maincontents" id="maincontent">
						<?php
						/* Start the Loop */
						while (have_posts()) :
							the_post();
							/*
				 * Include the Post-Type-specific template for the content.
				 * If you want to override this in a child theme, then include a file
				 * called content-___.php (where ___ is the Post Type name) and that will be used instead.
				 */
							get_template_part('template-parts/tmp-topics', get_post_type());

						endwhile; ?>
					</div>
				<?php endif; ?>
			</section>
			<?php
			if (function_exists('pagenation')) {
				pagenation($args->max_num_pages);
			}
			?>
			<!-- <div class="more"><a class="more__btn entry-more"><object type="image/svg+xml" data="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/more.svg" width="80" height="12">more</object></a></div> -->
			<?php //get_template_part('template-parts/tmp-adpost'); 
			?>
			<?php get_template_part('template-parts/ads-infomation'); ?>
		</article>

	</div><!-- /.contents -->
</main>
<?php
get_footer();
