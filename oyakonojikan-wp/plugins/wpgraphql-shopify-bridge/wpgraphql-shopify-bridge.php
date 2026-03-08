<?php

/**
 * Plugin Name: WPGraphQL Shopify Bridge
 * Description: PHPでShopify Storefront APIにアクセスし、WPGraphQLのスキーマから取得できるようにするブリッジ。コレクション取得＆商品ハンドル複数取得に対応。
 * Version: 1.0.0
 * Author: CapybaraWebWorks
 */

if (!defined('ABSPATH')) exit;

class CW_WPGraphQL_Shopify_Bridge
{

	public function __construct()
	{
		add_action('init', [$this, 'register_settings']); // オプション用
		add_action('graphql_register_types', [$this, 'register_graphql_schema']);
	}

	/** =========================
	 *  設定（WP Optionsを利用）
	 *  ========================= */
	public function register_settings()
	{
		// すでに使っているオプションがあれば流用（例）
		// shopify_storefront_token, shopify_store_domain, shopify_api_version
		register_setting('general', 'shopify_storefront_token');
		register_setting('general', 'shopify_store_domain');   // 例: shop.oyakonojikanlabo.jp
		register_setting('general', 'shopify_api_version');    // 例: 2024-07（未設定なら2023-10を使用）
	}

	/** =========================
	 *  GraphQL Type / Field 登録
	 *  ========================= */
	public function register_graphql_schema()
	{

		// ---- Enums ----
		register_graphql_enum_type('ShopifyProductSortKey', [
			'values' => [
				'CREATED'     => ['value' => 'CREATED'],
				'TITLE'       => ['value' => 'TITLE'],
				'PRICE'       => ['value' => 'PRICE'],
				'BEST_SELLING' => ['value' => 'BEST_SELLING'],
				'ID'          => ['value' => 'ID'],
				'RELEVANCE'   => ['value' => 'RELEVANCE'],
				'UPDATED'     => ['value' => 'UPDATED'],
			]
		]);

		// ---- Scalar / Object Types ----
		register_graphql_object_type('ShopifyMoneyV2', [
			'fields' => [
				'amount' => ['type' => 'String'],
				'currencyCode' => ['type' => 'String'],
			]
		]);

		register_graphql_object_type('ShopifyImage', [
			'fields' => [
				'url'     => ['type' => 'String'],
				'altText' => ['type' => 'String'],
			]
		]);

		register_graphql_object_type('ShopifyVariant', [
			'fields' => [
				'id'    => ['type' => 'String'],
				'title' => ['type' => 'String'],
				'price' => ['type' => 'ShopifyMoneyV2'],
			]
		]);

		register_graphql_object_type('ShopifyProduct', [
			'fields' => [
				'id'             => ['type' => 'String'],
				'title'          => ['type' => 'String'],
				'handle'         => ['type' => 'String'],
				'description'    => ['type' => 'String'],
				'onlineStoreUrl' => ['type' => 'String'],
				'image'          => ['type' => 'ShopifyImage'],
				'variant'        => ['type' => 'ShopifyVariant'],
			]
		]);

		// ---- Queries ----
		register_graphql_field('RootQuery', 'shopifyCollectionProducts', [
			'type' => ['list_of' => 'ShopifyProduct'],
			'args' => [
				'handle'  => ['type' => 'String', 'description' => 'コレクションハンドル', 'required' => true],
				'first'   => ['type' => 'Int',    'description' => '取得数（1-50推奨）', 'defaultValue' => 12],
				'sortKey' => ['type' => 'ShopifyProductSortKey', 'defaultValue' => 'CREATED'],
			],
			'resolve' => function ($root, $args, $context, $info) {
				$handle  = trim($args['handle']);
				$first   = max(1, (int)$args['first']);
				$sortKey = $args['sortKey'] ?: 'CREATED';

				$query = <<<GQL
				{
				  collectionByHandle(handle: "{$this->gql_escape($handle)}") {
				    products(first: {$first}, sortKey: {$sortKey}) {
				      edges {
				        node {
				          id
				          title
				          handle
				          description
				          onlineStoreUrl
				          images(first: 1) { edges { node { url altText } } }
				          variants(first: 1) { edges { node { id title price { amount currencyCode } } } }
				        }
				      }
				    }
				  }
				}
				GQL;

				$json = $this->call_shopify($query);
				return $this->normalize_products_from_collection($json);
			}
		]);

		register_graphql_field('RootQuery', 'shopifyProductsByHandles', [
			'type' => ['list_of' => 'ShopifyProduct'],
			'args' => [
				'handles' => ['type' => ['list_of' => 'String'], 'description' => '商品ハンドルの配列', 'required' => true],
			],
			'resolve' => function ($root, $args, $context, $info) {
				$handles = array_values(array_filter(array_map('trim', (array)$args['handles'])));
				if (empty($handles)) return [];

				// aliasでまとめて取得
				$fields = <<<GQL
					id
					title
					handle
					description
					onlineStoreUrl
					images(first: 1) { edges { node { url altText } } }
					variants(first: 1) { edges { node { id title price { amount currencyCode } } } }
				GQL;

				$pieces = [];
				foreach ($handles as $i => $h) {
					$alias = "p{$i}";
					$pieces[] = <<<GQL
						{$alias}: productByHandle(handle: "{$this->gql_escape($h)}") { {$fields} }
					GQL;
				}
				$query = "{\n" . implode("\n", $pieces) . "\n}";

				$json = $this->call_shopify($query);
				return $this->normalize_products_by_alias($json, $handles);
			}
		]);
	}

	/** =========================
	 *  Shopify呼び出し & ユーティリティ
	 *  ========================= */
	private function endpoint_and_token(): array
	{
		$domain      = trim((string)get_option('shopify_store_domain'));
		$api_version = trim((string)get_option('shopify_api_version')) ?: '2023-10';
		$token       = trim((string)get_option('shopify_storefront_token'));

		$endpoint = $domain
			? "https://{$domain}/api/{$api_version}/graphql.json"
			: "https://shop.oyakonojikanlabo.jp/api/2023-10/graphql.json"; // 既存フォールバック

		return [$endpoint, $token];
	}

	private function call_shopify(string $gql)
	{
		list($endpoint, $token) = $this->endpoint_and_token();
		if (empty($token)) {
			throw new \Exception('Storefront Access Token not set.');
		}

		// 簡易キャッシュ（60秒）。必要に応じてTransientsやオブジェクトキャッシュに変更可能。
		$cache_key = 'cw_sfy_' . md5($gql);
		$cached = get_transient($cache_key);
		if ($cached) return $cached;

		$res = wp_remote_post($endpoint, [
			'headers' => [
				'Content-Type' => 'application/json',
				'X-Shopify-Storefront-Access-Token' => $token,
			],
			'body'    => wp_json_encode(['query' => $gql]),
			'timeout' => 20,
		]);

		if (is_wp_error($res)) {
			throw new \Exception($res->get_error_message());
		}

		$code = wp_remote_retrieve_response_code($res);
		$body = wp_remote_retrieve_body($res);
		$json = json_decode($body, true);

		if ($code !== 200 || !is_array($json)) {
			throw new \Exception('Invalid response from Shopify: ' . $code);
		}
		if (!empty($json['errors'])) {
			throw new \Exception('GraphQL error: ' . wp_json_encode($json['errors']));
		}

		set_transient($cache_key, $json, 60);
		return $json;
	}

	private function gql_escape(string $s): string
	{
		return addcslashes($s, "\"\\\n\r\t");
	}

	private function normalize_products_from_collection(array $json): array
	{
		$edges = $json['data']['collectionByHandle']['products']['edges'] ?? [];
		$out = [];
		foreach ($edges as $edge) {
			if (!empty($edge['node'])) {
				$out[] = $this->map_product($edge['node']);
			}
		}
		return $out;
	}

	private function normalize_products_by_alias(array $json, array $handles): array
	{
		$data = $json['data'] ?? [];
		// 指定順維持
		$alias_map = [];
		foreach ($handles as $i => $h) {
			$alias_map["p{$i}"] = $h;
		}
		$out = [];
		foreach ($alias_map as $alias => $h) {
			if (!empty($data[$alias])) {
				$out[] = $this->map_product($data[$alias]);
			}
		}
		return $out;
	}

	private function map_product(array $node): array
	{
		// 画像1件、バリアント1件に正規化
		$imgEdge = $node['images']['edges'][0]['node'] ?? null;
		$varEdge = $node['variants']['edges'][0]['node'] ?? null;

		return [
			'id'             => $node['id'] ?? null,
			'title'          => $node['title'] ?? null,
			'handle'         => $node['handle'] ?? null,
			'description'    => $node['description'] ?? null,
			'onlineStoreUrl' => $node['onlineStoreUrl'] ?? null,
			'image'          => $imgEdge ? [
				'url'     => $imgEdge['url'] ?? null,
				'altText' => $imgEdge['altText'] ?? null,
			] : null,
			'variant'        => $varEdge ? [
				'id'    => $varEdge['id'] ?? null,
				'title' => $varEdge['title'] ?? null,
				'price' => [
					'amount'       => $varEdge['price']['amount'] ?? null,
					'currencyCode' => $varEdge['price']['currencyCode'] ?? null,
				]
			] : null,
		];
	}
}

new CW_WPGraphQL_Shopify_Bridge();
