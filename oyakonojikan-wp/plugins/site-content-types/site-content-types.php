<?php
/**
 * Plugin Name: Site Content Types
 * Description: Registers custom post types (Event/Space/Artist) with REST & WPGraphQL support, and adds admin conveniences for managing Events & Schools as a single CPT.
 * Version: 1.0.0
 * Author: Your Team
 * Requires PHP: 7.4
 */
defined('ABSPATH') || exit;
require_once __DIR__ . '/inc/cpts.php';
require_once __DIR__ . '/inc/admin-ui.php';
