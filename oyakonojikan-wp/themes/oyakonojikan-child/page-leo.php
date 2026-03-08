<?php
/*
Template Name: レオレオニ イベント概要ページ
Template Post Type: post, page
*/
?>

<?php
get_header("3");
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
