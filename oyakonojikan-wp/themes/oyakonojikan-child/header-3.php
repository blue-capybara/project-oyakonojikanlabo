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
	<script>
		function addClass(A) {
			document.documentElement.classList.add(A)
		}
		var avif = new Image;

		function check_webp_feature(a) {
			var e = new Image;
			e.onload = function() {
				var A = 0 < e.width && 0 < e.height;
				a(A)
			}, e.onerror = function() {
				a(!1)
			}, e.src = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="
		}
		avif.src = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=", avif.onload = function() {
			addClass("avif")
		}, avif.onerror = function() {
			check_webp_feature(function(A) {
				return addClass(A ? "webp" : "fallback")
			})
		};
	</script>
	<style>
		body.leolionni {
			background-image: url(<?php echo get_stylesheet_directory_uri(); ?>/assets/img/leolionni/bgimage.jpg);
			background-size: calc(275px * 2);
			background-position: calc(50% - 420px) 0;
			margin: 0;
			padding: 0;
		}

		.avif body.leolionni {
			background-image: url(<?php echo get_stylesheet_directory_uri(); ?>/assets/img/leolionni/bgimage.avif);
		}

		.webp body.leolionni {
			background-image: url(<?php echo get_stylesheet_directory_uri(); ?>/assets/img/leolionni/bgimage.webp);
		}

		body.leolionni .main h2 {
			background-image: url(<?php echo get_stylesheet_directory_uri(); ?>/assets/img/leolionni/headline.png);
		}

		.avif body.leolionni .main h2 {
			background-image: url(<?php echo get_stylesheet_directory_uri(); ?>/assets/img/leolionni/headline.avif);
		}

		.webp body.leolionni .main h2 {
			background-image: url(<?php echo get_stylesheet_directory_uri(); ?>/assets/img/leolionni/headline.webp);
		}
	</style>
</head>

<body <?php body_class('leolionni'); ?>>
	<div class="container">
		<header>
			<div class="openbtn1"><span></span><span></span><span></span></div>
			<h1>
				<div class="logos">
					<div class="logo__3">
						<a href="<?php echo esc_url(home_url()); ?>" class="top">
							<picture>
								<source srcset="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/leolionni/logo_hero.avif" type="image/avif">
								<source srcset="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/leolionni/logo_hero.webp" type="image/webp">
								<img src="<?php echo get_stylesheet_directory_uri(); ?>/assets/img/leolionni/logo_hero.jpg" alt="親子の時間研究所 x レオ・レオニ">
							</picture>
						</a>
					</div>
				</div>
			</h1>
		</header>