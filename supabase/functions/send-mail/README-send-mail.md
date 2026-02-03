# Supabase Edge Function デプロイ手順（send-mail）

このファイルは
**「久しぶりに触って、次に何をすればいいか忘れた未来の自分」**
のためのメモです。

対象 Function：`send-mail`

---

## 対象ファイル

```text
supabase/functions/send-mail/index.ts
```

- お問い合わせフォーム送信
- Resend によるメール送信
- 管理者通知 / 自動返信
- DB（contact_messages）保存

---

## 基本フロー（これだけ覚えればOK）

> **index.ts を編集したら deploy**

---

## ① コード編集

```text
supabase/functions/send-mail/index.ts
```

例：

- メール本文変更
- 管理者通知の文言修正
- DB 保存項目の追加
- 画像URLの扱い変更 など

---

## ②（任意）ローカルチェック

```bash
tsc --noEmit
# or
npm run lint
```

※ 型エラー・構文ミス防止用
※ 忙しいときはスキップしてもOK

---

## ③ Edge Function をデプロイ（必須）

### stg / prod 共通

```bash
supabase functions deploy send-mail
```

⚠️ **これをやらないとコードは反映されない**

- index.ts を保存しただけではダメ
- Dashboard 上の Functions は自動更新されない

---

## 環境別の確認ポイント

### ■ stg（検証）

- フロント：`https://stg.oyakonojikanlabo.jp/contact`
- Functions Logs でエラーが出ていないか
- Resend の Logs でメール送信確認
- DB にデータが入っているか

### ■ 本番（prod）

- stg で確認後に同じ手順で deploy
- env が prod 用になっているか要確認
- 宛先メールアドレスが本番用か確認

---

## 使用している環境変数（重要）

※ **すべて Supabase Dashboard → Settings → Functions → Environment Variables**

| Key                         | 用途                        |
| --------------------------- | --------------------------- |
| `RESEND_API_KEY`            | Resend APIキー              |
| `ADMIN_TO`                  | 管理者 To（カンマ区切り可） |
| `ADMIN_CC`                  | 管理者 CC（任意）           |
| `ADMIN_BCC`                 | 管理者 BCC（任意）          |
| `SUPABASE_URL`              | Supabase URL                |
| `SUPABASE_SERVICE_ROLE_KEY` | DB 書き込み用               |

### メール宛先の書き方例

```text
ADMIN_TO=info@oyakonojikanlabo.jp,sub@oyakonojikanlabo.jp
ADMIN_CC=
ADMIN_BCC=archive@oyakonojikanlabo.jp
```

- 空欄OK（未設定扱い）
- カンマ区切りで複数指定可能
- env 変更後 **再デプロイ不要（即時反映）**

---

## トラブル時の確認順

1. **Supabase → Functions → Logs**
2. **Resend → Emails Logs**
3. **DB（contact_messages）**
4. env が正しく入っているか

---

## よくある罠

- deploy 忘れ（最多）
- env を変えたと思ったら stg/prod を間違えていた
- Logs を古い version で見ている

---

## 最後に

> **index.ts を触ったら deploy**

これだけ覚えていれば、この Function は運用できます。
