<?php

/**
 * The sidebar containing the main widget area
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
<div class="navis" id="g-nav-list">
	<nav class="gnavi">
		<ul class="gnavi__inner">
			<?php
			if (has_nav_menu('side')) {
				$args = array(
					'theme_location' => 'side',
					'container'      => false,
					'items_wrap'     => '%3$s'
				);
				wp_nav_menu($args);
			}; ?>
			<?php if (is_active_sidebar('sidebar-1')) { ?>
				<li class="widget-area">
					<?php dynamic_sidebar('sidebar-1'); ?>
				</li>
			<?php } ?>
			<?php
			if (has_nav_menu('side-sub')) {
				$args2 = array(
					'theme_location' => 'side-sub',
					'container'      => false,
					'items_wrap'     => '%3$s'
				);
				wp_nav_menu($args2);
			}; ?>
			<li>
				<div class="gnavi__sns">
					<div class="gnavi__sns__inner"><a class="snsicon" href="https://www.facebook.com/oyakonojikanlabo/" rel="noreferrer noopener"><span class="icon-facebook"></span></a></div>
					<div class="gnavi__sns__inner"><a class="snsicon" href="https://twitter.com/oyakonojikan" rel="noreferrer noopener"><span class="icon-xicon"></span></a></div>
					<div class="gnavi__sns__inner"><a class="snsicon" href="https://www.instagram.com/oyako_jikan_labo/" rel="noreferrer noopener"><span class="icon-instagram"></span></a></div>
					<!-- <div class="gnavi__sns__inner"><a class="snsicon" href="#" rel="noreferrer noopener"><span class="icon-youtube"></span></a></div> -->
					<div class="gnavi__sns__inner"><a class="snsicon" href="https://line.me/R/ti/p/%40tzt6644b" rel="noreferrer noopener"><span class="icon-linelogo2"></span></a></div>
				</div>
			</li>
		</ul>
	</nav>
</div>
<?php
// add_filter('the_title', array($Easy_Series, 'the_title'));
?>