<?php
/**
 * Plugin Name: Shopify Products (Enhanced PHP Version)
 * Description: Shopifyの商品をPHPでサーバーサイド描画。コレクションまたは商品個別表示に対応。GraphQLでも展開済みHTML取得可。
 * Version: 1.1
 * Author: Custom
 */

// CSS読み込み
add_action('wp_enqueue_scripts', function() {
    wp_enqueue_style('shopify-products-style', plugin_dir_url(__FILE__) . 'shopify-products.css');
});

add_shortcode('shopify_products', function($atts) {
    $atts = shortcode_atts([
        'collection' => '',
        'product' => '',
        'limit' => 6,
        'sort' => 'BEST_SELLING'
    ], $atts);

    $_GET['collection'] = $atts['collection'];
    $_GET['product'] = $atts['product'];
    $_GET['limit'] = $atts['limit'];
    $_GET['sort'] = $atts['sort'];

    ob_start();
    include plugin_dir_path(__FILE__) . 'inc/shopify-proxy.php';
    $response = ob_get_clean();
    $json = json_decode($response, true);

    if ($atts['product']) {
        $products = isset($json['data']['product']) ? [ ['node' => $json['data']['product']] ] : [];
    } else {
        $products = $json['data']['collectionByHandle']['products']['edges'] ?? [];
    }

    if (empty($products)) {
        return '<p>商品が見つかりませんでした。</p>';
    }

    ob_start();
    echo '<div id="product-list">';
    foreach ($products as $edge) {
        $product = $edge['node'];
        $title = esc_html($product['title']);
        $handle = esc_attr($product['handle']);
        $image = $product['images']['edges'][0]['node'] ?? null;
        $img_url = esc_url($image['url'] ?? '');
        $img_alt = esc_attr($image['altText'] ?? $title);
        $product_url = "https://shop.oyakonojikanlabo.jp/products/{$handle}";

        echo <<<HTML
<div class="product">
  <a href="{$product_url}" target="_blank">
    <img src="{$img_url}" alt="{$img_alt}">
    <h3>{$title}</h3>
  </a>
</div>
HTML;
    }
    echo '</div>';

    return ob_get_clean();
});
?>
