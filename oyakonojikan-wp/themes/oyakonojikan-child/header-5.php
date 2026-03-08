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
	<meta charset="<?php bloginfo('charset'); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">

	<?php wp_head(); ?>
	<style>
		body {
			background: #fffff3;
		}

		body.post .main a {
			color: #64bfaa;
		}

		.container {
			background: linear-gradient(to bottom, #fffff3 0%, #ffffff 33%);
		}

		.postcards:nth-of-type(-n+4) {
			min-height: auto;
		}

		.logos .logo__1 {
			margin: auto;
			width: 50%;
		}

		@media (max-width: 767px) {
			.logos .logo__1 {
				margin: 0 auto;
				width: 100%;
			}
		}
	</style>
</head>

<body <?php body_class('dinopedia'); ?>>
	<div class="container">
		<header>
			<div class="openbtn1"><span></span><span></span><span></span></div>
			<h1>
				<div class="logos">
					<div class="logo__1">
						<a href="<?php echo esc_url(home_url()); ?>" class="top">
							<img src="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/curiositylabo_bar.png" alt="好奇心のとびらー親子の時間研究所">
						</a>
					</div>
				</div>
			</h1>
		</header>