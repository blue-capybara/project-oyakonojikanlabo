<?php
/*
Plugin Name: Shopify 商品表示
Description: Shopifyの商品をWordPressに表示するショートコード。
Version: 1.1
Author: Shigeo Nagaoka
*/

function enqueue_shopify_product_assets()
{
    wp_enqueue_style('shopify-products-style', plugin_dir_url(__FILE__) . 'css/shopify-products.css');
    wp_enqueue_style('shopify-products-style', plugin_dir_url(__FILE__) . 'css/style.css');
    wp_enqueue_script('shopify-products-script', plugin_dir_url(__FILE__) . 'js/shopify-products.js', [], false, true);
}

add_action('wp_enqueue_scripts', 'enqueue_shopify_product_assets');

function shopify_products_shortcode($atts)
{
    $atts = shortcode_atts([
        'collection' => '',
        'limit' => '10',
        'sort' => 'BEST_SELLING'
    ], $atts);

    ob_start();
?>
    <div id="product-list"
        data-collection="<?php echo esc_attr($atts['collection']); ?>"
        data-limit="<?php echo esc_attr($atts['limit']); ?>"
        data-sort="<?php echo esc_attr($atts['sort']); ?>">
    </div>
<?php
    return ob_get_clean();
}
add_shortcode('shopify_products', 'shopify_products_shortcode');
require_once plugin_dir_path(__FILE__) . 'admin-settings.php';
?>