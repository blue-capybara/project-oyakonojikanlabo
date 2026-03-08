<?php

/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 * It is used to display a page when nothing more specific matches a query.
 * E.g., it puts together the home page when no home.php file exists.
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
			<!-- <style>
				.nontanbanner {
					padding: 0 8px;

					object {
						pointer-events: none;
					}
				}
			</style>
			<aside>
				<div class="nontanbanner">
					<a href="<?php echo esc_url(home_url()); ?>/nontan-fair/">
						<picture>
							<source type="image/webp" srcset="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/nontanfair/nontanfair_home_banner.webp">
							<img src="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/nontanfair/nontanfair_home_banner.png" alt="ノンタンフェア">
						</picture>
					</a>
				</div>
			</aside> -->

			<section>
				<div class="maincontents" id="maincontent">
					<?php $count = 0; ?>
					<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
							<?php if ($count == 0) : ?>
								<?php get_template_part('template-parts/ads-infomation'); ?>
								<div class="top_title top_title_new">
									<h2><span>新着記事</span></h2>
								</div>
							<?php endif; ?>
							<?php get_template_part('template-parts/tmp', 'posts'); ?>
							<?php $count = $count + 1; ?>
					<?php endwhile;
					endif; ?>
				</div>
			</section>
			<?php
			if (function_exists('pagenation')) {
				pagenation($args->max_num_pages);
			}
			?>
			<!-- <div class="more"><a class="more__btn entry-more"><object type="image/svg+xml" data="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/more.svg" width="80" height="12">more</object></a>
				<span class="entry-loading">Now Loading...</span>
			</div> -->
			<?php //get_template_part('template-parts/tmp-adpost');
			?>
		</article>
	</div><!-- /.contents -->

</main>
<?php get_footer();
