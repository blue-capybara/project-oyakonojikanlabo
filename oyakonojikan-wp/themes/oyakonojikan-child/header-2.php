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
</head>

<body <?php body_class('dinopedia'); ?>>
	<div class="container">
		<header>
			<div class="openbtn1"><span></span><span></span><span></span></div>
			<h1>
				<div class="logos">
					<div class="logo__1">
						<a href="<?php echo esc_url(home_url()); ?>" class="top">
							<object data="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/logo-dinop.svg" type="image/svg+xml">
								<picture>
									<source type="image/webp" srcset="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/logo-dinop.webp">
									<img src="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/logo-dinop.png" alt="親子の時間研究所×ASOBISKI">
								</picture>
							</object>
						</a>
					</div>
				</div>
			</h1>
		</header>