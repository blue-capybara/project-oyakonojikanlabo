# 連載プレビューと旧Easy_Seriesの調査・ローカル修正

2026年10月24日。段階4の停止記録をもとに、2件を別々に再現しました。**下書きプレビューはGutenbergのURL選択経路への対応不足、SQLエラーは旧Easy_Seriesの投稿ID処理の不具合です。両者は独立しています。**

本番ファイル・DB・設定、GitHub、配信物は変更していません。段階4は未完了、段階5は未着手のままです。Webhook／Actionsの再開操作も行っていません。

## 調査に使った環境

- 段階0のローカルバックアップから、WordPress 7.1.3本体、Easy Series 1.0.0、プレビューフックを参照するプラグイン・テーマのコードを読み出しました。
- 段階4の保存済みPHPログ、復旧記録、現在のローカル候補を照合しました。本番への追加接続は行っていません。
- テストは専用マーカーのある使い捨てWordPress、架空の記事・旧連載データ、SQLiteで行いました。外部HTTP、Cron、メールは停止し、本番DB・認証設定は取り込んでいません。
- ローカルPHPは8.5.6です。本番PHP 8.4.27／MySQL 5.7での今回の修正の再検証、本番の全プラグインを有効にしたブラウザー操作は未実施です。

## 1. Gutenberg標準プレビューの遷移先

### 原因と競合の確認

本番バックアップの`wp-includes/js/dist/editor.js:7181`、`getEditedPostPreviewLink()`では、次のようにURLを選びます。

| 状態 | 使用するURL |
| --- | --- |
| 下書き（`draft`） | 編集用REST応答の`link`。自動保存の`preview_link`があってもこちらを使います |
| その他で自動保存リンクがある場合 | 自動保存応答の`preview_link` |
| 自動保存リンクがない場合 | 編集用REST応答の`link` |

`wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php:1970`は`link`を`get_permalink()`から作ります。一方、自動保存の`preview_link`は`class-wp-rest-autosaves-controller.php:475–485`で`get_preview_post_link()`から作ります。

既存の`preview-endpoint.php`は`preview_post_link`の優先度10、新候補の`ojl-series-preview.php:39`は優先度30です。ローカルでは後者の署名付きURLが正しく優先されました。しかし下書きのREST `link`にはこのフックが通らず、CMS側のURLが残っていました。修正前は「RESTのホストはCMS、`get_preview_post_link()`のホストはReact」という不一致を再現しています。

バックアップのMU、通常プラグイン、テーマのPHPも調査しました。WPGraphQLとDuplicate Postは`get_preview_post_link()`の呼出し側です。Classic Editorの該当箇所は旧Gutenbergフックの整理などで、Easy_SeriesにプレビューURLを書き換えるフックはありませんでした。今回の現象を説明する優先度の上書き競合は確認していません。動的に登録される本番全フックを今回採取したわけではありませんが、旧プラグインを読み込まない隔離環境でも現象が再現します。

また`editor.js:79049`付近の`__unstableSaveForPreview()`は、下書きでプレビュー前の保存を行います。この保存がYoastの処理を呼ぶため、同時刻に後述のSQLエラーが記録されたと説明できます。SQLエラーが遷移先を書き換えているわけではありません。

### ローカルで実装した変更

対象はCMSの`wp-content/mu-plugins/ojl-series-preview.php:46–63`です。

| 変更前 | 変更後 |
| --- | --- |
| `preview_post_link`だけを署名付きに変更 | 同フックを維持し、未公開投稿の**編集用REST** `link`も署名付きに変更 |

追加した`ojl_series_preview_rest_link()`は`rest_prepare_post`／`rest_prepare_ojl_series`に接続します。対象は`post`／`ojl_series`、状態は`auto-draft`／`draft`／`pending`／`future`／`private`、`context=edit`かつ対象投稿の編集権限がある場合に限定しました。

公開済み記事の編集用`link`、公開RESTの`view`／`embed`、固定ページ、`get_permalink()`、公開GraphQLは変更しません。署名入り応答には`private, no-store`を設定し、`_fields`で除外された`link`を追加しません。未公開記事の編集画面では、RESTの`link`を参照するURL表示もプレビューURLになる点は確認対象です。

署名の有効期限は従来どおり15分です。長時間開いた編集画面で期限切れになった場合は、編集画面を再読み込みしてリンクを発行し直します。

## 2. 旧Easy_SeriesのSQLエラー

### 原因

以下は本番バックアップの旧プラグインの行番号です。旧プラグイン本体はCMSリポジトリの管理対象に含まれていません。

| 場所 | 問題 |
| --- | --- |
| `wp-content/plugins/easy-series/easy-series.php:54` | `the_title`の引数を1個しか受け取らず、対象投稿IDを捨てます |
| 同`:373–374`、`Easy_Series::the_title()` | 明示された対象IDではなく`get_the_ID()`を使います |
| `includes/easy-series-posts-db.php:39–40`、`find_by_post_id()` | ID検証も`prepare()`もなく、値をSQLへ連結します |

Yoastの保存時インデックス処理や関連記事RESTのようにグローバル投稿がない場面では、`get_the_ID()`が`false`になり、`SELECT * FROM wp_easy_series_posts WHERE post_id=;`を実行します。グローバル投稿が別記事の場合はSQL自体が成功しても、別記事の旧連載書式を付ける可能性があります。後者も架空データで再現・回帰確認しました。

段階4のログは保存→Yoast→`get_the_title()`の経路、復旧後のログは関連記事REST→`OKJL_Related_Posts_MU::format_item()`→`get_the_title()`の経路でした。関連記事の呼出しはローカル`wp-content/mu-plugins/okjl-related-posts/bootstrap.php:268–274`でも確認できます。新プレビューのフックを外した隔離環境でも、同じ空IDのSQLとDBエラーを再現しました。

### 今回の連載への影響

- 新機能は`ojl_series`と`_ojl_series_*`メタを使い、旧`wp_easy_series_*`テーブルを直接使いません。旧`series_contents`も変更しません。
- ただし旧`the_title`フィルターは投稿タイプを問わず動きます。通常記事・新連載のタイトル取得、Yoast、関連記事、WPGraphQLに間接的な影響があります。WPGraphQL側も`src/Model/Post.php:760–764`で対象IDを指定して`the_title`を呼びますが、旧プラグインがそのIDを受け取っていませんでした。
- 観測したSQLは読み取りです。今回のログだけで新連載の設定破損や保存全体の失敗を示すものではありません。旧コードは検索失敗時に元タイトルを返すため、エラーが出ても処理が続く場合があります。

### 対処案とローカル検証

CMSの`docs/patches/easy-series-title-id.patch`に、旧プラグイン2ファイルだけの修正案を保存しました。**プラグイン本体への適用は隔離コピーだけ**です。既存の旧連載データやタクソノミーは変更していません。

| 変更前 | 変更後 |
| --- | --- |
| タイトル処理がグローバルIDを参照 | `the_title`を2引数で受け、渡された対象IDを使用 |
| 検索時にIDをそのまま連結 | 正の整数以外では検索せず、正常IDは`$wpdb->prepare(... %d ...)`で検索 |

共有検索関数で対処するため、本文フィルターなど別の呼出し元で空IDになった場合もSQLを発行しません。既存の旧連載タイトル書式、テーブル構造、保存設定は維持します。対象IDが渡されないタイトル呼出しは元のタイトルを返します。

このパッチは今回のプレビュー修正と別に扱ってください。本番採用時は旧プラグイン2ファイルの現物ハッシュ・差分、バックアップ、復旧先を再確認する必要があります。プラグイン更新で修正が失われる点も運用記録に残します。

## 検証結果と再実行

| 検証 | 結果 |
| --- | --- |
| 既存の保存・権限・公開GraphQL・署名・Webhookテスト | Phase 1の103件、Phase 2の26件が成功 |
| 新規`tests/series-preview-rest.php` | 追加104件が成功。未公開5状態／公開済み、通常記事／連載、匿名拒否、公開応答への署名漏れ防止、固定ページ、下書き保存応答、公開本文を変えない自動保存を確認 |
| Gutenberg本体の`getEditedPostPreviewLink()` | 修正前の下書き分岐を再現後、実REST応答から作った22条件で署名・画像指定・React遷移先を確認。上記104件に含みます |
| 新規`tests/legacy-series-title.php` | 未修正コピーでは回帰テストが失敗。パッチ後は追加21件成功。旧書式維持、別投稿への誤適用防止、不正IDのSQL抑止、新連載保存との共存、公開GraphQLを確認 |
| PHP構文 | プレビュー本体、テスト2ファイル、パッチ適用後の旧プラグイン2ファイルが成功 |

再実行には`tests/setup-series-test.php`で専用環境を作り、次を順番に実行します。2本は同じ隔離DBを使うため同時実行しません。

```sh
OJL_SERIES_TEST_ROOT=/隔離WordPress php wp-content/mu-plugins/tests/series-preview-rest.php
OJL_SERIES_TEST_ROOT=/隔離WordPress php wp-content/mu-plugins/tests/legacy-series-title.php
```

後者は、バックアップ由来の旧プラグインを隔離環境の`wp-content/plugins/easy-series/`へコピーし、上記パッチを**隔離環境だけ**に適用してから実行します。テストはマーカー・専用DB条件が不一致なら中止します。前者には本体JSを読み出すためNodeも必要です。署名や本番の未公開内容をテスト出力へ保存しません。

## 次回の確認条件

今回、ブラウザーでの最終クリック確認は行っていません。段階4を再試行する際は、反映候補の再凍結・バックアップ・自動実行停止を確認したうえで、新規の検証用下書きを使い、通常記事と連載の標準プレビューをそれぞれ実操作で確認します。公開済み記事の自動保存プレビュー、PC／スマートフォン、エラーログも確認が必要です。

旧プラグインの修正を採用する場合は別差分として反映・検証します。署名付きAPIだけ成功しても段階4完了とはせず、SQLエラーの解消状況も別に記録してください。今回のローカル成果だけで段階5・6へ進める状態とはしていません。

React、Shopify関連、Webhook、Actions、旧`series_contents`、既存の段階4停止・復旧記録は変更していません。
