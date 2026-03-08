# CSVテンプレート雛形

このディレクトリには、ソフト404/410運用で使うCSVの雛形を配置しています。

## ファイル一覧

- `unpublished.csv`: WordPress非公開URL一覧
- `gsc_soft404.csv`: Search Console の soft404 一覧
- `gsc_404.csv`: Search Console の 404 一覧
- `redirect_map.csv`: 301マップ（from/to）
- `valid_urls.csv`: 現行有効URL一覧（sitemap等由来）

## 共通ルール

- 文字コード: UTF-8（BOM有無どちらでも可）
- URLはパス形式（例: `/sample-path/`）
- 先頭 `/` を付ける
- 原則小文字で管理する
- クエリ（`?`）とフラグメント（`#`）は含めない

## 必須列

- `unpublished.csv`: `url`
- `gsc_soft404.csv`: `url`
- `gsc_404.csv`: `url`
- `redirect_map.csv`: `from,to`
- `valid_urls.csv`: `url`

## 補足

- `source` や `note` などの補助列は運用メモ用途です。
- 生成処理では必須列のみを読み取る前提にしてください。
