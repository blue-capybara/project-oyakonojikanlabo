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
  assert(
    htaccess.includes('# BEGIN OJL URL LIFECYCLE'),
    '.htaccessにURLライフサイクルがありません',
  );
  assert(!htaccess.includes('# (no lifecycle rules)'), '.htaccessの301/410ルールが空です');
  assert(htaccess.includes('RewriteRule ^lp(?:/|$) - [L]'), '.htaccessに/lp/除外がありません');
  assert(
    htaccess.includes(
      'SetEnvIf Request_URI "^/wp-json/ojl/v1/htaccess-rules/?$" AllowWPLoginFromCloudJP',
    ),
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
    assert(html.includes('<link rel="canonical"'), `${slug}のHTMLにcanonicalがありません`);
    assert(html.includes('id="ojl-post-cache"'), `${slug}のHTMLに埋め込みJSONがありません`);
  }

  console.log(`validate: ${htmlFiles.length}件の記事HTML/JSONを確認しました`);
};

async function main() {
  await Promise.all([validateRootFiles(), validateAssetReferences()]);
  await validatePostPairs();
  console.log(`validate: 本番成果物の確認が完了しました (${outDir})`);
}

main().catch((error) => {
  console.error('validate: failed', error);
  process.exitCode = 1;
});
