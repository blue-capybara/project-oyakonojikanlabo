# Shopify 連携メモ

このドキュメントは `sync_to_shopify` Edge Function の運用手順をまとめたものです。検証／本番での作業時に参照してください。

## CORS 設定

ブラウザから Edge Function を呼び出すため、許可するドメインを `SYNC_ALLOWED_ORIGINS` に登録します。カンマ区切りで複数指定できます。フロントエンドからは `email`, `userId` に加え、ユーザーの同意状況を示す `consent` フラグ（true のときのみ Shopify 登録）を送信します。

```bash
  supabase secrets set SYNC_ALLOWED_ORIGINS="http://localhost:5173,https://react.oyakonojikanlabo.xyz/,https://oyakonojikanlabo.jp/"
```

- **ローカル開発**: `http://localhost:5173`（Vite デフォルト）
- **本番／ステージング**: 実際のサイト URL に置き換えてください
- 再設定すると上書きされます。既存の値は `supabase secrets list` で確認可能

## デプロイ手順

1. シークレット更新後、最新の値を反映するために再デプロイ
   ```bash
   supabase functions deploy sync_to_shopify --no-verify-jwt
   ```
2. デプロイが完了したら、`curl` またはアプリ上で疎通確認

## 動作テスト例

```bash
curl -i https://<project-ref>.functions.supabase.co/sync_to_shopify \
  -H "Content-Type: application/json" \
  -d '{"email":"foo@example.com","userId":"00000000-0000-0000-0000-000000000000","consent":true}'
```

- `ok: true` が返れば成功
- `ok: false` の場合は `error` 内容を確認（Shopify 側エラーや認証情報の漏れが多い）

## ニュースレター登録（メールアドレスのみ）

`register_newsletter` Edge Function は、メールアドレスのみで Shopify のマーケティング購読に登録します。既存顧客は購読状態を `SUBSCRIBED` に更新し、新規の場合は顧客を作成します。

### 追加シークレット

- オプションで `NEWSLETTER_TAG` を設定すると、登録顧客に自動でタグ付けします。未設定の場合は `newsletter-only` が利用されます。

```bash
supabase secrets set NEWSLETTER_TAG="newsletter"
```

### デプロイ

```bash
supabase functions deploy register_newsletter --no-verify-jwt
```

### curl テスト例

```bash
curl -i https://<project-ref>.functions.supabase.co/register_newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"foo@example.com"}'
```

- `action: "created"` または `action: "updated"` が返れば成功
- 400 が返る場合はメールアドレスの形式を、500 の場合は Shopify 側のレスポンスを確認

## よくあるエラー

- **CORS: No 'Access-Control-Allow-Origin' header**  
  `SYNC_ALLOWED_ORIGINS` にアクセス元ドメインが含まれているか確認し、Edge Function を再デプロイ
- **Shopify GQL error**  
  Shopify Admin API トークン／権限の確認。レスポンスに `userErrors` が含まれることもあるため、メッセージ内容を確認する
- **FunctionsFetchError**  
  ネットワークエラーまたは関数 URL の誤り。Supabase プロジェクトの環境を確認

## 参考

- Edge Function コード: `supabase/functions/sync_to_shopify/index.ts`
- フロント連携ロジック: `src/lib/shopifySync.ts`, `src/pages/Signup.tsx`
