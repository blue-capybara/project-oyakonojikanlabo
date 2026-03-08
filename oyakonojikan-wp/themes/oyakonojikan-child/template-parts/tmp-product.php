<?php
$prpage = SCF::get_option_meta('page-product-options', 'prpage');
foreach ($prpage as $prpage) {
	$primage = $prpage['primage'];
	$prtitle = $prpage['prtitle'];
	$prsubtitle = $prpage['prsubtitle'];
	$prexcerpt = $prpage['prexcerpt'];
	$prlink = $prpage['prlink'];
	$prflag = $prpage['prflag'];
	$primage =	wp_get_attachment_image_src($primage, 'full');
	$primgUrl =	esc_url($primage[0]);
	$prtag = $prpage['prtag'];
?>

	<!-- posts -->
	<div class="postcards postcardsWrap">
		<div class="postcards product">
			<div class="postcards__image"><a href="<?php echo $prlink; ?>"><img src="<?php if ($primgUrl) { ?><?php echo $primgUrl; ?><?php } else { ?><?php echo get_stylesheet_directory_uri() ?>/assets/img/noimage.jpg<?php } ?>" alt="<?php echo $prtitle ?>"></a></div>
			<div class="postcards__inner">
				<?php if ($prflag) { ?>
					<div class="ribbon"><span>PICK UP</span></div>
				<?php } ?>
				<?php
				if (!empty($prsubtitle)) { ?>
					<div class="postcards__sub-ttl"><?php echo $prsubtitle; ?></div>
				<?php } ?>
				<div class="postcards__title">
					<h2><a href="<?php echo $prlink; ?>"><?php echo $prtitle ?></a></h2>
				</div>
				<div class="postcards__exc">
					<?php
					if (mb_strlen($prexcerpt, 'UTF-8') > 50) {
						$d = str_replace('\n', '', mb_substr(strip_tags($prexcerpt), 0, 50, 'UTF-8'));
						echo $d . '…';
					} else {
						echo str_replace('\n', '', strip_tags($prexcerpt));
					}
					?>
				</div>

			</div>
			<div class="postcards__cta"><a href="<?php echo $prlink; ?>">詳しくはこちら</a></a></div>
		</div>
		<?php if ($prtag) { ?>
			<div class="prtags">
				<?php
				foreach ($prtag as $field) {
					$term = get_term($field);
					$tagurl = esc_url( home_url()) .'/tag/' . $term->slug;
				?>
					<div class="prtag"><a href="<?php echo $tagurl; ?>"># 関連記事 「<?php echo $term->name; ?>」</a></div>
				<?php } ?>
			</div>
		<?php } ?>
	</div>
	<!-- /posts -->
<?php
}
?>