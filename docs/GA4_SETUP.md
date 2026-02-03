# GA4 埋め込みと環境ごとの無効化方針

本番のみ GA4 を動かし、ステージ (`stg.oyakonojikanlabo.jp`) ではリクエストが飛ばないようにする設定メモです。

## 方針
- **環境変数で無効化**: ステージ用の環境では `VITE_GA_MEASUREMENT_ID` を空にする。
- **ホスト名チェックで二重に防止**: `index.html` で `allowedHosts` に含まれないホスト（ステージ・ローカル）は gtag を読み込まない。
- **GA4-B は追加実装**: 既存 GA4-A に触れず、`send_to` で GA4-B のみに送信する。

## 運用手順
1. 本番デプロイ用 env
   - `.env.production` に `VITE_GA_MEASUREMENT_ID=G-1X3MS606B9` を設定。
   - `.env.production` に `VITE_GA4_B_ID=G-XXXXXXXXXX` を追加（Shopify と同一 ID）。
2. ステージデプロイ用 env
   - `.env.stg` などに `VITE_GA_MEASUREMENT_ID` を**空のまま**置く（キー自体を削除でも可）。
   - GA4-B を無効化したい場合は `VITE_GA4_B_ID` も空にする。
3. コード側の制御
   - `index.html` で `allowedHosts = ['oyakonojikanlabo.jp', 'www.oyakonojikanlabo.jp']` のみ gtag を動的挿入。
   - 上記ホスト以外は gtag を挿入せず、`window.__GA_MEASUREMENT_ID__` も未設定のまま。
   - GA4-B は `src/analytics/ga4b.ts` で `send_page_view: false` のみ初期化し、`send_to` 指定で `page_view` を手動送信。
4. デバッグ確認
   - 本番: ブラウザで DevTools の `Network` に `collect` ヒット、GA DebugView でページビューを確認。
   - ステージ: `collect` リクエストが発生しないことを確認。

## 参考: 主な変更ファイル
- `index.html`: gtag の動的挿入＋ホスト名チェック。
- `src/lib/ga.ts`: ページビュー送信用ヘルパー（gtag 初期化済みのみ動作）。
- `src/analytics/ga4b.ts`: GA4-B 初期化・page_view 手動送信・linker 設定。
- `src/analytics/useGa4BPageView.tsx`: React Router のルート変更で GA4-B `page_view` を送信。
- `.env.example`: `VITE_GA_MEASUREMENT_ID` を追記（サンプル値）。

## 環境ファイルの役割（GA4 観点）
- `.env`  
  - 開発者ローカル専用。基本はステージ同等の設定にしておき、`VITE_GA_MEASUREMENT_ID` は空のままにする運用を推奨。
- `.env.example`  
  - サンプル・雛形。GA4 の本番 ID（`G-1X3MS606B9`）を例示しつつ、実運用では各環境で値を上書きする。
  - GA4-B 用の `VITE_GA4_B_ID` も雛形として追記する。
- `.env.production`  
  - 本番ビルド／本番デプロイ用。`VITE_GA_MEASUREMENT_ID=G-1X3MS606B9` を設定しているので、そのまま使えば本番ドメインでのみ計測が有効化される。
  - GA4-B を有効化する場合は `VITE_GA4_B_ID=G-XXXXXXXXXX` を追加する。
- `.env.stg.example`  
  - ステージ用の雛形。`VITE_GA_MEASUREMENT_ID` を空にしておくことで、ステージ環境では gtag が初期化されず計測されない。
  - GA4-B を無効化する場合は `VITE_GA4_B_ID` も空にしておく。

この運用で「env を空にする」か「ホストが allowedHosts に含まれない」場合は gtag が走らないため、ステージ・ローカルでの誤計測を防げます。
