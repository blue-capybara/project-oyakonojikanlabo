# 商品とコラム記事の連携

## 導入

WordPressの投稿に固定IDを持たせ、公開記事APIからShopifyの記事Metaobjectへ同期します。商品担当者は商品管理画面で記事タイトルを検索し、1件選びます。商品ページは同期済みの情報をLiquidで表示するため、訪問者のブラウザーからWordPressへ通信しません。

この実装の追加だけでは本番設定・テーマ公開・ID付与・商品移行は実行されません。自動同期はリポジトリ変数 `SHOPIFY_ARTICLES_ENABLED` が文字列 `true` の場合だけ動きます。導入承認と受け入れテストが完了するまで、未設定または `false` のままにします。

### 事前確認結果

- 対象ストアは `oyakonojikan.myshopify.com` です。
- 旧商品メタフィールドは `my_fields.wp_post_id`、型は `number_integer`、単一値です。管理画面の定義の利用表示は24商品でした。移行時にはAPIで再集計します。
- 既存Supabase連携はAdmin APIトークン方式です。既存アプリの権限は顧客の読み書きのみで、記事同期に流用しません。
- 本番の `/wp-json/` と `/wp-json/wp/v2/posts` は200 JSONで応答しました。新しいAPIのパスは未導入のため `rest_no_route` でした。

### ファイルの責務

| プロジェクト                        | ファイル                                      | 役割                                                                                 |
| ----------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| WordPress `cms-oyakonojikanlabo-jp` | `wp-content/mu-plugins/ojl-content-api.php`   | 固定ID、公開REST API、初期付与・対応表CLIです。                                      |
| WordPress                           | `wp-content/mu-plugins/tests/content-api.php` | 本番DBへ接続しない契約テストです。                                                   |
| React / 公開サイト                  | `scripts/shopify-articles.mjs`                | 定義作成、同期、チェック、商品移行・復旧のCLIです。                                  |
| React / 公開サイト                  | `scripts/shopify-articles.schema.json`        | Metaobjectと商品参照の定義です。                                                     |
| React / 公開サイト                  | `scripts/shopify-articles.test.mjs`           | API・同期・復旧処理のテストです。                                                    |
| React / 公開サイト                  | `.github/workflows/shopify-articles.yml`      | 手動実行とデプロイ後の同期です。                                                     |
| React / 公開サイト                  | `.github/workflows/production-deploy.yml`     | 成功時は同期、失敗時は確定した公開終了記事だけを非公開化する呼び出しを追加しました。 |
| React / 公開サイト                  | `package.json`                                | CLI実行とテストの登録を追加しました。                                                |
| Shopifyテーマ                       | `sections/product-related-article.liquid`     | タイトル・画像・抜粋・リンクの表示です。                                             |
| Shopifyテーマ                       | `assets/section-product-related-article.css`  | カードのレスポンシブ表示です。                                                       |
| Shopifyテーマ                       | `templates/product.json`                      | 商品動画の後、関連商品の前に配置しました。                                           |

既存のWPGraphQL取得・React画面・記事プリレンダーは変更していません。公開ページの確認には既存のcanonical、記事マーカー、`ojl-post-cache` を使います。追加依存パッケージはありません。WordPress側の正本はCMSプロジェクトです。Reactプロジェクト内のWordPress複製へは追加しません。

## API・データの契約

### 固定ID

投稿の非公開メタデータ `_ojl_article_id` に `article_<小文字UUID v4>` を保存します。通常投稿だけが対象です。タイトル・slug・公開状態を変えても再発行しません。新しい投稿や通常の複製には新しいIDを付与します。リビジョン・自動保存・auto-draftでは付与しません。

通常のメタデータAPIからのコピー・編集・削除は拒否します。DBを直接複製するツールはこの保護を回避するため、重複をAPIの409とbackfillのエラーで検知します。重複を自動で振り直しません。CMS移行ではIDもデータとして引き継ぎます。同一記事の復旧はDBバックアップから同じIDを戻します。別記事への作り替えでは元のIDを流用しません。

### 公開API

基点は `https://cms.oyakonojikanlabo.jp/wp-json/ojl-content/v1` です。認証不要、GETのみ、`Cache-Control: no-store` です。GETは固定IDを発行しません。初回backfillが完了するまでは503です。

| パス                           | 応答                                                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `/articles?page=1&per_page=50` | `data` 配列と `pagination: {page, per_page, total, total_pages}` です。per_pageは1〜100、pageは1〜1,000,000です。 |
| `/articles/{article_id}`       | `data` に1記事を返します。                                                                                        |

```json
{
  "data": {
    "id": "article_12345678-1234-4234-8234-123456789abc",
    "title": "記事タイトル",
    "excerpt": "記事の抜粋です。",
    "canonical_url": "https://oyakonojikanlabo.jp/example/",
    "image": {
      "url": "https://cms.oyakonojikanlabo.jp/wp-content/uploads/example.jpg",
      "alt": "画像の説明"
    },
    "updated_at": "2026-09-01T00:00:00Z"
  }
}
```

画像なしは `image: null` です。抜粋は手動抜粋を優先し、なければ本文から生成します。HTML・script・style・ショートコードを取り除き、省略記号を含め最大160文字です。空は空文字列です。本文・WordPress数値ID・管理URLは返しません。

公開・パスワードなしの通常投稿だけを返します。既存URLライフサイクル管理で301・404・410等になった記事も公開対象から外します。公開URLは既存permalinkのパスと公開サイトoriginから生成します。originは必要な環境だけWordPress定数 `OJL_CONTENT_PUBLIC_ORIGIN` で変更できます。

一覧はWordPressの投稿ID昇順です。`total` と `total_pages` は公開・パスワードなし投稿の走査件数です。その後URLライフサイクルで除外する場合、返却記事数はこの件数を下回ります。空ページでも最終ページまで取得します。途中失敗や重複があれば一覧に基づく追加・更新は行いません。一覧から消えたことだけでは非公開化しません。

エラーはWordPress標準の `{code, message, data: {status}}` です。

| HTTP | code                  | 意味・処理                                                       |
| ---- | --------------------- | ---------------------------------------------------------------- |
| 400  | `INVALID_REQUEST`     | IDまたはページ指定が不正です。                                   |
| 404  | `ARTICLE_UNAVAILABLE` | 未存在・削除・非公開・パスワード保護等です。詳細は公開しません。 |
| 409  | `ARTICLE_ID_CONFLICT` | 固定IDの重複・不正です。保守担当者が修正します。                 |
| 503  | `CONTENT_NOT_READY`   | 初期付与未完了、固定ID不足、必須情報不足等です。                 |

非公開化できるのは、個別取得でHTTP404・code・data.statusがすべて一致する場合だけです。一般的な404、HTMLエラー、認証障害、429、5xx、タイムアウトは確認不能として扱い、既存カードを自動で消しません。

公開ページ確認では次の全条件を必要とします。

1. GETの最終HTTPステータスが200、Content-Typeがtext/htmlであることです。
2. 最大5回の同一origin内リダイレクト後のURLがcanonical_urlに一致することです。
3. HTMLにcanonicalリンクがちょうど1個あり、そのURLも一致することです。
4. `main[data-prerendered-article="true"] article` があることです。
5. `script#ojl-post-cache[type="application/json"]` がちょうど1個あり、既存schemaVersion 1の形式・slug・pathを検証できることです。

HTTPS、標準URLのhost・既定ポートの正規化、末尾スラッシュと同じバイトを示す%hh表記の大小の差を許容します。パスの大文字小文字を同一視せず、クエリ・フラグメント・別ドメインは拒否します。200を返す404画面だけでは成功になりません。ただし、この判定は最新の本文リビジョンまで証明するものではありません。判定失敗は更新保留として報告し、削除扱いにはしません。

### Shopify定義

Metaobjectはマーチャント所有の `ojl_article`、表示名フィールドは `title`、publishableを有効にします。adminは `MERCHANT_READ_WRITE`、storefrontは `PUBLIC_READ` です。onlineStore・render・翻訳機能は追加しません。handleは固定IDの `article_` を `article-` に置き換えます。

| キー              | 型                     | 必須   |
| ----------------- | ---------------------- | ------ |
| content_id        | single_line_text_field | はい   |
| title             | single_line_text_field | はい   |
| excerpt           | multi_line_text_field  | いいえ |
| canonical_url     | url                    | はい   |
| image_url         | url                    | いいえ |
| image_alt         | single_line_text_field | いいえ |
| source_updated_at | date_time              | はい   |
| synced_at         | date_time              | はい   |

商品は `custom.related_article`、単一 `metaobject_reference`、上記定義への参照だけを許可します。任意項目・storefront公開です。旧wp_post_idは残し、Liquidでの旧項目へのフォールバックは設けません。

同期はAdmin GraphQL `2026-07` の `metaobjectUpsert(handle, values)` で全8フィールドを毎回明示します。空の任意項目はnullとして保存し、読み戻してクリアを検証します。同じhandle・GIDを保ち、公開終了時はDRAFT、再公開時はACTIVEにします。Metaobjectを削除せず、通常同期で商品参照を変更しません。DRAFTはLiquidから取得できないため、カード・見出し・余白を出しません。

## 導入手順（別途承認後）

### 1. 認証とバックアップ

保守担当者がWordPress DBとテーマをバックアップします。記事連携用のAdmin APIトークンを用意し、対象ストアと有効期限・更新方法を管理します。Storefront APIトークンでは動きません。短期トークンを固定secretのまま放置せず、実際に採用する認証方式の更新手順を確認します。

- 日常同期・チェック: `read_products`、`read_metaobjects`、`write_metaobjects` が必要です。
- setup: 上記に加え定義の `read_metaobject_definitions`、`write_metaobject_definitions` と商品定義用 `write_products` が必要です。
- 商品移行・復旧: `write_products` が必要です。日常同期の資格情報と分けられます。

ローカルではシークレット管理ツール等から環境変数を注入します。トークンをコマンド行、リポジトリ、移行記録へ書きません。

| 環境変数                  | 値                                                                    |
| ------------------------- | --------------------------------------------------------------------- |
| SHOPIFY_STORE_DOMAIN      | `oyakonojikan.myshopify.com`                                          |
| SHOPIFY_ADMIN_TOKEN       | 実行用途のAdmin APIトークンです。                                     |
| SHOPIFY_ADMIN_API_VERSION | 既定 `2026-07` です。バージョンの自動フォールバックはエラーにします。 |
| CONTENT_API_BASE_URL      | 既定は上記本番APIです。                                               |
| PUBLIC_SITE_ORIGIN        | 既定 `https://oyakonojikanlabo.jp` です。                             |

### 2. WordPressとShopifyの準備

WordPressのMUプラグインを設置します。サーバーのWordPressルートで次を実行します。

```sh
wp ojl-content backfill
wp ojl-content backfill --apply
wp ojl-content export-map > /安全な保管先/wp-article-map.json
```

初回付与は全公開状態の通常投稿を対象にします。再実行しても既存IDは変わりません。エラーで終わった場合は原因を直して再実行します。対応表は移行先にも必要なので非公開の安全な場所に保管します。

Reactプロジェクトで、定義と同期内容を確認してから適用します。

```sh
npm run shopify:articles -- setup
npm run shopify:articles -- setup --apply
npm run shopify:articles -- sync
npm run shopify:articles -- sync --apply
npm run shopify:articles -- check
```

setupは同じ定義なら変更しません。既存定義が異なる場合は自動で型等を変更せず停止します。syncには公開ページの生成・デプロイ完了が必要です。

### 3. 初回商品移行と復旧記録

初回移行・復旧は保守担当者の永続ディスクを持つローカル端末で実施します。CI・GitHub Actionsではdry-runも含め拒否します。同時に対象商品を編集したり、別の移行処理を起動したりしないでください。

```sh
npm run shopify:articles -- migrate --legacy-namespace my_fields --map /安全な保管先/wp-article-map.json
npm run shopify:articles -- migrate --legacy-namespace my_fields --map /安全な保管先/wp-article-map.json --apply
```

既存の新参照が空欄の場合だけ、旧IDの対応先が現在公開中かつ同期済みであることを確認し、`compareDigest: null` により空欄への設定だけを許可します。既存参照は上書きしません。対応不明・非公開・型違いは商品ごとに報告します。旧wp_post_idは変更・削除しません。

復旧記録の保存先は次です。これはプロジェクト・Actions runner・一時ディレクトリの外です。

```text
~/.local/share/oyako-content-sync/migrations/<store>/<migrationId>/journal.json
```

ディレクトリ700・ファイル600で、商品ごとの変更前後、旧値、固定ID、処理状態、保存結果のdigestを記録します。トークンは記録しません。最初の更新前に全予定をatomic renameとfsyncで永続化し、商品ごとの更新後にも保存します。記録保存に失敗したら次の商品へ進みません。中断時はplanned/unknownを含めて現状を読み直します。

端末紛失に備えて、保守担当者は移行記録をアクセス制限したバックアップ先にも複製します。**最後の移行・復旧操作から最低1年間保持**します。自動削除しません。バックアップ先のアクセス管理と引継ぎ担当者は導入時に決めます。

```sh
npm run shopify:articles -- restore --journal /絶対パス/journal.json
npm run shopify:articles -- restore --journal /絶対パス/journal.json --apply
```

restoreは記録のストア一致を検証します。現在の参照が移行時の値と一致する商品だけ空欄へ戻し、その後に担当者が差し替えた商品は飛ばします。記録がある場合はdigestも照合します。削除直前にもう一度読み直しますが、ShopifyのmetafieldsDeleteにはCASがありません。**復旧中は対象商品の関連記事編集と他の移行処理を止めます。** 参照以外の項目・Metaobject・旧wp_post_idは変更しません。

### 4. テーマと実ストア受け入れテスト

対象テーマは `theme___shop-oyakonojikanlabo-jp-dawn__2026-0228pm` です。まず未公開テーマで確認します。別の商品テンプレートを使う商品には、このセクションを別途配置します。

本番導入前に、許可されたテスト商品・記事で以下を実ストア確認します。ローカルテストのみでは完了扱いにしません。

- タイトルから検索して1件選べ、画像あり・画像なし・抜粋なし・長いタイトルがPC/スマートフォンで読めることです。
- 選択なしで見出し・余白が残らず、リンク先が正しい記事になることです。
- **ACTIVE → DRAFT → ACTIVE**でMetaobjectのGIDと商品の参照値が同じであることをAdmin APIで比較します。
- DRAFTを参照した商品の管理画面表示を確認し、記事カードと見出し・余白が消えることを確認します。
- ACTIVEへ戻すと、商品で選び直すことなくカードが戻ることを確認します。
- 画像・抜粋を空にした後、以前の値が残らないことを実APIで確認します。
- slug変更時に固定IDとGIDを保ち、公開ページ反映後に新URLへ更新されることです。
- 移行dry-run、少数商品の移行、記録からの復旧、担当者が変更した参照の保護を確認します。

これらの実ストア変更・テーマ公開・データ移行は今回のローカル実装では未実施です。

### 5. 自動同期の有効化

受け入れ後、GitHubのproduction環境にsecret `SHOPIFY_ARTICLES_ADMIN_TOKEN` を設定します。リポジトリ変数 `SHOPIFY_STORE_DOMAIN` を設定し、最後にリポジトリ変数 `SHOPIFY_ARTICLES_ENABLED=true` とします。ジョブ開始前のifで使うため、enabledはenvironment限定の変数にしません。

既存の本番デプロイ成功後はsync、失敗時はdeactivateを実行します。後者はAPIで公開終了が確定した記事をDRAFTにするだけで、新規作成・ACTIVE化はしません。デプロイのskip・cancel・dry-runでは実行しません。記事同期ジョブ同士は同時実行せず、実行中のジョブをキャンセルしません。

手動Actionsの選択肢はcheck、dry-run、sync、deactivateです。setup・migrate・restoreは含めません。1時間監視・メール・タグ付与・CSV・停止監視・自動差し替えは実装しません。

## 日常運用と異常確認

Shopify担当者は商品編集の「関連するコラム記事」でタイトル検索して1件選択し、保存します。差し替えは別記事を選び直し、掲載終了は選択を解除します。同名記事の場合はMetaobject詳細の公開記事URLを確認します。記事MetaobjectはWordPressの同期結果なので直接編集・削除しません。管理画面で項目を見つけやすくするピン留めは導入担当者が設定できます。

WordPress担当者は従来どおり投稿を編集・公開します。ID入力は不要です。タイトル・slugの変更は既存の公開サイト再生成後に反映されます。記事Xを記事Yへ差し替えるときは、Shopify担当者へYの選択を依頼します。後継記事への自動差し替えはありません。

保守担当者はActionsの実行結果とSummary、またはローカル `check` の表で、商品管理リンク・商品状態・固定ID・表示対象/非表示/不明・理由を確認します。アーカイブ商品も状態を付けて報告します。未選択は正常です。checkは公開ページも検査し、一切書き込みません。

終了コードは0が問題なし、1が設定不整合、2が確認不能・処理失敗です。API障害や公開ページ不一致は公開終了と区別します。ジョブ自体が開始できない場合はActionsログを確認します。メール通知はありません。定期監視を設けないため、同期・checkが実行されるまで異常は反映されません。緊急に隠したい場合は商品側で参照を解除します。

商品を販売終了にするときは通常の商品管理を行います。記事Metaobjectはほかの商品でも共有されるため削除しません。記事の削除・公開終了後にDRAFTになっても商品参照は保持し、必要なら担当者が解除・差し替えます。

## 保守と検証

```sh
npm test
npx tsc --noEmit
php /Users/ns/projects/cms-oyakonojikanlabo-jp/wp-content/mu-plugins/tests/content-api.php
shopify theme check --path /Users/ns/projects/theme___shop-oyakonojikanlabo-jp-dawn__2026-0228pm
```

API形式、ID・handle規則、商品参照の型、記録保存方式は後から変更すると移行コストが高いため維持します。別CMSへ移る場合は固定IDと公開API契約を引き継ぎ、CONTENT_API_BASE_URLを切り替えます。URL検証のプリレンダーマーカーは現サイト固有なので、新公開サイトでは検証アダプターを対応させます。slugやURLを記事のidentityにしません。

監視間隔、通知、CSV、管理画面、複数関連記事は後から別途追加できます。Shopify APIバージョン更新は保守項目です。年単位で放置せず、採用バージョンの提供期間内に公式変更点・空値更新・参照維持の受け入れテストを再確認します。

参照した公式仕様は [metaobjectUpsert](https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectUpsert)、[Liquid metaobject](https://shopify.dev/docs/api/liquid/objects/metaobject)、[metafieldsSet](https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsSet)、[metafieldsDelete](https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsDelete) です。

## まとめ

長期保持する固定IDとAPI契約、Shopify標準の選択UIを先に固定し、監視・通知等の運用機能は増やしていません。まず少数商品で実ストア受け入れを完了し、記録を残して移行してから自動同期を有効にします。
