# 親子の時間研究所 (oyakonojikanlabo)

子育て世代向けの情報メディアサイト。WordPress をヘッドレス CMS として利用し、Supabase で会員機能を提供する SPA。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| ビルド | Vite 5 |
| フレームワーク | React 18 + React Router v7 |
| 言語 | TypeScript (strict モード) |
| スタイリング | Tailwind CSS 3 + @tailwindcss/typography |
| CMS | WordPress GraphQL (`https://cms.oyakonojikanlabo.jp/graphql`) |
| 認証・DB | Supabase (PostgreSQL) |
| データ取得 | Apollo Client, graphql-request |
| アナリティクス | GA4 + GA4-B (Shopify クロスドメイン) |
| テスト | Playwright Chromium |
| フォント | LINESeedJP (WOFF2) |
| アイコン | Remixicon (`ri-*`), Lucide React |

## ディレクトリ構成

```
src/
├── pages/          # ページコンポーネント（lazy import で遅延読込）
├── components/     # 共通・機能別コンポーネント
│   ├── Layout/     #   Header, Footer, Layout
│   ├── HomePage/   #   トップページ各セクション
│   ├── Post/       #   WordPress 記事表示 (Shadow DOM)
│   ├── mypage/     #   マイページ関連
│   ├── seo/        #   Seo コンポーネント (react-helmet)
│   └── ContactForm/
├── hooks/          # カスタムフック (useFavorite, useSwipe 等)
├── lib/            # API クライアント・ユーティリティ
├── utils/          # 汎用ヘルパー (paths, seo)
├── config/         # Feature Flags
├── routes/         # 静的 WordPress ルート定義
├── data/           # 静的データ (collaborations)
└── analytics/      # GA4-B 関連
```

## 開発コマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # 本番ビルド（postbuild で sitemap 生成）
npm run lint       # ESLint 実行
npm run preview    # ビルド結果のプレビュー
npm run sitemap    # サイトマップ XML 生成
```

## コード規約

### コンポーネント
- **命名**: PascalCase（例: `FeatureSection`, `PostDetailPage`）
- **型定義**: `React.FC<Props>` パターンで props を型付け
- **関数コンポーネント**: クラスコンポーネントは使わない
- **エクスポート**: ページ・コンポーネントは default export、ユーティリティ・フックは named export
- **最適化**: パフォーマンスが必要な箇所で `memo()` を使用

### TypeScript
- strict モードが有効（`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`）
- 型は interface で定義し、必要に応じてコンポーネントファイル内に記述

### スタイリング
- Tailwind CSS ユーティリティファースト（CSS モジュールは使わない）
- テーマカラー: primary `#8CB9DD`, secondary `#B1D7EF`, accent `#579BB1`
- レスポンシブ: `md:`, `lg:` プレフィックスで対応

### インポート順序
```typescript
// 1. React / ライブラリ
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// 2. サードパーティ
import { request, gql } from 'graphql-request';

// 3. プロジェクト内（相対パス）
import { getFeatureFlag } from '../../config/featureFlags';
import Seo from '../components/seo/Seo';
```

### カスタムフック
- `use` プレフィックスで命名（例: `useFavorite`, `useHeaderHeight`）
- `src/hooks/` に配置

## 環境変数

`.env.example` を `.env` にコピーして使用。`.env` ファイルは git にコミットしない。

| 変数名 | 用途 |
|--------|------|
| `VITE_FEATURE_SHOW_COLLAB_SIGNUP` | コラボバナー CTA 表示 |
| `VITE_FEATURE_SHOW_PICO_SERVICES` | PICO ページメニュー・ショッピングセクション |
| `VITE_FEATURE_SHOW_MEMBERSHIP` | 認証ページ・お気に入り・マイページ・ログインアイコン |
| `VITE_GA_MEASUREMENT_ID` | GA4 本番用（ステージ・ローカルは空にする） |
| `VITE_GA4_B_ID` | GA4-B Shopify クロスドメイン用 |
| `VITE_WP_PREVIEW_API_BASE` | WordPress プレビュー API ベース URL |
| `VITE_WP_PREVIEW_AUTH_USER` | プレビュー認証ユーザー名 |
| `VITE_WP_PREVIEW_AUTH_PASSWORD` | プレビュー認証パスワード |

Feature Flags は `src/config/featureFlags.ts` で管理。詳細は `FEATURE_FLAGS.md` を参照。

## ルーティング

- `App.tsx` で React Router v7 による SPA ルーティング
- ページコンポーネントは `lazy()` で遅延読込
- WordPress 記事は `/:slug`（プレフィックスなし）で最後にマッチ
- イベントは `/event/:slug`
- `/lp/*` は Vite ミドルウェアで静的 HTML を配信（SPA 外）
- `STATIC_WP_ROUTES` (`src/routes/staticWpRoutes.ts`) で静的 WordPress ページを管理

## 重要な注意点

### Shadow DOM
`src/components/Post/WordPressContent.tsx` では WordPress のスタイルをアプリから隔離するために Shadow DOM を使用している。WordPress コンテンツのスタイル変更時は Shadow DOM 内のスタイル注入を確認すること。

### ステージング環境
`VITE_APP_ENV` または Vite の `MODE` でステージング判定し、`noindex` メタタグを強制付与。本番以外のデプロイでインデックスされないよう注意。

### 検索履歴
`src/lib/searchHistory.ts` で IndexedDB にクライアントサイドで検索履歴を保存。

### Supabase 認証
`onAuthStateChange` でセッション管理。`isAuthSessionMissingError()` でセッション切れを検出。

## Git 規約

### コミットメッセージ
日本語で記述。プレフィックス付き:
```
feat: 新機能の説明
fix: バグ修正の説明
chore: 設定変更等の説明
refactor: リファクタリングの説明
docs: ドキュメント変更の説明
test: テスト関連の変更
```

### ブランチ命名
```
feat/機能名
fix/修正内容
chore/作業内容
```

## セキュリティ

- `.env` ファイルは絶対にコミットしない（`.gitignore` で除外済み）
- Supabase の URL・キーはクライアントサイドで使用されるが、RLS (Row Level Security) で保護
- WordPress プレビュー認証情報は `.env` で管理
