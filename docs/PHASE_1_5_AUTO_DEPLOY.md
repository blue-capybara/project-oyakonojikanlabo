# フェーズ1.5 自動ビルド・デプロイ

## 目的

次の3つを入口として、同じ本番ビルド・デプロイ処理を実行します。

```text
WordPress更新 ── repository_dispatch ─┐
mainへのマージ ── push ───────────────┼→ 本番ビルド → 検査 → 本番同期
GitHubから再実行 ─ workflow_dispatch ─┘
```

`/lp/`と、同じ`public_html`配下にある別管理のサブドメイン・WordPressディレクトリは、どの入口から実行しても更新・削除しません。

## 自動デプロイの処理

`.github/workflows/production-deploy.yml`は、常に`main`ブランチを取得して次を実行します。

1. `npm ci`
2. 既存テスト
3. TypeScript検査
4. `npm run build:prod`
5. 生成された記事HTML／JSON、SEOメタ、301／410ルールの検査
6. SSH経由の`rsync`同期
7. トップ、サイトマップ、静的記事HTMLの公開確認

本番デプロイは同時に1件だけ実行します。先に始まったデプロイを途中でキャンセルせず、後続を待機させます。

## 別管理ディレクトリの保護

`public_html`全体に対する削除同期は行いません。次の方式で、このプロジェクトの生成物と別管理データを分離します。

- `.htaccess`の先頭で`/lp/`をURLライフサイクル・記事・SPAリライトから除外
- `deploy/rsync-excludes.txt`で`/lp/`を同期・削除から除外
- ルート直下はファイルだけを更新し、ディレクトリは削除しない
- 削除同期は`assets/`、`fonts/`、`icons/`、`images/`、`post-cache/`、`post-pages/`の内部だけで行う
- 生成物に未登録のディレクトリが追加された場合は、安全のためデプロイを停止する

これにより、不要になった記事HTML、JSON、ハッシュ付きアセットは削除しながら、`/lp/`や別サブドメインのWordPressデータなど、管理対象外のディレクトリには触れません。`--delete-excluded`は使用しません。

## GitHub production環境

リポジトリのActions Variablesへ次を登録します。

| Variable                    | 初期値  | 内容                             |
| --------------------------- | ------- | -------------------------------- |
| `PRODUCTION_DEPLOY_ENABLED` | `false` | 本番自動デプロイの有効化スイッチ |

`false`または未設定の場合、`main`へのマージとWordPress Webhookでは本番デプロイを実行しません。手動dry-runだけは、有効化前でも実行できます。

続いて、Settingsから`production` Environmentを作成し、次のSecretsを登録します。

| Secret                    | 内容                              |
| ------------------------- | --------------------------------- |
| `URL_LIFECYCLE_API_TOKEN` | CMSの301／410ルール取得用トークン |
| `DEPLOY_HOST`             | SSH接続先ホスト                   |
| `DEPLOY_USER`             | デプロイ専用SSHユーザー           |
| `DEPLOY_PATH`             | 本番公開ディレクトリの絶対パス    |
| `DEPLOY_PORT`             | SSHポート。未設定時は22           |
| `DEPLOY_SSH_PRIVATE_KEY`  | デプロイ専用秘密鍵                |
| `DEPLOY_SSH_KNOWN_HOSTS`  | 確認済みサーバー公開鍵            |

デプロイ専用ユーザーには、本番公開ディレクトリ以外へ書き込めない権限を設定してください。

## デプロイ先マーカー

パス指定ミスによる別ディレクトリの削除を防ぐため、本番公開ディレクトリにマーカーファイルが必要です。

```bash
printf 'oyakonojikanlabo.jp\n' > /本番公開ディレクトリ/.ojl-deploy-root
```

自動デプロイは同期前後に次を確認し、1つでも満たさない場合は停止します。

- `.ojl-deploy-root`の内容が`oyakonojikanlabo.jp`
- 同じ公開ディレクトリに`lp/`が存在
- デプロイ先が`/`ではない安全な絶対パス

マーカーファイル自体は同期・削除対象外です。

## 最初の適用手順

初回マージがそのまま実デプロイにならないよう、次の順序で有効化します。

1. Actions Variable `PRODUCTION_DEPLOY_ENABLED=false`を設定
2. `production` EnvironmentとSecretsを設定
3. 本番公開ディレクトリへ`.ojl-deploy-root`を設置
4. PRを`main`へマージ（自動デプロイはまだ停止状態）
5. Actions画面から`dry_run=true`で手動実行
6. `/lp/`が削除・更新対象に出ていないことをログで確認
7. `PRODUCTION_DEPLOY_ENABLED=true`へ変更
8. Actions画面から通常の手動実行を行い、初回本番同期を確認
9. CMS側MUプラグインとGitHubトークンを本番WordPressへ反映
10. 公開記事を更新し、Webhook起点のWorkflowを確認

最初の同期内容だけを確認するときは、Actions画面から手動実行し、`dry_run`を有効にします。dry-runでもSSH接続、マーカー、`/lp/`の存在は確認しますが、サーバー上のファイルは変更しません。

## 日常の運用

| 更新内容                | 実行方法                         |
| ----------------------- | -------------------------------- |
| WordPress記事・イベント | 保存後に自動実行                 |
| React、CSS、静的ページ  | PRを`main`へマージすると自動実行 |
| 店舗・Shopifyデータ     | Actions画面から手動実行          |
| ビルドの再実行          | Actions画面から手動実行          |
| `/lp/`                  | 従来の別管理方法で更新           |

## フェーズ1.5で未対応のもの

次はフェーズ2で検討します。

- WordPress更新の数分単位での集約
- 失敗時のSlack・メール通知
- リリース単位の切り替えと自動ロールバック
- 定期的な全体再生成
- 店舗データ・Shopify更新Webhook
- 記事単位の差分ビルド
