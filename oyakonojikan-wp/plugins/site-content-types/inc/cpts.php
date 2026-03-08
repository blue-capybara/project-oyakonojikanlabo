<?php
defined('ABSPATH') || exit;
add_action('init', function () {
  $L = function($singular, $plural) {
    return [
      'name' => $plural,'singular_name' => $singular,
      'add_new' => '新規追加','add_new_item' => "{$singular}を追加",
      'edit_item' => "{$singular}を編集",'new_item' => "新規{$singular}",
      'view_item' => "{$singular}を表示",'search_items' => "{$singular}を検索",
      'not_found' => '見つかりませんでした','menu_name' => $plural,
    ];
  };
  register_post_type('event', [
    'labels' => $L('イベント/スクール','イベント/スクール'),
    'public' => true,'menu_position' => 5,'menu_icon' => 'dashicons-calendar-alt',
    'has_archive' => true,'rewrite' => ['slug' => 'events','with_front' => false],
    'supports' => ['title','editor','thumbnail','excerpt','revisions'],
    'show_in_rest' => true,'show_in_graphql' => true,
    'graphql_single_name' => 'Event','graphql_plural_name' => 'Events',
  ]);
  register_post_type('space', [
    'labels' => $L('スペース','スペース'),
    'public' => true,'menu_position' => 6,'menu_icon' => 'dashicons-location',
    'has_archive' => true,'rewrite' => ['slug' => 'spaces','with_front' => false],
    'supports' => ['title','editor','thumbnail','revisions'],
    'show_in_rest' => true,'show_in_graphql' => true,
    'graphql_single_name' => 'Space','graphql_plural_name' => 'Spaces',
  ]);
  register_post_type('artist', [
    'labels' => $L('アーティスト','アーティスト'),
    'public' => true,'menu_position' => 7,'menu_icon' => 'dashicons-groups',
    'has_archive' => true,'rewrite' => ['slug' => 'artists','with_front' => false],
    'supports' => ['title','editor','thumbnail','revisions'],
    'show_in_rest' => true,'show_in_graphql' => true,
    'graphql_single_name' => 'Artist','graphql_plural_name' => 'Artists',
  ]);
  register_taxonomy('event_category', ['event'], [
    'labels' => $L('イベントカテゴリ','イベントカテゴリ'),'public' => true,'hierarchical' => true,
    'show_in_rest' => true,'rewrite' => ['slug' => 'event-category','with_front' => false],
    'show_in_graphql' => true,'graphql_single_name' => 'EventCategory','graphql_plural_name' => 'EventCategories',
  ]);
  register_taxonomy('event_region', ['event'], [
    'labels' => $L('地域','地域'),'public' => true,'hierarchical' => true,
    'show_in_rest' => true,'rewrite' => ['slug' => 'event-region','with_front' => false],
    'show_in_graphql' => true,'graphql_single_name' => 'EventRegion','graphql_plural_name' => 'EventRegions',
  ]);
}, 5);
