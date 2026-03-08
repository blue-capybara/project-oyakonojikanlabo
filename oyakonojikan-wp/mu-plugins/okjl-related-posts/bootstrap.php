<?php

/**
 * 関連記事（手動優先 + 自動補完）を提供する MU プラグイン本体
 */
if (!defined('ABSPATH')) {
	exit;
}

if (!class_exists('OKJL_Related_Posts_MU')) {
	final class OKJL_Related_Posts_MU
	{
		const FIELD_NAME = 'manual_related_posts';
		const DEFAULT_LIMIT = 6;
		const MAX_LIMIT = 12;

		public static function init()
		{
			// ACF が有効なら、投稿編集画面に「手動関連記事」フィールドを追加
			add_action('acf/init', array(__CLASS__, 'register_acf_field_group'));
			// フロント（React）から叩く REST API を追加
			add_action('rest_api_init', array(__CLASS__, 'register_rest_routes'));
		}

		public static function register_acf_field_group()
		{
			if (!function_exists('acf_add_local_field_group')) {
				return;
			}

			acf_add_local_field_group(array(
				'key' => 'group_okjl_manual_related_posts',
				'title' => '関連記事設定',
				'fields' => array(
					array(
						'key' => 'field_okjl_manual_related_posts',
						'label' => '手動関連記事',
						'name' => self::FIELD_NAME,
						'type' => 'relationship',
						'instructions' => '未設定の場合は自動ロジックで補完されます。',
						'required' => 0,
						'post_type' => array('post'),
						'taxonomy' => array(),
						'filters' => array('search', 'post_type', 'taxonomy'),
						'elements' => array('featured_image'),
						'return_format' => 'id',
						'min' => 0,
						'max' => self::DEFAULT_LIMIT,
					),
				),
				'location' => array(
					array(
						array(
							'param' => 'post_type',
							'operator' => '==',
							'value' => 'post',
						),
					),
				),
				'position' => 'normal',
				'style' => 'default',
				'active' => true,
			));
		}

		public static function register_rest_routes()
		{
			register_rest_route('okjl/v1', '/related/(?P<post_id>\d+)', array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array(__CLASS__, 'rest_get_related_posts'),
				'permission_callback' => '__return_true',
				'args' => array(
					'post_id' => array(
						'required' => true,
						'validate_callback' => function ($value) {
							return is_numeric($value) && (int) $value > 0;
						},
					),
					'limit' => array(
						'required' => false,
						'default' => self::DEFAULT_LIMIT,
						'sanitize_callback' => 'absint',
					),
				),
			));
		}

		public static function rest_get_related_posts($request)
		{
			$post_id = (int) $request['post_id'];
			$post = get_post($post_id);

			if (!$post || $post->post_status !== 'publish') {
				return new WP_Error(
					'okjl_related_not_found',
					'記事が見つかりません。',
					array('status' => 404)
				);
			}

			$limit = (int) $request->get_param('limit');
			if ($limit < 1) {
				$limit = self::DEFAULT_LIMIT;
			}
			if ($limit > self::MAX_LIMIT) {
				$limit = self::MAX_LIMIT;
			}

			$items = self::collect_related_posts($post_id, $limit);

			return rest_ensure_response(array(
				'post_id' => $post_id,
				'count' => count($items),
				'items' => $items,
			));
		}

		private static function collect_related_posts($post_id, $limit)
		{
			$post_type = get_post_type($post_id) ? get_post_type($post_id) : 'post';
			$used_ids = array($post_id);
			$items = array();

			// 1) 手動関連記事を優先
			$manual_ids = self::get_manual_related_ids($post_id);
			foreach ($manual_ids as $manual_id) {
				if (count($items) >= $limit) {
					break;
				}
				if (in_array($manual_id, $used_ids, true)) {
					continue;
				}
				if (get_post_status($manual_id) !== 'publish') {
					continue;
				}
				if (get_post_type($manual_id) !== $post_type) {
					continue;
				}

				$items[] = self::format_item($manual_id, 'manual');
				$used_ids[] = $manual_id;
			}

			// 2) 同タグで補完
			if (count($items) < $limit) {
				$remaining = $limit - count($items);
				$tag_ids = wp_get_post_tags($post_id, array('fields' => 'ids'));

				$result = self::query_related(array(
					'post_type' => $post_type,
					'posts_per_page' => $remaining,
					'tag__in' => $tag_ids,
					'post__not_in' => $used_ids,
				), $used_ids);

				$items = array_merge($items, $result['items']);
				$used_ids = $result['used_ids'];
			}

			// 3) 同カテゴリで補完
			if (count($items) < $limit) {
				$remaining = $limit - count($items);
				$category_ids = wp_get_post_categories($post_id, array('fields' => 'ids'));

				$result = self::query_related(array(
					'post_type' => $post_type,
					'posts_per_page' => $remaining,
					'category__in' => $category_ids,
					'post__not_in' => $used_ids,
				), $used_ids);

				$items = array_merge($items, $result['items']);
				$used_ids = $result['used_ids'];
			}

			// 4) 新着で補完
			if (count($items) < $limit) {
				$remaining = $limit - count($items);

				$result = self::query_related(array(
					'post_type' => $post_type,
					'posts_per_page' => $remaining,
					'post__not_in' => $used_ids,
				), $used_ids);

				$items = array_merge($items, $result['items']);
			}

			return array_slice($items, 0, $limit);
		}

		private static function get_manual_related_ids($post_id)
		{
			if (function_exists('get_field')) {
				$value = get_field(self::FIELD_NAME, $post_id, false);
				return self::normalize_ids($value);
			}

			$meta = get_post_meta($post_id, self::FIELD_NAME, true);
			return self::normalize_ids($meta);
		}

		private static function normalize_ids($value)
		{
			if (!is_array($value)) {
				return array();
			}

			$ids = array();
			foreach ($value as $item) {
				$id = 0;

				if (is_numeric($item)) {
					$id = (int) $item;
				} elseif (is_object($item) && isset($item->ID)) {
					$id = (int) $item->ID;
				}

				if ($id > 0) {
					$ids[] = $id;
				}
			}

			return array_values(array_unique($ids));
		}

		private static function query_related($args, $used_ids)
		{
			$query_args = array_merge(array(
				'post_type' => 'post',
				'post_status' => 'publish',
				'posts_per_page' => self::DEFAULT_LIMIT,
				'post__not_in' => $used_ids,
				'orderby' => 'date',
				'order' => 'DESC',
				'ignore_sticky_posts' => true,
				'no_found_rows' => true,
				'fields' => 'ids',
			), $args);

			if (isset($query_args['category__in']) && empty($query_args['category__in'])) {
				unset($query_args['category__in']);
			}
			if (isset($query_args['tag__in']) && empty($query_args['tag__in'])) {
				unset($query_args['tag__in']);
			}

			$ids = get_posts($query_args);
			$items = array();

			foreach ($ids as $id) {
				$id = (int) $id;

				if (in_array($id, $used_ids, true)) {
					continue;
				}

				$items[] = self::format_item($id, 'auto');
				$used_ids[] = $id;
			}

			return array(
				'items' => $items,
				'used_ids' => $used_ids,
			);
		}

		private static function format_item($post_id, $source)
		{
			$thumb = get_the_post_thumbnail_url($post_id, 'medium');

			return array(
				'id' => (int) $post_id,
				'title' => wp_strip_all_tags(html_entity_decode(get_the_title($post_id), ENT_QUOTES, 'UTF-8')),
				'slug' => get_post_field('post_name', $post_id),
				'link' => get_permalink($post_id),
				'thumbnail' => $thumb ? esc_url_raw($thumb) : '',
				'date' => get_post_time('c', true, $post_id),
				'source' => $source, // manual or auto
			);
		}
	}

	OKJL_Related_Posts_MU::init();
}
