# 段階5：自動保存middlewareが適用されない原因の調査

2026年10月25日。本番のファイル変更・編集画面の再試験は行わず、関連ソースとHTTP応答の読み取り、本番と同じ条件のローカル再現で調査しました。

## 結論

**テーマが管理画面でも`ver`クエリを削除するため、`filemtime`による編集JSの更新判定が無効になっていました。さらに編集JSには30日間のキャッシュ指定があり、修正版の配信後も、通常の画面遷移ではmiddlewareを持たない旧JSが実行される条件が成立していました。**

同じ条件のChromeで、「サーバーと後から取得したJSは修正版だが、編集画面のmiddleware登録数は0」の状態を再現しました。連載用JSだけに更新クエリを付けると、旧キャッシュを残したままでも登録数が1となり、自動保存へ`ojlSeries`が同送されました。

`path`／`url`／`method`の判定不一致ではありません。保存ロジックや新たな送信経路を追加する必要はありません。

## 本番で読み取り確認した事実

WordPressリポジトリのファイルパスです。

- `wp-content/themes/oyakonojikan-child/functions.php:771`の`remove_cssjs_ver2()`は`remove_query_arg('ver', $src)`を実行します。`:778`で`script_loader_src`へ登録しており、管理画面を除外する条件がありません。テーマ内の別のタグ整形処理にある`is_admin()`の除外とは独立しています。
- `wp-content/mu-plugins/ojl-series.php:378`の読み込み処理は、従来`wp_enqueue_script()`のversionへ`filemtime`を渡していました。WordPressが付けた`?ver=...`は上記フィルターで消えます。実際の本番ブラウザー記録のURLにも`ver`はありませんでした。
- 編集JSの公開HTTP応答は`Cache-Control: max-age=2592000`でした。30日です。URLが変わらないため、ファイルを置換して編集画面を開き直すだけでは、新しいコードの実行を保証できません。
- 本番の`wp-includes/js/dist/core-data.js`は、前回ローカルで使用したWordPress 7.1.3の同ファイルとSHA-256が一致しました。`api-fetch.js`とmin版、テーマ、連載関連ソースも取得・照合しています。
- 匿名RESTの投稿タイプ設定は`rest_namespace=wp/v2`、`rest_base=posts`でした。
- 本番は前回復旧したJSで稼働しており、その版に`wp.apiFetch.use()`はありません。過去の修正版実行を本番で再観測するための再配置はしていません。

## 自動保存の通信経路と判定

WordPress 7.1.3の実コードでは次の順に処理します。

1. `wp-includes/js/dist/editor.js:78853`の`savePost()`が`core-data.saveEntityRecord()`を呼びます。標準`autosave()`は`isAutosave: true`でこの経路へ入ります。
2. `wp-includes/js/dist/core-data.js:18286`付近で自動保存データを`title`・`excerpt`・`content`・`meta`等へ絞り、`:18309`で`POST {baseURL}/{id}/autosaves`を`apiFetch`へ渡します。独自フィールドはここで省かれます。
3. `wp-includes/js/dist/api-fetch.js:491`のmiddleware登録は先頭追加、`:555`の`reduceRight()`で適用します。連載middlewareが登録されていれば、この段階で独自フィールドを補えます。
4. root URLのmiddlewareがRESTの絶対URLを補い、標準fetch handlerが`data`をJSON化して`fetch`へ渡します。

本番と同じcore・REST設定のローカルGutenbergで、実際の`core/editor.autosave()`から次の値を取得しました。

| 項目 | middleware入力 | 既存条件との比較 |
| --- | --- | --- |
| `path` | `/wp/v2/posts/6/autosaves`（6は隔離テストID） | 一致します |
| `url` | 未指定 | この時点では正常です。後続middlewareが補います |
| `method` | `POST` | 一致します |
| `ojlSeries` | コアからは未指定 | 登録済みの連載middlewareが同送します |

自動保存一覧を読むGETは`/autosaves?context=edit`で、POSTの保存とは別です。通常保存のPUTが最終通信でPOSTに見えるのも、標準`http-v1` middlewareのメソッド変換によるもので、自動保存の判定を広げる理由にはなりません。

本番の最終送信先・method・設定欠落は前回の通信記録を根拠とし、今回の内部options・登録数の計測はローカルで行ったものです。本番の投稿編集画面は、編集ロック等を書き込むため開いていません。

## ローカルでの再現と修正後の確認

新しい隔離WordPress 7.1.3・SQLite・Chromeを使用しました。本番テーマから取得した`ver`削除処理と、編集JSの30日キャッシュを再現しました。登録の観測はローカル専用のinline scriptで行い、本番へ観測コードは配置していません。

| 手順 | 結果 |
| --- | --- |
| 旧JSをversionなしURLで読み込み | 連載middlewareの登録数は0でした |
| サーバー側だけを修正JSへ置換し、ダッシュボード経由で編集画面を開き直す | 同じURLの旧キャッシュが実行され、登録数は0のままでした |
| その画面から後でJSを取得 | 取得したコードには`wp.apiFetch.use()`がありました。取得したbytesと実行済みコードが一致する証拠にはならないことを再現しました |
| 連載JS専用の更新クエリを付け、同じ画面遷移で開き直す | 登録数は1、新URLは`editor.js?ojl_series_ver={filemtime}`でした |
| 未保存の回番号を重複させ、明示保存の拒否後に標準自動保存 | 最終fetchのJSONに現在の`ojlSeries`が入り、400で拒否しました。実DBの本文と保存済み第2回は不変でした |
| 第3回へ修正して通常保存・再編集 | 保存成功、`dirty=false`・`saving=false`となり、再編集でも第3回が表示されました |

## 最小修正

ローカルの`wp-content/mu-plugins/ojl-series.php:381`だけを追加修正しました。

- **変更前**：標準の`ver={filemtime}`に依存していました。
- **変更後**：連載JSのURL自体へ`ojl_series_ver={filemtime}`を付け、標準version引数は`null`にします。

既存テーマの`ver`削除を変更せず、他のJSへクエリを追加しません。`editor.js`のmiddleware・入力同期・判定条件、REST保存処理、Webhook、プレビュー、ACF、Shopify関連コードは今回変更していません。新しいライブラリや保存機構も追加していません。

## 回帰テスト

- 追加した`wp-content/mu-plugins/tests/series-editor-cache.php`は、修正前に「テーマのver削除後に更新日時が残らない」条件で失敗し、修正後は7件成功しました。通常記事・連載本体のURL、標準依存、他のJSへの非干渉を検証します。既存の連載結合103件も成功しています。
- `series-editor.cjs`は33件成功しました。
- `series-autosave.php`は既存103＋追加38＝141件成功しました。
- 変更PHPと追加テストの構文を確認しました。変更PHPは本番PHP 8.4.27でも標準入力の`-n -l`で構文確認済みです。コードの実行やファイル配置はしていません。WordPressを使うローカル結合テストのPHPは8.5.6であり、本番と同一の実行環境ではありません。今回SQLやDBの保存処理は変更していません。

再現環境・読み取りソース・結果は非公開の`/private/tmp/ojl-autosave-route-xvvdmv69`に記録しました。ローカルHTTPサーバーは停止済みです。

## 本番への影響と残作業

本番ソース8ファイルは、調査の前後でハッシュが一致しました。本番のファイル・DB・設定を変更せず、Webhook反映、push、デプロイ、自動実行の再開も行っていません。

段階5は未完了のままです。次の本番検証では、バックアップと停止状態を取り直し、PHP・JSの組み合わせを反映した後、**実際のscript URLに`ojl_series_ver`があることと、自動保存の送信JSONに`ojlSeries`があること**を確認してから保存試験へ進めます。サーバーのファイルハッシュ確認だけで合格とは判断しません。

今回の追加修正はPHPの読み込み箇所だけですが、本番は前回PHP・JSとも旧版へ復旧済みです。次回も、前回の自動保存修正を含むJSと、今回のURL修正を含むPHPを2ファイル一組で扱います。PHPだけの反映ではmiddlewareは追加されません。

## キャッシュ対策後の再実施結果

2026年10月25日15時台の再実施で、実JS URLの更新クエリと自動保存JSONの`ojlSeries`を確認しました。重複拒否後の自然自動保存でも部分保存がなく、修正後の保存・通常記事・プレビューも正常でした。連載対応Webhookを無効のまま反映し、段階5が完了しました。詳細は[段階5の完了記録](series-stage5-cache.md)を参照してください。本書の未完了・停止の記述は、この再実施前の結果です。
