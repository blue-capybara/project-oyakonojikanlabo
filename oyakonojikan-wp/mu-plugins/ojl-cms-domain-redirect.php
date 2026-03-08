<?php
/**
 * Plugin Name: OJL CMS Domain Redirect
 * Description: cms.oyakonojikanlabo.jp への公開アクセスを oyakonojikanlabo.jp にリダイレクトします。
 */

defined('ABSPATH') || exit;

$ojl_cms_hosts = [
  'cms.oyakonojikanlabo.jp',
];

$ojl_public_origin = 'https://oyakonojikanlabo.jp';

$ojl_path_blocklist = [
  '/wp-admin',
  '/wp-login.php',
  '/wp-json',
  '/wp-content',
  '/wp-includes',
  '/wp-cron.php',
  '/xmlrpc.php',
  '/graphql',
];

$ojl_starts_with = static function (string $haystack, string $needle): bool {
  if ($needle === '') {
    return false;
  }
  return strncmp($haystack, $needle, strlen($needle)) === 0;
};

add_filter('allowed_redirect_hosts', static function (array $hosts) use ($ojl_public_origin): array {
  $public_host = parse_url($ojl_public_origin, PHP_URL_HOST) ?: $ojl_public_origin;
  $hosts[] = $public_host;
  return array_values(array_unique($hosts));
});

add_action('template_redirect', static function () use ($ojl_cms_hosts, $ojl_public_origin, $ojl_path_blocklist, $ojl_starts_with): void {
  if (defined('WP_CLI') && constant('WP_CLI')) {
    return;
  }

  if (is_admin() || wp_doing_ajax() || wp_doing_cron()) {
    return;
  }

  if (defined('REST_REQUEST') && REST_REQUEST) {
    return;
  }

  if (!empty($_GET['rest_route'])) {
    return;
  }

  if (is_preview() || isset($_GET['preview'])) {
    return;
  }

  $host = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? '');
  $host = strtolower(preg_replace('/:\\d+$/', '', $host));
  if (!in_array($host, $ojl_cms_hosts, true)) {
    return;
  }

  $request_uri = $_SERVER['REQUEST_URI'] ?? '/';
  $path = parse_url($request_uri, PHP_URL_PATH) ?? '/';

  foreach ($ojl_path_blocklist as $prefix) {
    if ($ojl_starts_with($path, $prefix)) {
      return;
    }
  }

  $target = $ojl_public_origin . $request_uri;
  wp_safe_redirect($target, 301);
  exit;
}, 0);
