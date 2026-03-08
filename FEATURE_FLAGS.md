# Feature Flags メモ

以下の環境変数を `.env` / `.env.production` などに設定することで、会員機能や一部セクションの表示を切り替えられます。Vite なので変更時は再ビルド or 再起動が必要です。

| 環境変数                          | 対応フラグ                | デフォルト | OFF 時に非表示 / 無効化されるもの                                                                                                                                | ON 時に復帰する内容                  |
| --------------------------------- | ------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `VITE_FEATURE_SHOW_COLLAB_SIGNUP` | `showCollaborationSignup` | `false`    | `HomePage/CollaborationBanner` コンポーネント（コラボ会員募集）のセクション                                                                                      | バナーが再描画され CTA が復活        |
| `VITE_FEATURE_SHOW_PICO_SERVICES` | `showPicoServiceSections` | `false`    | PICO ページのメニュー内リンク（カルチャースクール / 商品）、お買いもの・おすすめ商品・キッズスクール・カルチャースクール各セクション                             | 対象リンクやセクションが元通り表示   |
| `VITE_FEATURE_SHOW_MEMBERSHIP`    | `showMembershipFeatures`  | `false`    | マイページ導線（ヘッダー右上アイコン等）、`/login` `/signup` `/mypage` ルート、各種「お気に入り」ボタン、EventReservation のログインブロックなど会員関連 UI 全般 | 会員機能が再び表示され通常運用に戻る |

## 運用メモ

- `.env.example` にも 3 つのキーを追加済み。新しい環境を作るときはここを参考にしてください。
- 将来的にフラグを増やす場合は `src/config/featureFlags.ts` に追記し、TypeScript 型や `.env.example` を忘れず更新すること。
- `VITE_FEATURE_SHOW_MEMBERSHIP=false` ではお気に入り機能の Supabase 呼び出しを抑制しているため、OFF/ON の切り替えだけで安全に再公開できます。
- 主要な非表示対象：
  - ヘッダーのログインアイコン（`Header.tsx`）
  - ルーティング `App.tsx` （無効化時は `/` にリダイレクト）
  - `useFavorite` 利用先（Post/Event/School 詳細、各アーカイブのハートボタン）
  - EventReservation ページ内のログインフォームや注意文

これらの値を true に戻したら再ビルドし、フロントのビジュアル差分を確認してからローンチ第2弾へ移行してください。
