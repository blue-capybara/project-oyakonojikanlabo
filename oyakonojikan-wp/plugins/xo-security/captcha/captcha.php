<?php
/**
 * CAPTCHA image
 *
 * @package xo-security
 * @copyright 2017 ishitaka
 * @author ishitaka
 */

if ( ! function_exists( 'mb_internal_encoding' ) || ! function_exists( 'gd_info' ) ) {
	exit;
}

session_start();

// 画像の幅.
$captcha_image_width = 100;
// 画像の高さ.
$captcha_image_height = 36;
// 文字数.
$captcha_string_length = 4;

// Prefix.
$prefix = isset( $_GET['prefix'] ) && preg_match( '/^[a-zA-Z0-9]{1,20}$/ ', $_GET['prefix'] ) ? $_GET['prefix'] : 'default'; // phpcs:ignore WordPress.Security

// 文字モード（'en' または 'jp'）.
$char_mode = isset( $_GET['char_mode'] ) && in_array( $_GET['char_mode'], array( 'en', 'jp' ), true ) ? $_GET['char_mode'] : 'en'; // phpcs:ignore WordPress.Security

// フォント（''、'mplus' または 'chokokutai'）.
$font = isset( $_GET['font'] ) && in_array( $_GET['font'], array( 'mplus', 'chokokutai' ), true ) ? $_GET['font'] : ''; // phpcs:ignore WordPress.Security

// 文字化け防止に、文字コードを明示的に指定.
mb_internal_encoding( 'UTF-8' );

// 文字の最大傾斜角度.
$font_angle = 20;

if ( 'mplus' === $font ) {
	// 文字用 TrueType フォント テーブル.
	$string_fonts = array(
		__DIR__ . '/fonts/mplus/mplus-1c-regular-captcha.ttf',
		__DIR__ . '/fonts/mplus/mplus-1c-medium-captcha.ttf',
		__DIR__ . '/fonts/mplus/mplus-1c-bold-captcha.ttf',
		__DIR__ . '/fonts/mplus/mplus-1c-heavy-captcha.ttf',
	);
} elseif ( 'chokokutai' === $font ) {
	// 文字用 TrueType フォント テーブル.
	$string_fonts = array(
		__DIR__ . '/fonts/chokokutai/Chokokutai-Regular.ttf',
	);
} else {
	// 文字用 TrueType フォント テーブル.
	$string_fonts = array(
		__DIR__ . '/fonts/palettemosaic/PaletteMosaic-Regular.ttf',
	);

	$font_angle = 25;
}

if ( 'jp' === $char_mode ) {
	// 文字列テーブル (判別しにくい「く」「へ」「ぬ」「ね」「を」を除外).
	$string_table = 'あいうえおかきけこさしすせそたちつてとなにのはひふほまみむめもやゆよらりるれろわん';
	// 基準のフォント サイズ.
	$captcha_font_size = 18;
} else {
	// 文字列テーブル.
	$string_table = 'abcdefghjkmnpstuvwyz23456789';
	// 基準のフォント サイズ.
	$captcha_font_size = 21;
}

// phpcs:disable WordPress.WP.AlternativeFunctions

mt_srand();

// 文字列を生成.
$string = '';
for ( $i = 0; $i < $captcha_string_length; $i++ ) {
	$string .= mb_substr( $string_table, mt_rand( 0, mb_strlen( $string_table ) - 1 ), 1 );
}

// 表示した文字列をセッション変数に入れる.
$_SESSION[ "xo_security_captcha_$prefix" ] = $string;

// 画像サイズを指定して、画像オブジェクトを生成.
$img = imagecreate( $captcha_image_width, $captcha_image_height );

// 背景色を指定 (白色).
imagecolorallocate( $img, 255, 255, 255 );

$gd_info = gd_info();

if ( 'mplus' === $font ) {
	// ダミー文字用 TrueType フォント テーブル.
	$dummy_fonts = array(
		__DIR__ . '/fonts/mplus/mplus-1c-thin-captcha.ttf',
		__DIR__ . '/fonts/mplus/mplus-1c-light-captcha.ttf',
	);

	// ダミー文字列テーブル.
	$dummy_string_table = '＃＊○◎△▽☆';

	// ダミー文字列を生成.
	$dummy_string = '';
	for ( $i = 0; $i < $captcha_string_length + 1; $i++ ) {
		$dummy_string .= mb_substr( $dummy_string_table, mt_rand( 0, mb_strlen( $dummy_string_table ) - 1 ), 1 );
	}

	// ダミー文字を描画.
	$dummy_string_len = mb_strlen( $dummy_string );
	for ( $i = 0; $i < $dummy_string_len; $i++ ) {
		$x = (int) ( ( $captcha_image_width / mb_strlen( $dummy_string ) ) * $i + mt_rand( (int) ( -$captcha_font_size / 15 ), (int) ( $captcha_font_size / 15 ) ) );
		$y = (int) ( ( $captcha_image_height + $captcha_font_size ) / 2 + mt_rand( (int) ( -$captcha_image_height / 5 ), (int) ( $captcha_image_height / 5 ) ) );
		$c = mt_rand( 32, 128 );

		if ( $gd_info['JIS-mapped Japanese Font Support'] ) {
			$char = mb_convert_encoding( mb_substr( $dummy_string, $i, 1 ), 'SJIS', 'UTF-8' );
		} else {
			$char = mb_substr( $dummy_string, $i, 1 );
		}

		imagettftext(
			$img,
			mt_rand( (int) ( $captcha_font_size * 1.2 ), (int) ( $captcha_font_size * 1.4 ) ),
			mt_rand( -45, 45 ),
			$x,
			$y,
			imagecolorallocate( $img, $c, $c, $c ),
			$dummy_fonts[ mt_rand( 0, count( $dummy_fonts ) - 1 ) ],
			$char
		);
	}
}

// CPATCHA 文字を描画.
$string_len = mb_strlen( $string );
for ( $i = 0; $i < $string_len; $i++ ) {
	$x = (int) ( ( ( $captcha_image_width - 8 ) / mb_strlen( $string ) ) * $i + mt_rand( (int) ( -$captcha_font_size / 10 ), (int) ( $captcha_font_size / 10 ) ) + 2 );
	$y = (int) ( ( $captcha_image_height + $captcha_font_size ) / 2 + mt_rand( (int) ( -$captcha_image_height / 10 ), (int) ( $captcha_image_height / 10 ) ) );
	$c = mt_rand( 0, 64 );

	if ( $gd_info['JIS-mapped Japanese Font Support'] ) {
		$char = mb_convert_encoding( mb_substr( $string, $i, 1 ), 'SJIS', 'UTF-8' );
	} else {
		$char = mb_substr( $string, $i, 1 );
	}

	imagettftext(
		$img,
		mt_rand( (int) ( $captcha_font_size * 0.8 ), (int) ( $captcha_font_size * 1.2 ) ),
		mt_rand( -$font_angle, $font_angle ),
		$x,
		$y,
		imagecolorallocate( $img, $c, $c, $c ),
		$string_fonts[ mt_rand( 0, count( $string_fonts ) - 1 ) ],
		$char
	);
}

// phpcs:enable

header( 'Cache-control: no-cache' );
header( 'Content-type: image/png' );
imagepng( $img );
imagedestroy( $img );
