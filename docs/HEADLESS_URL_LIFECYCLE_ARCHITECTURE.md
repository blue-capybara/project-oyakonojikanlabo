# Headless URL Lifecycle 設計（本番運用）

## 1. 責務分離

- サーバー（Apache `.htaccess`）: 最終HTTPステータスを返す責務（`301` / `410` / SPA fallback）
- WordPress（CMS）: URLライフサイクルの真実データを管理（公開状態・削除状態・リダイレクト状態）
- GraphQL: `extensions.status` と `urlLifecycle` フィールドで「意図した状態」を通知
- React SPA: HTTP判定はしない。CMSから受けた状態を使ってUIのみ切り替える

## 2. URLライフサイクル定義

- 公開中コンテンツ: `200`
- 非公開（draft/private/pending等）: `404`
- 公開終了/削除済み（gone/trash/hard delete）: `410`
- 移転済み: `301`

## 3. WordPress実装（MU Plugin）

実装ファイル:

- `cms-oyakonojikanlabo-jp/wp-content/mu-plugins/ojl-url-lifecycle-manager.php`

実装内容:

- カスタム投稿ステータス `gone` を追加（管理画面のステータス表示付き）
- `transition_post_status` / `before_delete_post` で 410 対象URLを収集
- `post_updated` で slug変更時の 301 マップを自動生成
- 410/301 予約済みURLの slug 再利用を防止
- GraphQL `urlLifecycle(path: String!)` を追加
- GraphQL レスポンス `extensions.status` / `extensions.urlLifecycle` を付与
- 410/301 ルールをコンパイルしてRESTで提供
  - `GET /wp-json/ojl/v1/htaccess-rules`
  - `?format=plain` でプレーンテキスト取得可

## 4. .htaccess 自動反映（フロント）

実装ファイル:

- `app/project-oyakonojikanlabo/.htaccess`
- `app/project-oyakonojikanlabo/scripts/postbuild.mjs`

実装内容:

- `.htaccess` に自動更新ブロックを固定配置
  - `# BEGIN OJL URL LIFECYCLE` ～ `# END OJL URL LIFECYCLE`
- `postbuild.mjs` がビルド時にCMS REST APIからルールを取得し、ブロックを置換
- API失敗時はルールなしで継続（ビルドは継続）

環境変数:

- `URL_LIFECYCLE_RULES_ENDPOINT`（任意、未指定時は `WP_GRAPHQL_ENDPOINT` から自動推定）
- `URL_LIFECYCLE_API_TOKEN`（任意、CMS側トークン保護時）

## 5. React実装

実装ファイル:

- `src/lib/urlLifecycle.ts`
- `src/pages/PostDetailPage.tsx`
- `src/pages/EventDetailPage.tsx`
- `src/pages/GonePage.tsx`

実装内容:

- 画面遷移時にまず `urlLifecycle` を問い合わせ
- 判定結果に応じて処理を分岐
  - `301`: `window.location.replace(...)`
  - `410`: Gone画面
  - `404`: NotFound画面
  - `200`: 通常のGraphQL本文取得
- React側で「本文nullだから404」などの独自HTTP判定はしない

## 6. ソフト404抑止チェック

- 削除済みURLは `.htaccess` で `410`
- 本文取得失敗のUIエラーは `404` 画面と分離（誤認防止）
- sitemapは公開済みのみを出力（既存 `generate-sitemap.mjs` 方針を維持）
- 内部リンク更新（削除URLへのリンク除去）は編集運用で継続

## 7. 移行手順（既存運用から）

1. MU Plugin を本番CMSへ配置
2. WordPressで `gone` ステータス運用を開始
3. 既存手動410リストを option へ初回投入（管理作業 or WP-CLI）
4. フロントビルドを実行し、自動挿入された `.htaccess` をデプロイ
5. `curl -I` で `301/404/410/200` をサンプル検証
6. Search Console の soft404 推移を監視

## 8. パフォーマンス注意

- 410件数が増えるため、ルールはASCIIパスを `RewriteRule` にまとめて圧縮
- 非ASCII等の特殊パスは `Redirect gone` 個別行で安全に処理
- ルール生成は更新時のみ（毎リクエスト再生成しない）
- ルール取得APIはCI/CD時利用を前提にキャッシュ可能
