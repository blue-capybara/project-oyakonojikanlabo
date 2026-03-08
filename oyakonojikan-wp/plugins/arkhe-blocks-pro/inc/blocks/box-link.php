<?php
namespace Arkhe_Blocks\Block\BoxLink;

defined( 'ABSPATH' ) || exit;

register_block_type_from_metadata(
	ARKHE_BLOCKS_PATH . 'dist/gutenberg/blocks/box-link',
	[
		'render_callback'  => '\Arkhe_Blocks\Block\BoxLink\render_block',
	]
);

function render_block( $attrs, $content ) {
	$media_attrs = [
		'imgId'      => $attrs['imgId'] ?? 0,
		'imgUrl'     => $attrs['imgUrl'] ?? '',
		'imgAlt'     => $attrs['imgAlt'] ?? '',
		'imgW'       => $attrs['imgW'] ?? '',
		'imgH'       => $attrs['imgH'] ?? '',
	];

	// render_figure のフックに投げる用
	$block_attrs = [
		'anchor'    => $attrs['anchor'] ?? '',
		'className' => $attrs['className'] ?? '',
	];

	if ( false !== stripos( $content, '<!-- figure -->' ) ) {

		$ratio      = $attrs['ratio'] ?? '';
		$fixRatio   = $attrs['fixRatio'] ?? false;
		$isContain  = $attrs['isContain'] ?? false;
		$layout     = $attrs['layout'] ?? '';
		$isVertical = 'vertical' === $layout;

		$figure_class  = 'arkb-boxLink__figure';
		$figure_class .= $fixRatio ? ' is-fixed-ratio' : '';

		$img_add_class = '';
		$isFix         = $fixRatio || ! $isVertical;
		if ( $isFix ) {
			$img_add_class = $isContain ? 'arkb-obf-contain' : 'arkb-obf-cover';
		}

		$style = [];
		if ( $ratio ) {
			if ( $isVertical ) {
				// $style['paddingTop'] = "{$ratio}%";
				$style['--ark-thumb_ratio'] = "{$ratio}%";
			} elseif ( ! $isVertical ) {
				$style['flex-basis'] = "{$ratio}%";
			}
		}

		$media_attrs['figure_class']  = $figure_class;
		$media_attrs['img_add_class'] = $img_add_class;
		$media_attrs['style']         = $style;

		$figure  = render_figure( $media_attrs, $block_attrs );
		$content = str_replace( '<!-- figure -->', $figure, $content );

	} elseif ( false !== stripos( $content, '<!-- figure is-banner -->' ) ) {
		// バナースタイルの時のfigure

		$media_attrs['figure_class']  = 'arkb-boxLink__bg';
		$media_attrs['img_add_class'] = 'arkb-obf-cover';

		$figure  = render_figure( $media_attrs, $block_attrs );
		$content = str_replace( '<!-- figure is-banner -->', $figure, $content );
	}

	// MORE svg
	if ( false !== stripos( $content, '<!-- more-svg -->' ) ) {

		$svg     = render_svg( $block_attrs );
		$content = str_replace( '<!-- more-svg -->', $svg, $content );
	}

	return $content;
}



/**
 * figureの生成
 */
function render_figure( $media_attrs, $block_attrs ) {
	$imgId         = $media_attrs['imgId'];
	$imgUrl        = $media_attrs['imgUrl'];
	$imgAlt        = $media_attrs['imgAlt'];
	$imgW          = $media_attrs['imgW'];
	$imgH          = $media_attrs['imgH'];
	$figure_class  = $media_attrs['figure_class'];
	$img_add_class = $media_attrs['img_add_class'] ?? '';
	$style         = $media_attrs['style'] ?? [];

	$is_banner_style = ( false !== strpos( $block_attrs['className'], 'is-style-banner' ) );

	$figure_attrs = [
		'class' => $figure_class,
		'style' => \Arkhe_Blocks::convert_style_props( $style ) ?: false,
	];

	$img_attrs = [
		'class'       => \Arkhe_Blocks::classnames('arkb-boxLink__img', [
			"wp-image-{$imgId}" => $imgId,
			$img_add_class      => true,
		] ),
		'src'         => $imgUrl,
		'alt'         => $is_banner_style ? '' : $imgAlt,
		'width'       => $imgW ?: false,
		'height'      => $imgH ?: false,
		'aria-hidden' => $is_banner_style ? 'true' : false,
	];

	$return = '<figure ' . \Arkhe_Blocks::generate_html_attrs( $figure_attrs ) . '>' .
		'<img ' . \Arkhe_Blocks::generate_html_attrs( $img_attrs ) . '>' .
	'</figure>';

	if ( has_filter( 'arkb_boxlink__figure_html' ) ) {
		$return = apply_filters( 'arkb_boxlink__figure_html', $return, $media_attrs, $block_attrs );
	}
	return $return;
}



/**
 * MORE SVG
 */
function render_svg( $block_attrs ) {
	$svg = '<svg class="arkb-boxLink__more__svg" width="16" height="16" viewBox="0 0 32 32" role="img" aria-hidden="true">' .
			'<path d="M30.4,15.5l-4.5-4.5l-1.1,1.1l3.4,3.4H1.6v1.6h28.8V15.5z" />' .
		'</svg>';

	if ( has_filter( 'arkb_boxlink__svg' ) ) {
		$svg = apply_filters( 'arkb_boxlink__svg', $svg, $block_attrs );
	}
	return $svg;
}
