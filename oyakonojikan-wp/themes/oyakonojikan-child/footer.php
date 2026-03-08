<?php

/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package OyakoNoJikan
 */

?>
<?php
// global $Easy_Series;
// remove_filter('the_title', array($Easy_Series, 'the_title'));
?>
<?php if (function_exists('wp_is_mobile') && wp_is_mobile()) : ?>
	<style>
		.fmenu {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			display: flex;
			justify-content: space-around;
			align-items: center;
			background-color: #fff;
			border-top: 1px solid #ccc;
			padding: 10px;
			z-index: calc(infinity);
			transition: transform 0.3s ease-in-out;
		}

		.fmenu a {
			display: block;
			text-align: center;
			font-size: 11px;
			color: #545b63;
		}

		.fmenu a span {
			font-size: 24px;
			display: block;
		}
	</style>
	<div class="fmenu">
		<?php
		if (has_nav_menu('spfooter')) {
			$args = array(
				'theme_location' => 'spfooter',
				'container'      => false,
				'items_wrap'     => '%3$s',
				//'echo'           => false,
				'depth'          => 0,
				'add_li_class'   => 'nav-item', // liタグへclass追加
				'add_a_class'    => 'nav-link text-white' // aタグへclass追加
			);
			wp_nav_menu($args);
			//echo strip_tags(wp_nav_menu($args), '<a>');
		}; ?>
	</div>
<?php else : ?>
<?php endif; ?>
<footer id="footer">
	<?php
	if (has_nav_menu('footer')) {
		$args = array(
			'theme_location' => 'footer',
		);
		wp_nav_menu($args);
	}; ?>
	<div class="gnavi__sns">
		<div class="gnavi__sns__inner"><a class="snsicon" href="https://www.facebook.com/oyakonojikanlabo/" rel="noreferrer noopener"><span class="icon-facebook"></span></a></div>
		<div class="gnavi__sns__inner"><a class="snsicon" href="https://twitter.com/oyakonojikan" rel="noreferrer noopener"><span class="icon-xicon"></span></a></div>
		<div class="gnavi__sns__inner"><a class="snsicon" href="https://www.instagram.com/oyako_jikan_labo/" rel="noreferrer noopener"><span class="icon-instagram"></span></a></div>
		<!-- <div class="gnavi__sns__inner"><a class="snsicon" href="#" rel="noreferrer noopener"><span class="icon-youtube"></span></a></div> -->
		<div class="gnavi__sns__inner"><a class="snsicon" href="https://line.me/R/ti/p/%40tzt6644b" rel="noreferrer noopener"><span class="icon-linelogo2"></span></a></div>
	</div>
	<p><small>&copy; 2017-
			<script type="text/javascript">
				document.write(new Date().getFullYear());
			</script> 株式会社ライブエンタープライズ
		</small></p>
</footer>
</div>

<?php wp_footer(); ?>
<script>
	var prevScrollpos = window.pageYOffset;
	window.onscroll = function() {
		var currentScrollPos = window.pageYOffset;
		if (prevScrollpos > currentScrollPos) {
			document.querySelector(".fmenu").style.transform = "translateY(0)";
		} else {
			document.querySelector(".fmenu").style.transform = "translateY(100%)";
		}
		prevScrollpos = currentScrollPos;
	}
</script>
</body>

</html>