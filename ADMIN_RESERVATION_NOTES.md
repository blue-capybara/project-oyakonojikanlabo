# 管理用予約一覧まわりの備忘録

## 全体像

- フロント側 `/admin/reservations` に管理者向けの予約一覧ページを追加。Supabase Edge Function `admin_reservations` を呼び出し、CSV 出力や検索が可能。
- 予約保存時は `reservations` テーブルに `customer_name` / `customer_email` カラムへ会員プロフィールから取得した値を自動で格納。未入力の場合は Edge Function 側で Supabase Auth のユーザー情報から補完して返す。

## Supabase 側のセットアップ

1. テーブルに必要なカラムを追加（未作成の場合のみ実行）。
   ```sql
   alter table reservations
     add column if not exists customer_name text,
     add column if not exists customer_email text;
   ```
2. Edge Function 用シークレットの設定。
   ```bash
   supabase secrets set \
     SUPABASE_SERVICE_ROLE_KEY="<service_roleキー>" \
     ADMIN_RESERVATIONS_ALLOWED_EMAILS="admin@example.com,manager@example.com"
   ```
   - 既存値を確認するときは `supabase secrets list`。
   - メールアドレスの削除・追加はいずれも「最新のカンマ区切りリストで再度 `set`」すれば OK。完全にクリアする場合は `supabase secrets unset ADMIN_RESERVATIONS_ALLOWED_EMAILS` を実行してから必要な値で `set`。
   - 任意で `ADMIN_RESERVATIONS_ALLOWED_ROLE` や `ADMIN_RESERVATIONS_ALLOWED_ORIGINS` も設定可能。
3. Edge Function をデプロイ。
   ```bash
   supabase functions deploy admin_reservations
   ```

## 補完ロジックとバックフィル

- `admin_reservations` では、レコードに氏名・メールが無い場合 `auth.admin.getUserById` で Supabase Auth のユーザー情報を引き、レスポンスに補完して返す。大量取得時はユーザー数ぶんの追加リクエストが走る点に注意。
- 既存予約の DB を更新したい場合は、`auth.users`（または独自の `profiles` テーブル）を join した `update` 文で `customer_name` / `customer_email` をバックフィルしておくと一覧表示が高速化できる。

## フロント実装メモ

- `EventReservationPage.tsx` では会員プロフィールに氏名・メールが無い場合、予約をブロックしてマイページでの登録を促す。
- 管理画面の CSV には `customer_name` / `customer_email` が含まれる。表と CSV は Edge Function のレスポンスをそのまま利用するため、補完が成功していれば表示される。

## 運用上の注意

- 管理者メールやロールを変更したら、忘れずに `supabase functions deploy admin_reservations` を再実行する（デプロイ時に最新のシークレットが反映される）。
- Edge Function は Service Role キーを使用するため、シークレットの取り扱いやローテーションを定期的に行う。
- 氏名・メールが空のユーザーが多い場合は、マイページでのプロフィール更新をリマインドするか、サポート側で手動登録を実施する。必要なら定期的なチェッククエリを作成しておく。

## 管理者メール一覧の確認方法

- 現在登録されている秘密変数の一覧を確認する:
  ```bash
  supabase secrets list --project-ref <PROJECT_REF>
  ```
  ※ `<PROJECT_REF>` には Supabase のプロジェクト ID（例: `glwdbzwocxbezhzcegkt`）を指定する。`supabase link` 済みのディレクトリなら省略可。
- `ADMIN_RESERVATIONS_ALLOWED_EMAILS` の値を確認する:
  - Supabase の仕様上、既存シークレットの平文は取得できず、`supabase secrets list` の出力もハッシュ化された値になる。
  - そのため、追加・削除の際は常に手元の控え（例: パスワードマネージャに保存した最新リスト）を更新し、必要であれば `ADMIN_RESERVATIONS_ALLOWED_EMAILS="foo@example.com,bar@example.com"` のように全体を再設定する。
  - `supabase secrets set ADMIN_RESERVATIONS_ALLOWED_EMAILS="..."` は毎回上書き動作となるので、減らす場合も除外後の完全なリストで再実行する。
