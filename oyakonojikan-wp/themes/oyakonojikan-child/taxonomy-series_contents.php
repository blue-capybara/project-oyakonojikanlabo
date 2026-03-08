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
<?php
$term_id = get_queried_object()->term_id;
$term_name = get_queried_object()->name;
$term_idsp = 'series_contents_' . $term_id;
$photo = get_field('tokusyuimage', $term_idsp);
$photosp = wp_get_attachment_image_src($photo, 'full');
$description = term_description();
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
						<div class="main__eyechatch"><img src="<?php echo $photosp[0]; ?>" alt="<?php echo $term_name; ?>"></div>
						<!-- <span>記事一覧</span> -->
						<h1>「<?php the_archive_title(); ?>」</h1>
						<div class="header_discription"><?php echo $description; ?></div>
					</div>

					<div class="topics maincontents" id="maincontent">
						<?php
						/* Start the Loop */
						while (have_posts()) :
							the_post();

							get_template_part('template-parts/tmp-topics', get_post_type());

						endwhile; ?>
					</div>
				<?php endif; ?>
				<?php
				if (function_exists('pagenation')) {
					pagenation($args->max_num_pages);
				}
				?>
				<?php get_template_part('template-parts/ads-infomation'); ?>

			</section>

			<!-- <div class="more"><a class="more__btn entry-more"><object type="image/svg+xml" data="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/more.svg" width="80" height="12">more</object></a></div> -->
			<?php //get_template_part('template-parts/tmp-adpost'); 
			?>
		</article>
	</div><!-- /.contents -->
</main>
<?php
get_footer();
