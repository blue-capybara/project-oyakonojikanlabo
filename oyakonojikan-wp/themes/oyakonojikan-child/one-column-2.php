<?php
/*
Template Name: 1カラムその2
Template Post Type: post, page
*/
?>

<?php get_header(); ?>
<style>
	@font-face {
		font-family: 'LINESeedJP Rg';
		src: url('<?php echo get_stylesheet_directory_uri(); ?>/assets/fonts/LINESeedJP_OTF_Rg.woff') format('woff');
		src: url('<?php echo get_stylesheet_directory_uri(); ?>/assets/fonts/LINESeedJP_TTF_Rg.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
	}

	@font-face {
		font-family: 'LINESeedJP Bd';
		src: url('<?php echo get_stylesheet_directory_uri(); ?>/assets/fonts/LINESeedJP_OTF_Bd.woff') format('woff');
		src: url('<?php echo get_stylesheet_directory_uri(); ?>/assets/fonts/LINESeedJP_TTF_Bd.ttf') format('truetype');
		font-weight: bold;
		font-style: normal;
	}

	@font-face {
		font-family: 'LINESeedJP Eb';
		src: url('<?php echo get_stylesheet_directory_uri(); ?>/assets/fonts/LINESeedJP_OTF_Eb.woff') format('woff');
		src: url('<?php echo get_stylesheet_directory_uri(); ?>/assets/fonts/LINESeedJP_TTF_Eb.ttf') format('truetype');
		font-style: normal;
	}



	body.page .main h2::before,
	body.page .main h2::after {
		content: none;
	}

	body.page .main {
		font-family: 'LINESeedJP Rg';
	}

	body.page .main {

		h3,
		h4,
		h5,
		h6,
		strong {
			font-family: 'LINESeedJP Bd';
		}

		h2 {
			font-family: 'LINESeedJP Eb';
			font-size: inherit;
			position: relative;
			padding: 0;
			border-bottom: none;

			&.ark-block-heading__main {
				font-size: 2rem;
			}
		}

		.arkp-scPageMV02 {
			h2.ark-block-heading__main {
				font-size: 5rem;
			}
		}
	}

	@media (max-width: 767px) {
		body.post .main__body {
			font-size: inherit;
			line-height: 5.36585vw;
			max-width: 100%;
		}

		body.page .main {
			.arkp-scPageMV02 {
				h2.ark-block-heading__main {
					font-size: 4rem;
					padding-left: 2rem;
				}

				p {
					padding-left: 2rem;
					margin-top: 1rem;
				}
			}

			.line-entry {
				h2 {
					font-size: 7vw !important;
				}

				p {
					padding-right: 40vw;
					margin-top: 2rem;
				}
			}
		}
	}
</style>
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
