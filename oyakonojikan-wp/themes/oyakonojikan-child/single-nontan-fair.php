<?php if (!post_password_required($post->ID)) : ?>
	<?php

	/**
	 * The template for displaying all single posts
	 *
	 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
	 *
	 * @package OyakoNoJikan
	 */

	get_header("4");
	?>
	<style>
		body {
			background-color: #ffe1e1;
		}

		.container {
			grid-template-rows: 630px 1fr 240px;
		}

		@media (max-width: 767px) {
			header {
				padding-top: 0;
			}

			.container {
				grid-template-rows: 47.643589743vw 1fr 90.606756vw;
			}
		}
	</style>
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

							<?php get_template_part('template-parts/tmp-post-author'); ?>
							<?php get_template_part('template-parts/ads-infomation'); ?>
							<h3 class="topics__title">TOPICS</h3>
							<div class="topics maincontents">
								<?php
								$categories = get_the_category($post->ID);

								$category_ID = array();

								foreach ($categories as $category) :
									array_push($category_ID, $category->cat_ID);
								endforeach;

								$args = array(
									'post__not_in' => array($post->ID),
									'posts_per_page' => 10,
									'category__in' => $category_ID,
									'orderby' => 'rand',
								);
								$query = new WP_Query($args);
								if ($query->have_posts()) :
									while ($query->have_posts()) :
										$query->the_post();
								?>
										<?php get_template_part('template-parts/tmp-topics'); ?>
								<?php endwhile;
								endif; ?>
								<?php wp_reset_postdata(); ?>

							</div>
						</div>
					</section>

				</section>
				<?php //get_template_part('template-parts/tmp-adpost'); 
				?>
			</article>
		</div><!-- /.contents -->
	</main>
<?php
	get_sidebar();
	get_footer();
else : ?>

	<?php echo get_the_password_form(); ?>
<?php endif; ?>