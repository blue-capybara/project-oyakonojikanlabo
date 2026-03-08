<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/wp-load.php');

header("Content-Type: application/json");

// CORS設定
$cors_origin = get_option('shopify_cors_origin');
if ($cors_origin) {
    header("Access-Control-Allow-Origin: " . $cors_origin);
} else {
    header("Access-Control-Allow-Origin: *");
}

// トークン取得
$token = get_option('shopify_storefront_token');
if (!$token) {
    http_response_code(500);
    echo json_encode(["error" => "Storefront Access Token not set."]);
    exit;
}

// Shopifyエンドポイント
$endpoint = "https://shop.oyakonojikanlabo.jp/api/2023-10/graphql.json";

// GETパラメータからクエリを構築
$collection = isset($_GET['collection']) ? $_GET['collection'] : null;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 6;
$sort = isset($_GET['sort']) ? $_GET['sort'] : 'CREATED';

if (!$collection) {
    http_response_code(400);
    echo json_encode(["error" => "Missing 'collection' parameter."]);
    exit;
}

// sortKeyがCREATEDのときのみ reverse: true を追加
$reverse = ($sort === 'CREATED') ? 'true' : 'false';

// GraphQLクエリ構築
$query = <<<GQL
{
  collectionByHandle(handle: "{$collection}") {
    products(first: {$limit}, sortKey: {$sort}, reverse: {$reverse}) {
      edges {
        node {
          title
          handle
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
}
GQL;


// POSTリクエスト送信
$response = wp_remote_post($endpoint, [
    'headers' => [
        'Content-Type' => 'application/json',
        'X-Shopify-Storefront-Access-Token' => $token,
    ],
    'body' => json_encode(['query' => $query]),
]);

if (is_wp_error($response)) {
    http_response_code(500);
    echo json_encode(["error" => $response->get_error_message()]);
    exit;
}

// 正常レスポンスを返す
echo wp_remote_retrieve_body($response);
