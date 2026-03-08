<?php

/**
 * MU Loader: Related Posts
 */
if (!defined('ABSPATH')) {
	exit;
}

$bootstrap = __DIR__ . '/okjl-related-posts/bootstrap.php';
if (file_exists($bootstrap)) {
	require_once $bootstrap;
}
