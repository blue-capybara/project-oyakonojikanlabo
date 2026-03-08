<?php
$tburl = SCF::get_option_meta('topbanner-options', 'topbanner-url');
$pcimg = SCF::get_option_meta('topbanner-options', 'topbannner-pc');
$spimg = SCF::get_option_meta('topbanner-options', 'topbannner-sp');
$bgcol = SCF::get_option_meta('topbanner-options', 'topbanner-bg');

$tburl2 = SCF::get_option_meta('topbanner-options', 'topbanner2-url');
$pcimg2 = SCF::get_option_meta('topbanner-options', 'topbannner2-pc');
$spimg2 = SCF::get_option_meta('topbanner-options', 'topbannner2-sp');

$pcimg = wp_get_attachment_image_src($pcimg, 'full');
$pcimgUrl = esc_url($pcimg[0]);

$spimg = wp_get_attachment_image_src($spimg, 'full');
$spimgUrl = esc_url($spimg[0]);

$pcimg2 = wp_get_attachment_image_src($pcimg2, 'full');
$pcimgUrl2 = esc_url($pcimg2[0]);

$spimg2 = wp_get_attachment_image_src($spimg2, 'full');
$spimgUrl2 = esc_url($spimg2[0]);

$check2 = SCF::get_option_meta('topbanner-options', 'check2');

?>
<!--トップバナー-->
<style>
	.top_title {
		position: relative;
		margin: 40px auto;
	}

	/* .top_title::after {
		display: block;
		content: "";
		width: 100%;
		height: 1px;
		background-color: #e6e6e6;
		position: absolute;
		bottom: 0;
	} */

	.top_title h2 {
		font-weight: 700;
		border-bottom: none !important;
		display: block;
		text-align: center;
		font-family: europa, sans-serif;
		letter-spacing: 0.1em;
		margin-bottom: 58px;
	}

	.top_title h2::before,
	.top_title h2::after {
		display: none;
	}

	.top_title_new {
		flex-basis: 100%;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.bottom-togglebtn {
		margin-bottom: 40px;
	}

	.postcards:nth-of-type(-n+4) {
		flex-basis: calc(50% - 17px);
		padding-bottom: 22px;
	}

	.postcards:nth-of-type(n+4) {
		flex-basis: calc(100% / 3 - 19.32px);
		padding-bottom: 6px;
	}

	#ads {
		margin-top: 11px;
	}

	@media screen and (max-width: 767px) {
		.bottom-togglebtn {
			margin-bottom: 7.5609756vw;
			height: auto !important;
		}

		#ads {
			margin-top: 0;
		}

		.ads {
			gap: 7.5609756vw;
			padding: 0 0 7.5609756vw;
		}
	}
</style>
<aside id="ads">
	<div class="bottom-togglebtn top_title">
		<h2><span>INFORMATION</span></h2>
		<p>.</p>
	</div>
	<div id="cart_msg">.</div>
	<div class="ads" style="flex-wrap: wrap;">
		<?php if ($check2) : ?>
			<?php // トップバナー設定の設定2を使用にチェックを入れると以下が発火
			$bans = SCF::get_option_meta('topbanner-options', 'bans');
			$date_format = 'Y-m-d H:i';
			$count = 0;
			foreach ($bans as $bans_name => $bans_value) {
				if ($count >= 4) {
					break;
				} else {
					$date_flg   = false;
					$date_start = $bans_value['start_date'];
					$date_end   = $bans_value['end_date'];
					$linkurl = $bans_value['linkurl'];
					$image_pc =	$bans_value['image_pc'];
					$image_pc = wp_get_attachment_image_src($image_pc, 'full');
					$imagePc = esc_url($image_pc[0]);
					$image_sp =	$bans_value['image_sp'];
					$image_sp = wp_get_attachment_image_src($image_sp, 'full');
					$imageSp = esc_url($image_sp[0]);
					if ($date_start && $date_end) {
						$DateTime_start = new DateTime($date_start);
						$DateTime_end   = new DateTime($date_end);
						$DateTime_now   = new DateTime(date_i18n($date_format));
						if ($DateTime_start <= $DateTime_now  && $DateTime_now < $DateTime_end) {
							$date_flg = true;
						}
					} ?>
					<?php if ($date_flg) : ?>
						<a href="<?php echo $linkurl; ?>" rel="noreferrer noopener" style="flex-basis:calc(50% - 20px);">
							<picture>
								<source srcset="<?php echo $imagePc; ?>" media="(min-width: 768px)">
								<img src="<?php echo $imageSp; ?>" alt="トップバナー">
							</picture>
						</a>
						<?php $count++; ?>
					<?php else : ?>
						<?php continue; ?>
					<?php endif; ?>
				<?php } ?>
			<?php } ?>
		<?php else : ?>
			<a href="<?php echo $tburl; ?>" rel="noreferrer noopener">
				<picture>
					<source srcset="<?php echo $pcimgUrl; ?>" media="(min-width: 768px)">
					<img src="<?php echo $spimgUrl; ?>" alt="トップバナー">
				</picture>
			</a>
			<a href="<?php echo $tburl2; ?>" rel="noreferrer noopener">
				<picture>
					<source srcset="<?php echo $pcimgUrl2; ?>" media="(min-width: 768px)">
					<img src="<?php echo $spimgUrl2; ?>" alt="トップバナー">
				</picture>
			</a>
		<?php endif; ?>
	</div>
</aside>
<!--/トップバナー-->