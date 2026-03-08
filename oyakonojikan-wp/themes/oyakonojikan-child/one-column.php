<?php
/*
Template Name: 1カラムテンプレート
Template Post Type: post, page
*/
?>

<?php get_header(); ?>
<link rel="stylesheet" href="<?php echo get_template_directory_uri(); ?>/assets/css/uaplus.css">
<main class="one-column">
	<div class="contents">
		<article>
			<section>
				<div class="main">

					<?php
					while (have_posts()) :
						the_post();
						get_template_part('template-parts/content-one-column', get_post_type());
					endwhile; // End of the loop.
					?>

				</div>
			</section>
			<?php get_template_part('template-parts/ads-infomation'); ?>
		</article>
	</div><!-- /.contents -->
</main>
<?php
get_footer();
