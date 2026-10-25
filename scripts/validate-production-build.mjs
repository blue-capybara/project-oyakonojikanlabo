import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const outDir = path.resolve(process.cwd(), process.env.BUILD_OUT_DIR ?? 'dist/prod');
const postPageDir = path.join(outDir, 'post-pages');
const postCacheDir = path.join(outDir, 'post-cache');

const listFiles = async (directory, extension) =>
  (await readdir(directory))
    .filter((name) => name.endsWith(extension))
    .sort((a, b) => a.localeCompare(b));

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const validateRootFiles = async () => {
  const requiredFiles = ['index.html', '.htaccess', 'sitemap.xml', '410.html'];
  await Promise.all(requiredFiles.map((name) => access(path.join(outDir, name))));

  const htaccess = await readFile(path.join(outDir, '.htaccess'), 'utf8');
  assert(htaccess.includes('# BEGIN OJL FRONTEND'), '.htaccessにOJL管理開始マーカーがありません');
  assert(htaccess.includes('# END OJL FRONTEND'), '.htaccessにOJL管理終了マーカーがありません');
  assert(
    htaccess.includes('# BEGIN OJL URL LIFECYCLE'),
    '.htaccessにURLライフサイクルがありません',
  );
  assert(!htaccess.includes('# (no lifecycle rules)'), '.htaccessの301/410ルールが空です');
  assert(htaccess.includes('RewriteRule ^lp(?:/|$) - [L]'), '.htaccessに/lp/除外がありません');
  assert(
    htaccess.includes('SetEnvIf Request_URI "^/wp-json/ojl/v1/htaccess-rules/?$" AllowRestApi'),
    '.htaccessにXServer向けURLライフサイクルAPI例外がありません',
  );
};

const validateAssetReferences = async () => {
  const indexHtml = await readFile(path.join(outDir, 'index.html'), 'utf8');
  const references = [...indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map(
    (match) => match[1],
  );
  assert(references.length > 0, 'index.htmlにハッシュ付きアセット参照がありません');
  await Promise.all(references.map((reference) => access(path.join(outDir, reference))));
};

const validatePostPairs = async () => {
  const [htmlFiles, jsonFiles] = await Promise.all([
    listFiles(postPageDir, '.html'),
    listFiles(postCacheDir, '.json'),
  ]);

  assert(htmlFiles.length > 0, '記事HTMLが1件も生成されていません');
  assert(htmlFiles.length === jsonFiles.length, '記事HTMLとJSONの件数が一致しません');

  for (const jsonFile of jsonFiles) {
    const slug = jsonFile.slice(0, -'.json'.length);
    const htmlFile = `${slug}.html`;
    assert(htmlFiles.includes(htmlFile), `${slug}の記事HTMLがありません`);

    const [rawJson, html] = await Promise.all([
      readFile(path.join(postCacheDir, jsonFile), 'utf8'),
      readFile(path.join(postPageDir, htmlFile), 'utf8'),
    ]);
    const cache = JSON.parse(rawJson);

    assert(cache.schemaVersion === 1, `${slug}のJSONスキーマが不正です`);
    assert(cache.slug === slug, `${slug}のJSON内slugが一致しません`);
    assert(cache.post?.title, `${slug}のJSONに記事タイトルがありません`);
    assert(cache.post?.content, `${slug}のJSONに記事本文がありません`);
    assert(html.includes('data-prerendered-article="true"'), `${slug}のHTMLに記事本文がありません`);
    assert(/<link\b[^>]*rel="canonical"/.test(html), `${slug}のHTMLにcanonicalがありません`);
    assert(html.includes('id="ojl-post-cache"'), `${slug}のHTMLに埋め込みJSONがありません`);
  }

  console.log(`validate: ${htmlFiles.length}件の記事HTML/JSONを確認しました`);
};

const validateSeriesPairs = async () => {
  const manifest = JSON.parse(await readFile(path.join(outDir, 'series-index.json'), 'utf8'));
  assert(
    manifest.schemaVersion === 1 && Array.isArray(manifest.series),
    '連載一覧JSONの形式が不正です',
  );
  const [htmlFiles, jsonFiles] = await Promise.all([
    listFiles(path.join(outDir, 'series-pages'), '.html'),
    listFiles(path.join(outDir, 'series-cache'), '.json'),
  ]);
  assert(
    htmlFiles.length === manifest.series.length && jsonFiles.length === manifest.series.length,
    '連載HTML・JSON・一覧の件数が一致しません',
  );
  for (const item of manifest.series) {
    const [raw, html] = await Promise.all([
      readFile(path.join(outDir, 'series-cache', `${item.slug}.json`), 'utf8'),
      readFile(path.join(outDir, 'series-pages', `${item.slug}.html`), 'utf8'),
    ]);
    const cache = JSON.parse(raw);
    assert(
      cache.schemaVersion === 1 && cache.series.databaseId === item.databaseId,
      '連載キャッシュの対応が不正です',
    );
    assert(
      cache.series.publishedCount === cache.series.episodes.length,
      '連載の公開回数が一致しません',
    );
    assert(
      html.includes('data-prerendered-series="true"') && html.includes('id="ojl-series-cache"'),
      '連載HTMLの本文・埋め込みJSONがありません',
    );
    assert(
      html.includes('rel="canonical"') && html.includes('CreativeWorkSeries'),
      '連載HTMLにSEOメタがありません',
    );
    assert(
      !raw.includes('previewPath') && !raw.includes('#token='),
      '公開キャッシュにプレビュー情報が含まれています',
    );
  }
  const htaccess = await readFile(path.join(outDir, '.htaccess'), 'utf8');
  assert(
    htaccess.includes('RewriteRule ^series(?:/|$) - [R=404,L]'),
    '連載の不存在・一覧URLの404処理がありません',
  );
  console.log(`validate: ${manifest.series.length}件の連載HTML/JSONを確認しました`);
};

async function main() {
  await Promise.all([validateRootFiles(), validateAssetReferences()]);
  await validatePostPairs();
  await validateSeriesPairs();
  console.log(`validate: 本番成果物の確認が完了しました (${outDir})`);
}

main().catch((error) => {
  console.error('validate: failed', error);
  process.exitCode = 1;
});
