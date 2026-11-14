# リニューアル前のコード照合・検証（2026-11-14）

前半は引き継ぎ時の記録。最新の統合・再検証結果は後半の「引き継ぎ後の統合と再検証」を参照。

## 引き継ぎ時の状態

作業ツリーに、保存済みの `origin/main` の変更を取り込み、ローカル独自の変更を保持した。Gitのマージ・コミットは未実施。`git status` に表示される差分には、すでにmainにある変更も含まれるため、その全体をローカル独自変更とは扱わない。

- 現在のブランチ: `fix/preserve-xserver-htaccess`
- HEAD: `dc3688ef`
- 比較対象: ローカル保存済み `origin/main` の `201cf452`
- HEAD以降のmain側変更: 連載機能、ホーム・イベント画像の改善、ホーム読み込み改善、CIランナー更新など。
- 統合前の退避: `backups/reconcile-20261114/before/`
- 三者比較の記録: `backups/reconcile-20261114/results.json`
- `candidate/` は比較用の中間結果。競合マーカーを含むファイルがあるため、一括で作業ツリーにコピーしない。

この実行環境では `.git` が読み取り専用で、fetchは `FETCH_HEAD: Operation not permitted` で停止した。したがって、GitHub上の最新mainとの一致は未確認。本番へのpush・デプロイは行っていない。

## 保持したローカル差分

比較対象が追跡するファイルのうち、実ファイルをバイト単位で照合して差が残ったのは以下の11ファイル。ほかに、Shopify連携・LP検証などのローカル追加ファイルも保持した。

```text
.github/workflows/production-deploy.yml
.htaccess
SPA_DEPLOYMENT_GUIDE.md
deploy/rsync-excludes.txt
docs/PHASE_1_5_AUTO_DEPLOY.md
package.json
public/lp/sunsunkidsvillage/js/password-lock.js
scripts/deploy-production.mjs
scripts/deploy-production.test.mjs
scripts/validate-production-build.mjs
vite.config.ts
```

Shopify関連記事同期、oyako-brands静的ディレクトリの保護、既存LPの変更を保持。旧WordPressコピーは今回の統合対象外。

## 検証結果

| 検証 | 結果 |
| --- | --- |
| Vitest | 18ファイル・80テスト成功 |
| Nodeテスト（デプロイ・Shopify・連載） | 31成功、1件はローカルサーバー起動の `listen EPERM` により実行不可 |
| Viteビルド | 成功。出力先は `/tmp/ojl-reconciled-build` |
| アプリのTypeScript検査 | 18エラー。比較対象mainを別ディレクトリに展開して同じ依存関係で検査し、パスを除く診断内容が完全一致 |
| `git diff --check` | 成功 |
| ソース・スクリプト内の競合マーカー | 検出なし |

Vitest・Vite・Nodeテストには、既存のIntel版Node `/usr/local/bin/node`（v23.9.0）を使用した。通常のNodeはApple Silicon版v24.22.2だが、現在のnode_modulesにはIntel版Rollupしかなく、通常の `npm test` は起動できない。パッケージ取得もnpmレジストリの名前解決エラーで実施できなかった。Intel版での検証は一時的な切り分けであり、標準環境として推奨するものではない。

Viteを直接実行したビルドであり、WordPressからの取得・記事キャッシュ生成を含む `build:prod` 全体の成功を意味しない。Node v24の連載テストではネイティブassertionで異常終了し、Intel版ではローカル待受の権限エラーが確認できた。

既存の型エラーは今回の統合で増えていないため変更していない。なお、CIの `npx tsc --noEmit` は参照だけを持つルートtsconfigに対する実行で、アプリの型検査を十分に行えていない。型エラー解消と検査コマンドの変更は別作業で扱う。

## 残作業と再開条件

1. Gitに書き込める環境で、作業ツリー・未追跡ファイルを保全したうえでfetchし、最新mainとの差分を再確認する。
2. リニューアル用ブランチの基点を最新mainに置き、今回保持したローカル変更を取り込む。現在の古いHEADに対する差分をそのまま独自変更として扱わない。退避データや秘密情報を一括コミットしない。
3. CIに合わせたNode 22環境で、ロックファイルに基づき依存関係を再導入する。ARM環境ではARM用の任意依存パッケージが導入されることを確認する。
4. `npm test` を再実行し、ローカルサーバーを使用する連載テストも通す。必要な環境設定と通信が利用できる環境で本番ビルド・検証も行う。
5. Git履歴を整理し、リニューアルの基点を記録する。mainへのpushは本番自動デプロイを起動するため、この整理作業の一環として自動実行しない。

設計・デザインの整理は並行して進められる。Astroへの実装移行は、この基点を確定してから始めると既存修正の取りこぼしを防げる。


## 引き継ぎ後の統合と再検証（2026-11-14）

### 統合の基点と保全

`git fetch origin main` が成功し、最新mainは `201cf452f950618e0f5ba6b4dc80933b35348fa1` だった。引き継ぎ時の比較対象から追加の更新はなかった。

元の作業ツリーはそのまま保持した。追跡対象と未追跡の453ファイルをリポジトリ外の非公開ローカル領域に退避し、SHA-256を照合した。退避先は `/Users/ns/.codex/tmp/ojl-reconciliation-20261114-182329/`。Gitの状態、差分、参照、無視対象の一覧も保存した。無視対象の旧WordPress、依存関係、生成物、環境設定は元の場所に残した。退避物・環境設定・生成物はコミットしない。

最新mainを基点に、次の作業場所を作成した。

- ブランチ: `chore/reconcile-before-renewal-20261114`
- worktree: `/Users/ns/projects/app/project-oyakonojikanlabo-reconcile-20261114`

mainと比較して残った11ファイルの変更と36ファイルの追加を取り込んだ。連載機能、ホーム・イベントの画像改善、ホーム読み込み改善はmainと同じ内容であり、独自変更として再適用していない。

### 保持した内容と今回の補正

- `/oyako-brands/` のリライト・同期保護、検査、運用資料、手動配置用HTMLを保持した。このHTMLは自動デプロイの対象ではない。
- Shopify関連記事の同期CLI、定義、テスト、ワークフロー、導入資料を保持した。自動同期は既存の `SHOPIFY_ARTICLES_ENABLED == 'true'` の条件に従う。CMS・Shopifyの設定やデータは変更していない。
- SUNSUN KIDS VILLAGEのテストHTML、Shopify表示用スクリプト、告知、ブラウザ検証スクリプトを保持した。既存LPへの簡易ロックはHTML側で明示した場合だけ有効にする変更を保持した。`/lp/` は自動デプロイ対象外。
- 連載の調査・反映記録を履歴資料として保持した。各資料の過去の検証結果を、今回の本番検証結果として扱わない。
- Shopify用ワークフローの `runs-on` を本番ワークフローと同じ `ubuntu-24.04` に補正した。Playwright導入時の既知のUbuntu互換性問題を避けるためで、依存パッケージは更新していない。

Astroへの移行実装は行っていない。

### Node 22での検証結果

Node.js `v22.23.5`・`darwin-arm64` を使用した。Node配布物のSHA-256を公式配布の一覧と照合し、`npm ci` を実行した。ARM用RollupとChromiumの存在を確認した。依存関係の定義と `package-lock.json` はmainから変更していない。

| 検証 | 結果 |
| --- | --- |
| `npm ci` | 成功。461パッケージを導入 |
| `npm test` | Vitest 18ファイル・80件、Nodeテスト32件が全件成功。待受を使う連載テストも成功 |
| CIと同じ `npx tsc --noEmit` | 成功。ただしルートtsconfigの参照先を十分に検査しない既存の制約あり |
| `npx tsc -p tsconfig.app.json --noEmit` | 18エラー。最新mainを別ディレクトリに展開し、同じ依存関係で検査してパス以外の診断が完全一致 |
| `URL_LIFECYCLE_REQUIRED=true npm run build:prod` | Vite成功。公開CMSから193記事・1連載を取得し、193記事のHTML/JSONと219 URLのサイトマップを生成。最後の認証付きルール取得でHTTP 401となり失敗 |
| `npm run validate:prod` | ルール取得失敗で `.htaccess` が生成されていないため失敗。本番成果物全体の成功は未確認 |
| LP告知のブラウザ検証 | 成功。PC・スマートフォン、キーボード操作、24時間制御、表示抑止、画像・保存失敗を確認。Shopifyの購入スクリプトは遮断 |
| テストLP内のローカル参照 | 欠落なし |
| actionlint | 2つのワークフローが成功。shellcheckは未実施 |
| 差分・競合マーカー | ソース内に競合マーカーなし。差分検査は保存用パッチを除いて成功 |

保存用の2つの `.patch` には、unified diffの空行を表す半角空白のコンテキスト行がある。通常の `git diff --cached --check` はこれを末尾空白として指摘するため、パッチを除外して検査した。パッチとmanifestのハッシュは元の内容を保持した。

ビルド時はローカルのプレビュー認証情報を空の環境変数で上書きした。秘密情報はコミット対象に含めていない。ShopifyのテストページにあるStorefront用のブラウザ公開トークンは、管理APIの秘密トークンとは用途が異なる。

### 未解決事項と公開前の確認

1. `URL_LIFECYCLE_API_TOKEN` を安全に注入できる環境で、厳格な本番ビルドと成果物検査を完了する。今回の環境にはトークンがなく、401を迂回して成功扱いにはしていない。
2. 既存のアプリ型エラー18件と、`npm ci` が報告した脆弱性31件（critical 2、high 15、moderate 11、low 3）が残る。今回の統合で依存更新や別機能の型修正は行っていない。
3. Shopifyの実ストア受け入れ、外部CMS・テーマとの連携、手動配置HTML、LPの本番反映は未実施。リポジトリ変数の参照APIが403のため、`SHOPIFY_ARTICLES_ENABLED` の現在値も未確認。マージ前に同期の実行可否を確認する。

本番ワークフローはmainへのpush等で動き、PR作成では本番デプロイを起動しない。マージ、デプロイ、Actionsの手動起動、自動同期の有効化は実行せず、ユーザーの確認を待つ。
