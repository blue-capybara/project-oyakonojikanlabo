# Site Content Types (Event / Space / Artist)
- CPT: `event`（イベント/スクール共通）
- CPT: `space`（会場）
- CPT: `artist`（講師/作家）
- Tax: `event_category`, `event_region`
- Admin: イベント/スクールのショートカット、新規追加の初期値、一覧カラム（種別/バッジ）

GraphQL/REST 対応（WPGraphQL 必須）。

## インストール
1. ZIPをプラグインとしてアップロードして有効化
2. ACF & WPGraphQL を有効化
3. ACF > フィールドグループ一覧で Local JSON の「同期可能」が出たら同期。出ない場合はACFのツールからjsonをインポート

## メモ
- 導入後、設定 > パーマリンク で「変更を保存」を一度押してリライトルールを再生成してください。
