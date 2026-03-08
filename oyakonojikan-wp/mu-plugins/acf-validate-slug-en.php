<?php

/**
 * ACF validate: slug_en は英小文字・数字・ハイフンのみ
 */
if (!defined('ABSPATH')) exit;

add_filter('acf/validate_value/name=slug_en', function ($valid, $value, $field, $input) {
	if ($valid !== true) return $valid; // 既に他の検証でNGならそのまま

	if (!is_string($value) || $value === '') {
		return '英語スラッグは必須です。';
	}
	if (!preg_match('/^[a-z0-9-]+$/', $value)) {
		return '英語スラッグは英小文字・数字・ハイフンのみで入力してください。';
	}
	if (strlen($value) > 80) {
		return '英語スラッグは80文字以内で入力してください。';
	}
	return true;
}, 10, 4);
