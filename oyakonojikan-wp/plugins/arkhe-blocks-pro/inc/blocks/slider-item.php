<?php
namespace Arkhe_Blocks\Block\Slider_Item;

use \Arkhe_Blocks as Arkb;
use \Arkhe_Blocks\Style as Style;

defined( 'ABSPATH' ) || exit;

register_block_type_from_metadata(
	ARKHE_BLOCKS_PATH . 'dist/gutenberg/blocks/slider-item',
	[
		'render_callback'  => __NAMESPACE__ . '\cb',
	]
);

// phpcs:disable WordPress.NamingConventions.ValidVariableName.InterpolatedVariableNotSnakeCase
function cb( $attrs, $content ) {

	ob_start();

	if ( 'media' === $attrs['variation'] ) {
		render_media_slider( $attrs );
	} else {
		render_rich_slider( $attrs, $content );
	}
	return ob_get_clean();
	// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
}


/**
 * リッチスライダー
 */
function render_rich_slider( $attrs, $content ) {

	$filter          = $attrs['filter'];
	$contentPosition = $attrs['contentPosition'];
	$href            = $attrs['href'] ?? '';
	$media           = $attrs['media'];
	$mediaUrl        = $media['url'] ?? '';
	$opacity         = $attrs['opacity'] ?? 50;

	// colorLayer 属性
	$color_layer_style = Arkb::convert_style_props( [
		'background' => $attrs['bgGradient'] ?: $attrs['bgColor'],
		'opacity'    => $opacity * 0.01, // round()
	] );

	// body 属性
	$body_style = Arkb::convert_style_props( [
		'color' => $attrs['textColor'],
	] );
	$body_attrs = [
		'data-content' => str_replace( ' ', '-', $contentPosition ),
		'style'        => $body_style ?: false,
	];

	// link
	$a_tag = [];

	// リンクがある場合
	if ( $href ) {
		$isNewTab  = $attrs['isNewTab'] ?? false;
		$rel       = $attrs['rel'] ?? '';
		$ariaLabel = $attrs['ariaLabel'] ?? '';

		$body_attrs['data-arkb-linkbox'] = '1';
		$body_attrs['aria-label']        = $ariaLabel ?: false;

		$a_tag = Arkb::generate_html_tag( 'a', [
			'href'           => $href,
			'target'         => $isNewTab ? '_blank' : false,
			'rel'            => $rel ?: false,
			'data-arkb-link' => '1',
			'aria-hidden'    => 'true',
		], esc_html( $ariaLabel ) );

		Arkb::$use['linkbox'] = true;
	}

	// スライダーclass名
	$slide_class      = 'ark-block-slider__slide swiper-slide';
	$slide_body_class = 'ark-block-slider__body';

	// padding
	$paddingStyles = [];
	$paddingPC     = $attrs['paddingPC'] ?? null;
	if ( $paddingPC ) {
		$paddingStyles['all']['--arkb-padding'] = Style::get_custom_padding( $paddingPC, '0', '2rem 2rem 2rem 2rem' );
	}
	$paddingSP = $attrs['paddingSP'] ?? null;
	if ( $paddingSP ) {
		$paddingStyles['sp']['--arkb-padding'] = Style::get_custom_padding( $paddingSP, '0' );
	}

	// 動的スタイルの処理 (1枚目固定時に構造が変わるのでbodyにCSSを付与)
	$unique_id = Style::generate_dynamic_block_styles( $paddingStyles, [ 'prefix' => 'arkb-slideBody--' ] );
	if ( $unique_id ) {
		$slide_body_class .= " $unique_id";
	};

	// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
	// memo: HTMLコメントはコンテンツの抽出に必要。
	?>
	<div class="<?=$slide_class?>">
		<?php if ( $mediaUrl ) : ?>
			<div class="ark-block-slider__media arkb-absLayer">
				<?php render_slide_media_layer( $attrs ); ?>
			</div>
		<?php endif; ?>
		<div class="ark-block-slider__color arkb-absLayer" style="<?=esc_attr( $color_layer_style )?>"></div>
		<?php if ( 'off' !== $filter ) : ?>
			<div class="c-filterLayer -filter-<?=esc_attr( $filter )?> arkb-absLayer"></div>
		<?php endif; ?>
		<!-- body-start -->
		<div class="<?=esc_attr( $slide_body_class )?>" <?=Arkb::generate_html_attrs( $body_attrs )?>>
			<div class="ark-block-slider__bodyInner ark-keep-mt--s">
				<?=$content?>
			</div>
			<?php if ( $a_tag ) echo $a_tag; ?>
		</div>
		<!-- body-end -->
	</div>
	<?php
	// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
}


/**
 * メディアスライダー
 */
function render_media_slider( $attrs ) {
	// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
	$href = $attrs['href'] ?? '';
	if ( $href ) :
		$isNewTab   = $attrs['isNewTab'] ?? false;
		$rel        = $attrs['rel'] ?? '';
		$link_attrs = [
			'href'   => $href,
			'target' => $isNewTab ? '_blank' : false,
			'rel'    => $rel ?: false,
		];
	?>
		<div class="ark-block-slider__slide swiper-slide">
			<a class="ark-block-slider__media" <?=Arkb::generate_html_attrs( $link_attrs )?>>
				<?php render_slide_media_layer( $attrs ); ?>
			</a>
		</div>
	<?php else : ?>
		<div class="ark-block-slider__slide swiper-slide">
			<div class="ark-block-slider__media">
				<?php render_slide_media_layer( $attrs ); ?>
			</div>
		</div>
	<?php
	endif;
	// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
}


function render_slide_media_layer( $attrs ) {

	// mediaデータ
	$media     = $attrs['media'];
	$mediaId   = $media['id'] ?? 0;
	$mediaUrl  = $media['url'] ?? '';
	$mediaType = $media['type'] ?? '';
	$mediaAlt  = $media['alt'] ?? '';
	// $mediaSize  = $media['size'] ?? 'full';

	// mediaSP
	$mediaSP     = $attrs['mediaSP'];
	$mediaIdSP   = $mediaSP['id'] ?? 0;
	$mediaUrlSP  = $mediaSP['url'] ?? '';
	$mediaTypeSP = $mediaSP['type'] ?? '';
	$mediaAltSP  = $mediaSP['alt'] ?? '';
	// $mediaSizeSP  = $mediaSP['size'] ?? 'full';

	if ( ! $mediaUrl ) {
		return '';
	}

	$is_rich_slider = 'rich' === $attrs['variation'];

	$media_html = '';

	// SP用メディア
	if ( $mediaUrlSP ) {
		$props = [
			'src'        => $mediaUrlSP,
			'width'      => $mediaSP['width'] ?? false,
			'height'     => $mediaSP['height'] ?? false,
		];

		if ( isset( $attrs['focalPointSP'] ) ) {
			$x              = $attrs['focalPointSP']['x'] * 100;
			$y              = $attrs['focalPointSP']['y'] * 100;
			$props['style'] = "object-position: {$x}% {$y}%";
		}

		if ( 'video' === $mediaTypeSP ) {
			$media_html .= Arkb::generate_html_tag( 'video', array_merge( $props, [
				'class'      => 'ark-block-slider__video arkb-obf-cover arkb-only-sp',
				'custom'     => $is_rich_slider ? 'autoplay loop playsinline muted' : 'controls',
			] ), '' );
		} elseif ( 'image' === $mediaTypeSP ) {
			$class       = Arkb::classnames( 'ark-block-slider__img arkb-obf-cover arkb-only-sp', [
				"wp-image-{$mediaIdSP}" => $mediaIdSP,
			] );
			$media_html .= Arkb::generate_html_tag( 'img', array_merge( $props, [
				'class'       => $class,
				'alt'         => $is_rich_slider ? '' : $mediaAltSP,
				'decording'   => 'async',
				'aria-hidden' => $is_rich_slider ? 'true' : false,
				// 'size'        => $media['size'] ?? 'full',
				// 'sizes'       => $sizes,
			] ) );
		}
	}

	// PC用メディア
	if ( $mediaUrl ) {
		$props = [
			'src'        => $mediaUrl,
			'width'      => $media['width'] ?? false,
			'height'     => $media['height'] ?? false,
		];

		if ( isset( $attrs['focalPoint'] ) ) {
			$x              = $attrs['focalPoint']['x'] * 100;
			$y              = $attrs['focalPoint']['y'] * 100;
			$props['style'] = "object-position: {$x}% {$y}%";
		}

		if ( 'video' === $mediaType ) {
			$class       = Arkb::classnames( 'ark-block-slider__video arkb-obf-cover', [
				'arkb-only-pc' => $mediaTypeSP,
			] );
			$media_html .= Arkb::generate_html_tag( 'video', array_merge( $props, [
				'class'      => $class,
				'custom'     => $is_rich_slider ? 'autoplay loop playsinline muted' : 'controls',
			] ), '' );
		} elseif ( 'image' === $mediaType ) {
			$class = Arkb::classnames( 'ark-block-slider__img arkb-obf-cover', [
				"wp-image-{$mediaId}" => $mediaId,
				'arkb-only-pc'        => $mediaTypeSP,
			] );

			$media_html .= Arkb::generate_html_tag( 'img', array_merge( $props, [
				'class'       => $class,
				'alt'         => $is_rich_slider ? '' : $mediaAlt,
				'decording'   => 'async',
				'aria-hidden' => $is_rich_slider ? 'true' : false,
				// 'size'        => $media['size'] ?? 'full',
				// 'sizes'       => $sizes,
			] ) );
		}
	}

	// サムネイルページネーション用
	if ( is_array( Arkb::$slide_images ) ) {
		Arkb::$slide_images[] = $media_html;
	}

	// メディア部分のHTMLをフックで上書き可能に
	echo apply_filters( 'arkb_slide__media_html', $media_html, $attrs ); // phpcs:ignore
}
