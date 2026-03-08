<?php

/**
 * The header for our theme
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package OyakoNoJikan
 */

?>
<!doctype html>
<html <?php language_attributes(); ?>>

<head>
	<!-- Google tag (gtag.js) -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-1X3MS606B9"></script>
	<script>
		window.dataLayer = window.dataLayer || [];

		function gtag() {
			dataLayer.push(arguments);
		}
		gtag('js', new Date());

		gtag('config', 'G-1X3MS606B9');
	</script>
	<meta charset="<?php bloginfo('charset'); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">

	<?php wp_head(); ?>
	<style>
		.main {
			max-width: 824px;
		}
	</style>
</head>

<body <?php body_class(); ?>>
	<div class="container">
		<header>
			<div class="openbtn1"><span></span><span></span><span></span></div>
			<h1>
				<div class="logos">
					<div class="logo__1">
						<a href="<?php echo esc_url(home_url()); ?>" class="top">
							<object data="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/oyakonojikan_logo.svg" type="image/svg+xml">
								<picture>
									<source type="image/webp" srcset="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/oyakonojikan_logo.webp">
									<img src="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/oyakonojikan_logo.png" alt="親子の時間研究所">
								</picture>
							</object>
						</a>
					</div>
					<!-- 					<div class="logo__2">
						<a href="<?php echo esc_url(home_url()); ?>" class="top">
							<object data="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/logo02.svg" type="image/svg+xml">
								<picture>
									<source type="image/webp" srcset="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/logo02.webp">
									<img src="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/logo02.png" alt="親子の時間研究所">
								</picture>
							</object>
						</a>
					</div> -->
				</div>
			</h1>
		</header>