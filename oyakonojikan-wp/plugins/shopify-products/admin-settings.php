<?php
// 管理画面設定ページ

function shopify_products_settings_page()
{
?>
    <div class="wrap">
        <h1>Shopify 商品設定</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('shopify_products_settings');
            do_settings_sections('shopify_products_settings');
            ?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Shopify Storefront Access Token</th>
                    <td><input type="text" name="shopify_storefront_token" value="<?php echo esc_attr(get_option('shopify_storefront_token')); ?>" class="regular-text" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">許可するCORSオリジン</th>
                    <td><input type="text" name="shopify_cors_origin" value="<?php echo esc_attr(get_option('shopify_cors_origin')); ?>" class="regular-text" /></td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        <hr />
        <h2>ショートコードの使い方</h2>
        <p>以下のようにショートコードを使うことで、Shopifyの商品一覧を表示できます：</p>
        <pre><code>[shopify_products collection="recommend" limit="6" sort="CREATED_AT"]</code></pre>

        <h3>パラメータ一覧</h3>
        <ul>
            <li><strong>collection</strong>：表示したいコレクションのhandle名</li>
            <li><strong>limit</strong>：表示件数（例: 6）</li>
            <li><strong>sort</strong>：並び順（下記の sortKey より選択）</li>
        </ul>

        <h3>sortKey（並び順）の選択肢</h3>
        <ul>
            <li><code>BEST_SELLING</code>：売上順（最も売れている商品から表示）</li>
            <li><code>CREATED</code>：作成日時の新しい順（≒新着順）</li>
            <li><code>ID</code>：ID順（内部的な商品IDの昇順）</li>
            <li><code>MANUAL</code>：コレクション内で手動で並び替えた順番</li>
            <li><code>PRICE</code>：価格の安い順（バリアントの最小価格が基準）</li>
            <li><code>RELEVANCE</code>：検索時の関連度順（検索クエリが必要）</li>
            <li><code>TITLE</code>：商品タイトルのアルファベット順（A→Z）</li>
        </ul>
    </div>
<?php
}

function shopify_products_register_settings()
{
    register_setting('shopify_products_settings', 'shopify_storefront_token');
    register_setting('shopify_products_settings', 'shopify_cors_origin');
}

add_action('admin_menu', function () {
    add_options_page('Shopify 商品設定', 'Shopify 商品設定', 'manage_options', 'shopify-products-settings', 'shopify_products_settings_page');
});
add_action('admin_init', 'shopify_products_register_settings');
