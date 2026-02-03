# Supabase 認証リダイレクト設定メモ

最終更新: 2024-08-06

## 設定場所

- Supabase Dashboard → Authentication → URL Configuration

## 現在の登録値

- **Site URL**: `http://localhost:3000`
  - デフォルトの戻り先。ローカル検証を優先するため現状のまま運用。
- **Redirect URLs**:
  - `https://react.oyakonojikanlabo.xyz/` （検証環境）
  - `https://oyakonojikanlabo.jp/` （本番予定ドメイン）
  - `http://localhost:5173/` （Vite ローカル開発用）

## 運用メモ

- 本番公開時には Site URL を `https://oyakonojikanlabo.jp/` に切り替えることを忘れない。
- 新たな環境を追加する場合は、Redirect URLs に対象ドメインを追加登録し、`redirectTo` の戻り先がリストに含まれているか確認する。
