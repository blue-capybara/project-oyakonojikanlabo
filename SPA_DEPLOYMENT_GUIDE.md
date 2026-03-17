# SPA デプロイメントガイド

## 問題の概要

React Routerを使用したSPA（Single Page Application）では、直接URLにアクセスした際に404エラーが発生する問題があります。これは、サーバーが`/post/some-article`のようなパスを認識せず、物理的なファイルとして存在しないためです。

## 解決方法

### 環境別ビルド

`stg` と `prod` でビルド成果物を分ける場合は、以下の npm script を使います。

```bash
npm run build:stg
npm run build:prod
```

- `build:stg`: 出力先は `dist/stg/` です。`.htaccess` のコピーのみ実行します。
- `build:prod`: 出力先は `dist/prod/` です。sitemap 生成と `.htaccess` コピーまで実行します。
- `stg` ビルドでは `import.meta.env.MODE === 'stg'` になるため、既存の `noindex` 判定をそのまま利用できます。
- `npm run build` は互換性のため従来通り `dist/` に出力します。環境別ビルドを並列実行したい場合は `build:stg` と `build:prod` を使ってください。

### 1. 開発環境での解決

Viteの設定で`historyApiFallback`を有効にしました：

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    historyApiFallback: true,
  },
  preview: {
    historyApiFallback: true,
  },
});
```

### 2. 本番環境でのサーバー設定

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

#### Netlify (\_redirects)

```
/*    /index.html   200
```

#### Vercel (vercel.json)

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### GitHub Pages (404.html)

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Single Page Apps for GitHub Pages</title>
    <script type="text/javascript">
      // Single Page Apps for GitHub Pages
      // MIT License
      // https://github.com/rafgraph/spa-github-pages
      // This script takes the current url and converts the path and query
      // string into just a query string, and then redirects the browser
      // to the new url with only a query string and hash fragment,
      // e.g. https://www.foo.tld/one/two?a=b&c=d#qwe, becomes
      // https://www.foo.tld/?/one/two&a=b~and~c=d#qwe
      // Note: this 404.html file must be at least 512 bytes for it to work
      // with Internet Explorer (it is currently > 512 bytes)

      // If you're creating a Project Pages site and NOT using a custom domain,
      // then set pathSegmentsToKeep to 1 (enterprise users may need to set it to > 1).
      // This way the code will only replace the route part of the path, and not
      // the real directory in which the app resides, for example:
      // https://username.github.io/repo-name/one/two?a=b&c=d#qwe becomes
      // https://username.github.io/repo-name/?/one/two&a=b~and~c=d#qwe
      // Otherwise, leave pathSegmentsToKeep as 0.
      var pathSegmentsToKeep = 0;

      var l = window.location;
      l.replace(
        l.protocol +
          '//' +
          l.hostname +
          (l.port ? ':' + l.port : '') +
          l.pathname
            .split('/')
            .slice(0, 1 + pathSegmentsToKeep)
            .join('/') +
          '/?/' +
          l.pathname
            .slice(1)
            .split('/')
            .slice(pathSegmentsToKeep)
            .join('/')
            .replace(/&/g, '~and~') +
          (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
          l.hash,
      );
    </script>
  </head>
  <body></body>
</html>
```

## 実装した改善点

1. **Vite設定の更新**: 開発環境とプレビュー環境でhistoryApiFallbackを有効化
2. **404ページの作成**: 適切なエラーページコンポーネントを作成
3. **ルーティングの改善**: ワイルドカードルート（`*`）を追加して404ページを表示
4. **エラーハンドリングの強化**: PostDetailPageでWordPressからのデータ取得エラーを適切に処理

## テスト方法

1. 開発サーバーを起動: `npm run dev`
2. ブラウザで直接URLにアクセス: `http://localhost:5173/post/non-existent-article`
3. 404ページが表示されることを確認
4. 存在する記事のURLにアクセスして正常に表示されることを確認

## 注意事項

- 本番環境では必ずサーバー設定でSPAフォールバックを有効にしてください
- SEO対策が必要な場合は、SSR（Server-Side Rendering）の導入を検討してください
- パフォーマンス向上のため、適切なキャッシュ設定も併せて実装することを推奨します
