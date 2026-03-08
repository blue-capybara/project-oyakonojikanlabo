<?php

/**
 * Plugin Name: CORS Allow for Headless API
 * Description: React など別オリジンからの API アクセスを許可するための CORS 設定
 */

add_action('send_headers', function () {

	if (!isset($_SERVER['HTTP_ORIGIN'])) {
		return;
	}

	$allowed_origins = [
		'https://stg.oyakonojikanlabo.jp',
		'http://localhost:5173',
		'http://localhost:5174',
		'https://react.oyakonojikanlabo.xyz',
		'https://ehonyasan-moe.oyakonojikanlabo.jp',
		'https://oyakonojikanlabo.jp',
	];

	$origin = $_SERVER['HTTP_ORIGIN'];

	if (in_array($origin, $allowed_origins, true)) {
		header("Access-Control-Allow-Origin: {$origin}");
		header('Vary: Origin');
		header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
		header('Access-Control-Allow-Headers: Content-Type, Authorization');
	}
});

// preflight 対応（GraphQL 用に重要）
add_action('rest_api_init', function () {
	add_filter('rest_pre_serve_request', function ($value) {
		if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
			status_header(200);
			exit;
		}
		return $value;
	});
});
