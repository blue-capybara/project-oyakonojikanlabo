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
				<div class="header topics__title">
					<h1>よみもの</h1>
				</div>
				<section>
					<div class="main seriesPage">
						<section>
							<div class="maincontents product-series-page" id="maincontent">
								<?php if (function_exists('wp_is_mobile') && wp_is_mobile()) : ?>
								<?php else : //2023-12-06 追記 4つ目以降小さい記事とかわかりにくいので直接書き込む ?>
									<style>
										.seriesPage .postcards:nth-of-type(-n+4) {
											flex-basis: calc(50% - 17px);
										}
									</style>
								<?php endif; ?>
								<?php
								$terms = get_terms('series_contents', array(
									'orderby'       => 'ids',
									'order'         => 'ASC'
								));
								foreach ($terms as $term) {
									$cat_img = SCF::get_term_meta($term->term_id, 'series_contents', 'tokusyuimage');
									$img_url = wp_get_attachment_image_src($cat_img, 'full');
								?>

									<!-- posts -->
									<div class="postcards product">
										<div class="postcards__image"><a href="<?php echo get_term_link($term); ?>"><img src="<?php if ($img_url) { ?><?php echo $img_url[0]; ?><?php } else { ?><?php echo get_stylesheet_directory_uri() ?>/assets/img/noimage.jpg<?php } ?>" alt="<?php echo $term->name; ?>"></a></div>
										<div class="postcards__inner">
											<div class="postcards__title">
												<h2><a href="<?php echo get_term_link($term); ?>"><?php echo $term->name; ?></a></h2>
											</div>
											<div class="postcards__exc">
												<?php
												if (mb_strlen($term->description, 'UTF-8') > 50) {
													$d = str_replace('\n', '', mb_substr(strip_tags($term->description), 0, 50, 'UTF-8'));
													echo $d . '……';
												} else {
													echo str_replace('\n', '', strip_tags($term->description));
												}
												?>
											</div>
										</div>
									</div>
									<!-- /posts -->
									<?php //get_template_part('template-parts/tmp', 'series'); 
									?>
									<?php
									// while (have_posts()) :
									// 	the_post();
									// 	get_template_part('template-parts/content');
									// endwhile; // End of the loop.
									?>
								<?php
								}
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
