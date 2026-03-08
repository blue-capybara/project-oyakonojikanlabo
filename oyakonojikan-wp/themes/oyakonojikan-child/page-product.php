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
					<h1>商品紹介</h1>
				</div>
				<section>
					<div class="main productsPage">
						<section>
							<div class="maincontents product-series-page" id="maincontent">
								<?php if (function_exists('wp_is_mobile') && wp_is_mobile()) : ?>
								<?php else : // 2023-12-06 追記 4つ目以降小さい記事とかわかりにくいので直接書き込む ?>
									<style>
										.productsPage .postcards:nth-of-type(-n+4) {
											flex-basis: calc(50% - 17px);
										}
									</style>
								<?php endif; ?>
								<?php get_template_part('template-parts/tmp', 'product'); ?>
								<?php
								// while (have_posts()) :
								// 	the_post();
								// 	get_template_part('template-parts/content');
								// endwhile; // End of the loop.
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
