# 連載コラム Phase 2

2026年10月24日、ローカル実装・隔離環境で検証しました。本番WordPress・DB・設定・配信ファイルは変更せず、GitHubへのpush・Actions起動・デプロイも行っていません。

## 表示と運用

- 連載本体はPhase 1の`ojl_series`、各回は通常の`post`です。旧`series_contents`は変更していません。
- `/series/{slug}`で紹介・画像・連載中／完結・任意の総回数・公開済み回数を表示します。記事は公開日によらず回番号の数値昇順です。
- 「第1回から読む」は公開済みの第1回があるときだけ表示します。未公開回は、管理画面で予告を許可した予約投稿の回番号・予定日だけを表示します。
- 公開記事がゼロでも、連載本体を公開すると紹介ページを生成します。「記事の公開を準備しています。」と表示します。注目の特集フラグが有効ならトップにも掲載します。準備中の連載本体は下書きにしてください。
- 通常記事は、所属する連載も公開済みの場合だけ本文冒頭と末尾に連載UIを表示します。前後リンクは隣接する回番号の公開記事だけです。欠番を飛ばしません。既存の本文、商品リンク、シェア、タグ、関連記事は維持します。
- 注目の特集は掲載指定の連載を公開日の新しい順に先頭へ置き、既存の通常特集を従来の相対順で続けて最大4件にします。細かな混在順位の設定は今回追加していません。メインスライダーと新着一覧の取得処理は変更していません。
- `/series`の一覧は作りません。未登録・未公開の連載と一覧URLはHTTP 404です。既存URLライフサイクルで登録済みの301／410は従来どおり優先します。

## 変更前／変更後

| 対象             | 変更前                | 変更後                                           |
| ---------------- | --------------------- | ------------------------------------------------ |
| 連載の表示       | CMS管理・GraphQLのみ  | 詳細ページと通常記事の連載UI                     |
| 注目の特集       | 通常特集のみ、最大4件 | 通常特集と連載、合わせて最大4件                  |
| 全件ビルド       | 通常記事HTML・JSON    | 通常記事に連載情報を追加し、連載HTML・JSONも生成 |
| Webhook          | post／eventの公開変更 | ojl_series、連載メタ、予告日時の変更も対象       |
| 未公開連載の確認 | 専用画面なし          | 対象限定・15分有効の署名付きプレビュー           |

## 構成とキャッシュ

| ファイル                                                   | 役割                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `src/lib/series.ts`                                        | GraphQL項目、型、公開JSON取得、構造化データ                      |
| `src/components/series/SeriesDetail.tsx`                   | 公開・プレビューで共用する連載表示                               |
| `src/components/series/SeriesArticleNavigation.tsx`        | 記事冒頭・末尾の導線。所属なしでは何も出力しない                 |
| `src/pages/SeriesDetailPage.tsx`、`src/App.tsx`            | 詳細ルート、取得失敗と不存在の区別                               |
| `src/pages/PostDetailPage.tsx`                             | 記事取得への連載追加とUI配置                                     |
| `src/components/HomePage/FeatureSection.tsx`               | 特集カードの混在表示                                             |
| `src/hooks/usePreviewPost.ts`、`src/pages/PreviewPage.tsx` | 署名付きプレビューを既存画面へ追加                               |
| `scripts/generate-post-cache.mjs`                          | 既存全件取得内で連載と記事の整合を確認し、両方のHTML・JSONを生成 |
| `scripts/generate-sitemap.mjs`                             | 生成済み連載をサイトマップへ追加                                 |
| `scripts/postbuild.mjs`、`.htaccess`                       | 新しい公開パス、実ファイル配信とHTTP 404                         |
| `scripts/validate-production-build.mjs`                    | 連載HTML・JSON・索引の対応、SEO、プレビュー情報混入の検査        |
| `scripts/deploy-production.mjs`                            | 既存の管理対象ディレクトリ同期に連載2ディレクトリを追加          |

生成物は`series-pages/{slug}.html`、`series-cache/{slug}.json`、トップ用の`series-index.json`です。公開ページにはcanonical・OGP・`CreativeWorkSeries`の構造化データを含めます。紹介本文等を含む詳細JSONと、トップ用の要約JSONは分けています。この索引JSONは連載一覧ページではありません。

直接アクセスはApacheが連載HTMLを返します。Reactは埋め込みJSON、同一サイトのJSON、匿名GraphQLの順に取得します。静的HTMLのSEOメタをReact Helmetが管理できるようにし、SPA遷移後にcanonicalが重複・残存しないようにしています。

既存のWordPress → Webhook → repository_dispatch → GitHub Actions → 全件再ビルド → 既存同期を維持します。差分ビルド、新基盤、新依存関係は追加していません。Actionsは既存の`build:prod`・検査・同期ステップを利用し、ワークフロー側の追加は管理ディレクトリの説明だけです。作業前から存在したShopify関連の未コミット変更は維持しています。

全件取得時の公開記事と連載を照合して前後リンクを組み直すため、新しい回が公開されれば過去の記事も同じビルドで更新します。連載を非公開化した場合は連載HTML・JSON・索引・サイトマップ・記事の連載UIを除去します。通常記事自体の公開状態は変えません。連載用ディレクトリ内は既存方式の削除同期に含め、削除した連載の古いファイルを残さない構成です。

HTML・JSONの既存キャッシュ方針は60秒です。変更が公開サイトへ反映されるのはビルド・デプロイ完了後で、公開停止も即時ではありません。緊急停止は既存運用に従ってください。

本番コマンドは従来どおり`npm run build:prod` → `npm run validate:prod`です。単独の`sitemap`／通常`build`は連載索引がなければ従来対象のみ生成します。本番検査では連載索引と2ディレクトリを必須にし、連載ゼロ件でも空の生成物を検証します。`build:stg`は従来どおり静的記事を生成せず、署名付きプレビューを利用します。

## WordPress側の追加

CMSリポジトリの次のファイルが対象です。

- `wp-content/mu-plugins/ojl-series.php`：通知重複判定用の状態ハッシュを追加。Phase 1のデータ構造は変更しません。
- `wp-content/mu-plugins/ojl-frontend-deploy-webhook.php`：連載の公開・更新・削除、所属・回番号・特集設定、予告対象の予約日時変更を既存通知へ接続します。未公開回のタイトル・URLを通知せず、状態のハッシュだけを追加します。少数連載を前提に、所属変更では移動前後を取りこぼさないよう公開連載をまとめて通知します。
- `wp-content/mu-plugins/ojl-series-preview.php`：署名発行・対象限定REST・権限・期限の再確認を追加します。
- `wp-content/mu-plugins/preview-admin-ui.php`、`preview-endpoint.php`：新連載のプレビューリンクを切り替え、旧共有認証APIから連載本体・連載記事・そのリビジョンを取得できないようにします。非連載の既存プレビューは維持します。
- `wp-content/mu-plugins/tests/series-phase2.php`、`tests/setup-series-test.php`：隔離検証とビルド用データの準備です。本番に検証用データを設置しないでください。

WordPress予約投稿の公開フックを既存Webhookが受け、全件ビルドで次回リンクを反映します。WP-Cronの実行保証や外部Cronの新設は変更範囲外です。公開時刻の保証には実環境のCron・GitHubキュー・デプロイ時間の確認が必要です。

## 安全なプレビュー

編集画面のプレビューから開きます。連載本体と連載記事は`/preview?p={id}&series_preview=1#token=...`へ移動します。既存の`PREVIEW_FRONTEND_URL`を使用し、既定はステージングです。

署名は対象ID・発行者・15分の期限に限定し、取得時にも発行者の編集権限を確認します。トークンはURLフラグメントからPOST本文へ渡し、公開HTML・JSON・サイトマップには入れません。REST応答はエラーを含め`private, no-store`、画面はnoindex・canonicalなし・参照元送信なしです。新機能はフロントへの共有認証情報の追加を必要としません。

連載プレビューには発行者が編集できる未公開回も表示し、そのリンクは正式記事URLではなく、記事ごとの署名付きプレビューです。タイトル・本文は発行者本人の新しい自動保存も反映し、所属・回番号・特集フラグなどのメタ設定は保存済みの値を表示します。設定を保存してからプレビューしてください。リンクを持つ人は期限内に対象を閲覧できるため、確認担当者だけに共有してください。

## 検証結果

- `npm test`：Reactの13ファイル・51件と、ビルド／デプロイ／既存Shopifyの30件が成功。
- 隔離WordPress 6.9.4＋WPGraphQL＋SQLite：Phase 1の103件に加え、Phase 2の23件が成功。署名・期限・権限失効・旧API遮断・公開情報の分離・予約延期・公開／非公開化・通知を検証しました。
- 実際の隔離GraphQLを使い、Vite本番モード → 記事／連載キャッシュ → サイトマップ → postbuild → 成果物検査が成功。公開記事3件・公開連載1件の対応を確認しました。
- Apache 2.4＋Chromium：1280px／390pxで、連載・通常記事・連載記事・特集混在最大4件・スライダー／新着の対象維持・商品リンク・シェア・横スクロールなし・HTTP 404・有効／無効プレビューを確認しました。公開／非公開の判定には実際の隔離WordPressを使用し、ホームの既存特集APIは固定データです。外部フォント・画像等の通信は遮断しています。
- 全件ビルドの繰り返しで、前後リンク更新と非公開化後の古い連載成果物・サイトマップの除去を検証しています。
- Actionsと同じ`npx tsc --noEmit`は成功。追加の`npx tsc --noEmit -p tsconfig.app.json`には作業前から17件の型エラーがあり、HEADの退避ソースと比較して新規エラーなしを確認しています。参照先まで検査する場合は既存エラーの対応が別途必要です。

本番固有のプラグイン構成・XServerのAPI制限・実際のGitHub通知／SSH同期・実機Safari・Cronの時刻保証は未確認です。今回の追加に独自SQLはなく、Phase 1の保存処理も変更していません。今回の結合検証はSQLiteで、Phase 1で実施済みのMySQL 8.4検証は再実行していません。

## ローカルでの再検証

CMSの`docs/series-phase1.md`に従い、マーカー付き隔離WordPressを作ります。HTTP確認では`OJL_SERIES_HTTP_TEST=1`を指定し、元サイトの設定を参照しないコピーを作ってください。

```sh
# CMSリポジトリで実行します。
OJL_SERIES_TEST_ROOT=/隔離WordPress php wp-content/mu-plugins/tests/series-phase2.php
OJL_SERIES_TEST_ROOT=/隔離WordPress php wp-content/mu-plugins/tests/series-phase2.php --build-fixture
php -S 127.0.0.1:8789 -t /隔離WordPress
```

ビルド用データのオプションは検証環境だけにテスト記事と15分のトークンを保持します。HTTPサーバー起動後、Reactリポジトリで明示的に一時ビルド先とローカルAPIを指定してください。`.env`や本番設定は変更しません。

```sh
BUILD_OUT_DIR=/一時領域/series-dist \
VITE_WP_GRAPHQL_ENDPOINT=http://127.0.0.1:8789/graphql \
VITE_WP_PREVIEW_AUTH_USER='' VITE_WP_PREVIEW_AUTH_PASSWORD='' npx vite build --mode production

BUILD_OUT_DIR=/一時領域/series-dist WP_GRAPHQL_ENDPOINT=http://127.0.0.1:8789/graphql node scripts/generate-post-cache.mjs
BUILD_OUT_DIR=/一時領域/series-dist WP_GRAPHQL_ENDPOINT=http://127.0.0.1:8789/graphql APP_ENV=production node scripts/generate-sitemap.mjs
BUILD_OUT_DIR=/一時領域/series-dist WP_GRAPHQL_ENDPOINT=http://127.0.0.1:8789/graphql \
URL_LIFECYCLE_API_TOKEN=isolated-series-lifecycle-test URL_LIFECYCLE_REQUIRED=true node scripts/postbuild.mjs
BUILD_OUT_DIR=/一時領域/series-dist node scripts/validate-production-build.mjs
```

一時ビルド先をDocumentRootとするApacheを`127.0.0.1:8791`で起動し、`mod_rewrite`、`mod_headers`、`mod_setenvif`、`AllowOverride All`を有効にします。既存の`playwright-chromium`と対応ブラウザーを使用します。

```sh
OJL_SERIES_TEST_ROOT=/隔離WordPress BUILD_OUT_DIR=/一時領域/series-dist node scripts/series-browser.mjs
```

スクリーンショットは`/private/tmp/ojl-series-phase2-screenshots`へ保存します。トークンが期限切れなら隔離データを作り直し、ビルドも更新してください。終了時はローカルサーバーを停止し、一時環境のトークンファイルを削除してください。

## 本番反映時の作業

1. 既存の未コミット変更と今回の変更を区別してレビューし、ステージングで実際の有効プラグイン・編集画面・プレビューを確認します。既存の共有認証プレビューは新連載の確認には使用しません。
2. Phase 1のCPT・保存処理とPhase 2のCMSファイルを反映し、CPT登録後にWordPressのリライトルールを一度再生成します。毎リクエストの再生成やDB移行は不要です。Phase 1のInnoDB要件は維持します。
3. フロントを既存の全件ビルド・成果物検査・同期で反映します。新しい2ディレクトリは管理対象として削除同期されます。既存Webhookの有効化・GitHub接続設定は変更不要です。
4. 第1回公開、第2回の予約公開、前回リンク更新、予告延期、連載の非公開化、特集フラグ、canonical・404・プレビュー・サイトマップを確認します。予約時刻と反映完了時刻の差も確認します。

連載一覧ページ、トップの連載専用枠、差分ビルド、旧連載の一括移行は今回の対象外です。
