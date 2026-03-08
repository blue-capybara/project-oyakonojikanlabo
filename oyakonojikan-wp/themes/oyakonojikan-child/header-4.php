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

<body <?php body_class('nontanfair'); ?>>
	<div class="container">
		<header>
			<div class="openbtn1"><span></span><span></span><span></span></div>
			<h1>
				<div class="logos">
					<div class="logo__4">
						<a href="<?php echo esc_url(home_url()); ?>" class="top">


							<?php if (function_exists('wp_is_mobile') && wp_is_mobile()) : ?>
								<object data="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/nontanfair/nontanfair_hero_sp.svg" type="image/svg+xml">
									<picture>
										<source type="image/webp" srcset="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/nontanfair/nontanfair_hero_sp.webp">
										<img src="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/nontanfair/nontanfair_hero_sp.png" alt="親子の時間研究所 ノンタンフェア">
									</picture>
								</object>
							<?php else : ?>
								<object data="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/nontanfair/nontanfair_hero_pc.svg" type="image/svg+xml">
									<picture>
										<source type="image/webp" srcset="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/nontanfair/nontanfair_hero_pc.webp">
										<img src="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/nontanfair/nontanfair_hero_pc.png" alt="親子の時間研究所 ノンタンフェア">
									</picture>
								</object>
							<?php endif; ?>
						</a>
					</div>
				</div>
			</h1>
		</header>