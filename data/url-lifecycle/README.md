# soft404 入力データ

このディレクトリには、ローカルで追加管理する soft404 対策用 CSV を配置します。

## 使い方

1. Search Console の Coverage Drilldown から `表.csv` をダウンロードします。
2. 次のコマンドでビルド用 CSV に正規化します。

```bash
npm run import:soft404 -- /path/to/表.csv
```

3. 生成された `gsc_soft404.csv` をコミットします。
4. `npm run build:prod` または `npm run build:stg` を実行すると、`scripts/postbuild.mjs` が `.htaccess` にローカル 410 ルールを合成します。

## ファイル

- `gsc_soft404.csv`: ビルド入力用の正規化済み soft404 一覧

## 補足

- 元の `表.csv` は `URL,前回のクロール` 形式でも、そのまま取り込めます。
- 個別 410 ルールは、公開中記事との衝突を避けるため、ビルド時に WordPress の公開記事一覧と照合してから生成します。
