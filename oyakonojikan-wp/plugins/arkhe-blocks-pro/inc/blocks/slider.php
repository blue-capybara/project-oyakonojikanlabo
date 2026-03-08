<?php
namespace Arkhe_Blocks\Block\Slider;

defined( 'ABSPATH' ) || exit;

use \Arkhe_Blocks\Style as Style;

register_block_type_from_metadata(
	ARKHE_BLOCKS_PATH . 'dist/gutenberg/blocks/slider',
	[
		'render_callback'  => '\Arkhe_Blocks\Block\Slider\cb',
	]
);

// phpcs:disable WordPress.NamingConventions.ValidVariableName.InterpolatedVariableNotSnakeCase
function cb( $attrs, $content ) {

	// Slider使われたことを変数にセット
	\Arkhe_Blocks::$use['slider--swiper'] = true;

	$anchor     = $attrs['anchor'] ?? '';
	$className  = $attrs['className'] ?? '';
	$align      = $attrs['align'] ?? '';
	$variation  = $attrs['variation'] ?? 'media';
	$slideColor = $attrs['slideColor'] ?? '#000000';
	$fixFirst   = $attrs['fixFirst'] ?? false;
	$options    = $attrs['options'];
	$direction  = $options['direction'] ?? 'horizontal';
	$showThumb  = $options['showThumb'] ?? false;

	$optionData = wp_json_encode( $options, JSON_UNESCAPED_UNICODE );
	$optionData = str_replace( '"', '', $optionData );
	$optionData = str_replace( 'true', '1', $optionData );
	$optionData = str_replace( 'false', '0', $optionData );
	$is_rich    = 'rich' === $variation;

	// <style>出力するもの
	$the_styles = [];

	// class名
	$block_class = "ark-block-slider -$variation";
	if ( $align ) {
		$block_class .= " align$align";
	}
	if ( $className ) {
		$block_class .= " $className";
	}

	// 高さ
	$height_type = $attrs['height'] ?? '';
	if ( $is_rich && 'custom' === $height_type ) {
		$heightPC = $attrs['heightPC'] ?? '';
		if ($heightPC) $the_styles['all']['--arkb-slider-height'] = $heightPC;

		$heightSP = $attrs['heightSP'] ?? '';
		if ($heightSP) $the_styles['sp']['--arkb-slider-height'] = $heightSP;
	}

	// スライドテーマカラー
	if ( '#000000' !== $slideColor ) {
		$the_styles['all']['--swiper-theme-color'] = $slideColor;
	}

	// 動的スタイルの処理
	$unique_id = Style::generate_dynamic_block_styles( $the_styles, [ 'prefix' => 'arkb-slider--' ] );
	if ( $unique_id ) {
		$block_class .= " $unique_id";
	};

	// 属性
	$block_props = [
		'class'          => $block_class,
		'id'             => $anchor ?: false,
		'data-height'    => $is_rich ? $height_type : false,
		'data-inner'     => 'full' === $align ? $attrs['innerSize'] : false,
		'data-direction' => $direction,
		'data-option'    => $optionData,
	];

	// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
	ob_start();
	?>
	<div <?=\Arkhe_Blocks::generate_html_attrs( $block_props )?>>
		<div class="ark-block-slider__inner swiper -main">
			<?php
				if ( $fixFirst ) :
				// 最初のコンテンツを抜き出す
				$content = get_first_content( $content );
				render_first_content();
				endif;
			?>
			<div class="swiper-wrapper">
				<?=$content?>
			</div>
			<?php render_navigations( $options['pagination'], $options['showArrow'] ); ?>
		</div>
		<?php if ( $showThumb ) render_thumb_slider(); ?>
	</div>
<?php

	// スライド画像データをリセット
	\Arkhe_Blocks::$slide_images = [];

	return ob_get_clean();
}



/**
 * ナビゲーションの出力
 */
function render_navigations( $pagination, $showArrow ) {

	if ( 'scrollbar' === $pagination ) {
		echo '<div class="swiper-scrollbar"></div>';
	} elseif ( 'off' !== $pagination ) {
		echo '<div class="swiper-pagination"></div>';
	}

	// 矢印ボタン
	if ( $showArrow ) :
	?>
		<div class="swiper-button-prev ark-block-slider__nav -prev" tabIndex="0" role="button" aria-label="Previous slide">
			<?php render_arrow_svg( 'left' ); ?>
		</div>
		<div class="swiper-button-next ark-block-slider__nav -next" tabIndex="0" role="button" aria-label="Next slide">
			<?php render_arrow_svg( 'right' ); ?>
		</div>
	<?php
	endif;
}

/**
 * arrow svg
 */
function render_arrow_svg( $position ) {
	ob_start();
	if ( 'left' === $position ) :
?>
	<svg x="0px" y="0px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" focusable="false">
		<path d="M16.4,2.6l-0.8-0.7c-0.2-0.2-0.5-0.2-0.7,0l-8.7,9.7c-0.2,0.2-0.2,0.5,0,0.7l8.7,9.7c0.2,0.2,0.5,0.2,0.7,0l0.8-0.7 c0.2-0.2,0.2-0.5,0-0.7l-7.7-8.3c-0.2-0.2-0.2-0.5,0-0.7l7.7-8.3C16.6,3.1,16.6,2.8,16.4,2.6z"/>
	</svg>
<?php else : ?>
	<svg x="0px" y="0px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" focusable="false">
		<path d="M7.9,21.4l0.8,0.7c0.2,0.2,0.5,0.2,0.7,0l8.7-9.7c0.2-0.2,0.2-0.5,0-0.7L9.4,2c-0.2-0.2-0.5-0.2-0.7,0L7.9,2.6 c-0.2,0.2-0.2,0.5,0,0.7l7.7,8.3c0.2,0.2,0.2,0.5,0,0.7l-7.7,8.3C7.7,20.9,7.7,21.2,7.9,21.4z"/>
	</svg>
	<?php
	endif;
	echo apply_filters( 'arkb_slider__arrow_svg', ob_get_clean(), $position );
}


/**
 * サムネイルナビゲーション
 */
function render_thumb_slider() {

	echo '<div class="swiper -thumb"><div class="swiper-wrapper">';
	foreach ( \Arkhe_Blocks::$slide_images as $media_html ) :
		$media_html = str_replace( ' controls', ' playsinline muted', $media_html );
		echo '<div class="swiper-slide">' . $media_html . '</div>';
	endforeach;

	echo '</div></div>';
}


/**
 * 1枚目のコンテンツをキャッシュへ保存し、他を削除
 */
function get_first_content( $content ) {
	$pattern = '/<!-- body-start -->(.*?)<!-- body-end -->/is';
	return preg_replace_callback( $pattern, function( $matches ) {

		$first_content = $GLOBALS['arkb_slider_first_content'] ?? '';
		if ( ! $first_content ) {
			$GLOBALS['arkb_slider_first_content'] = $matches[0];
		}
		return '<div class="ark-block-slider__body"></div>';
	}, $content );
}


/**
 * 1枚目のコンテンツを出力
 */
function render_first_content() {
	if ( ! isset( $GLOBALS['arkb_slider_first_content'] ) ) return;

	$first_content = $GLOBALS['arkb_slider_first_content'];
	echo preg_replace( '%class="ark-block-slider__body%', 'class="ark-block-slider__body -is-fixed', $first_content, 1 );
	unset( $GLOBALS['arkb_slider_first_content'] );
}
