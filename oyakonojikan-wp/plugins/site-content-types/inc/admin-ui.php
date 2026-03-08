<?php
defined('ABSPATH') || exit;
add_action('admin_menu', function () {
  add_submenu_page('edit.php?post_type=event','イベント','イベント','edit_posts','edit.php?post_type=event&event_type=event');
  add_submenu_page('edit.php?post_type=event','スクール','スクール','edit_posts','edit.php?post_type=event&event_type=school');
  add_submenu_page('edit.php?post_type=event','新規追加（イベント）','新規追加（イベント）','edit_posts','post-new.php?post_type=event&etype=event');
  add_submenu_page('edit.php?post_type=event','新規追加（スクール）','新規追加（スクール）','edit_posts','post-new.php?post_type=event&etype=school');
}, 20);
add_filter('acf/load_value/name=event_type', function ($value, $post_id, $field) {
  if (empty($value) && isset($_GET['etype'])) { return $_GET['etype'] === 'school' ? 'school' : 'event'; }
  return $value;
}, 10, 3);
add_filter('manage_event_posts_columns', function ($cols) { $cols['event_type'] = '種別'; $cols['display_badges'] = 'バッジ'; return $cols; });
add_action('manage_event_posts_custom_column', function ($col, $post_id) {
  if ($col === 'event_type') { $v = function_exists('get_field') ? get_field('event_type', $post_id) : ''; echo esc_html($v ? ($v === 'school' ? 'スクール' : 'イベント') : ''); }
  if ($col === 'display_badges') { $badges = function_exists('get_field') ? (array) get_field('display_badges', $post_id) : []; if ($badges) { echo esc_html(implode(' / ', $badges)); } }
}, 10, 2);
add_action('restrict_manage_posts', function () {
  global $typenow; if ($typenow === 'event') {
    $current = isset($_GET['event_type']) ? sanitize_text_field($_GET['event_type']) : '';
    echo '<select name="event_type" id="filter-by-event-type">';
    echo '<option value="">— 種別（すべて）—</option>';
    $opts = ['event' => 'イベント', 'school' => 'スクール'];
    foreach ($opts as $val => $label) { printf('<option value="%s"%s>%s</option>', esc_attr($val), selected($current, $val, false), esc_html($label)); }
    echo '</select>';
  }
});
add_filter('parse_query', function ($query) {
  global $pagenow;
  if (is_admin() && $pagenow === 'edit.php' && isset($_GET['post_type']) && $_GET['post_type'] === 'event') {
    if (!empty($_GET['event_type'])) {
      $meta_query = (array) $query->get('meta_query');
      $meta_query[] = ['key' => 'event_type', 'value' => sanitize_text_field($_GET['event_type'])];
      $query->set('meta_query', $meta_query);
    }
  }
});
