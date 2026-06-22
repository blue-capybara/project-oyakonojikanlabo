# soft404 入力データ

このディレクトリには、Search Console 由来の soft404 対策用 CSV の参照スナップショットを配置します。

410 ルールの生成元はローカル CSV ではなく、CMS 側の URL ライフサイクル管理 API です。フロントのビルドでは `scripts/postbuild.mjs` が CMS から `.htaccess` ルールを取得します。

## 使い方

1. Search Console の Coverage Drilldown から `表.csv` をダウンロードします。
2. 本番 CMS と一致する API トークンを環境変数に設定します。

```bash
export URL_LIFECYCLE_API_TOKEN='CMS 側と一致するトークン'
```

3. まず dry-run で取り込み結果を確認します。

```bash
npm run import:soft404 -- /path/to/表.csv --dry-run --details --limit=50
```

4. 問題がなければ dry-run を外して CMS に取り込みます。

```bash
npm run import:soft404 -- /path/to/表.csv --details --limit=50
```

5. `npm run build:prod` または `npm run build:stg` を実行すると、`scripts/postbuild.mjs` が CMS の `/wp-json/ojl/v1/htaccess-rules` からルールを取得して `.htaccess` に反映します。

## ファイル

- `gsc_soft404.csv`: soft404 一覧の参照スナップショット。ビルド時の直接入力ではありません。

## 補足

- 元の `表.csv` は `URL,前回のクロール` 形式でも、そのまま取り込めます。
- `URL_LIFECYCLE_IMPORT_ENDPOINT` を指定すると、取り込み先 API を明示できます。
- `URL_LIFECYCLE_RULES_ENDPOINT` を指定すると、ビルド時のルール取得先 API を明示できます。
