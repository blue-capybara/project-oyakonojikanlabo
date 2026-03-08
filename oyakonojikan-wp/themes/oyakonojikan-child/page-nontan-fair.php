<?php if (!post_password_required($post->ID)) : ?>
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

	get_header("4");
	?>
	<style>
		body.post .main.nontanfair_main {
			display: grid;
			justify-content: space-between;
			row-gap: 40px;
			grid-template-columns: 1fr 1fr 1fr;
			gap: 28.85px;

			.postcards__tags a {
				display: inline-block;
				vertical-align: middle;
				line-height: 1.5;
				padding: 2px 3px;
				font-family: europa, sans-serif;
				font-weight: 700;
				font-size: 1rem;
				letter-spacing: 0.1em;
				border: 1px solid #545b63;
				text-decoration: none;
				margin: 0 5px 5px 0;
				-webkit-transition: all 0.1s cubic-bezier(0.645, 0.045, 0.355, 1);
				transition: all 0.1s cubic-bezier(0.645, 0.045, 0.355, 1);
				border-radius: 4px;
				color: #545B63;
			}

			a:active,
			a:focus,
			a:hover,
			a:visited {
				color: #545B63;
			}

			.postcards:nth-of-type(-n+4) {
				flex-basis: calc(100% / 3 - 19.32px);
				padding-bottom: 6px;
			}

			.postcards:nth-of-type(n+4) {
				flex-basis: calc(100% / 3 - 19.32px);
				padding-bottom: 6px;
				margin: auto;
				height: auto;
			}

			.postcards__title {
				margin-top: 4px;
				letter-spacing: 0.05em;
				line-height: 1.6;
				word-break: normal;
				line-break: strict;
				word-wrap: break-word;
				overflow-wrap: break-word;
				font-weight: bold;

				h2 {
					font-size: 17px;
					border-bottom: none;
					padding: 0;
				}

				h2:before {
					content: none;
				}
			}
		}

		@media (max-width: 767px) {
			body.post .main.nontanfair_main {
				.postcards__title {
					h2 {
						font-size: 3.38164vw;
					}
				}
			}

			body.post .main.nontanfair_main {
				grid-template-columns: 1fr;
			}

			body.page .header.topics__title {
				font-size: 4.39024vw;
				margin-bottom: 9.512195vw;
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
						<?php if (have_posts()) : ?>
							<div class="header topics__title">
								<span>記事一覧</span>
								<h1>「<?php the_title(); ?>」</h1>
							</div>
							<div class="topics maincontents" id="maincontent">
								<?php
								/* Start the Loop */
								while (have_posts()) :
									the_post();
								//get_template_part('template-parts/tmp-topics', get_post_type());

								endwhile; ?>
							</div>
						<?php endif; ?>
						<div class="main nontanfair_main">

							<?php
							$args = array(
								'tag' => 'nontan-fair', // タグスラッグを指定
							);

							$query = new WP_Query($args);

							if ($query->have_posts()) :
								while ($query->have_posts()) : $query->the_post();
									get_template_part('template-parts/tmp', 'posts');
								endwhile;

								wp_reset_postdata();
							else :
								echo '該当する投稿はありません。';
							endif;
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
else : ?>

	<?php echo get_the_password_form(); ?>
<?php endif; ?>