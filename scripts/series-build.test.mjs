import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import {
  normalizeSeries,
  attachSeriesNavigation,
  injectIntoIndex,
} from './generate-post-cache.mjs';

const post = (id, number) => ({
  databaseId: id,
  slug: `episode-${id}`,
  title: `記事${id}`,
  content: '<p>記事本文と商品リンク</p>',
  date: '2026-01-01T00:00:00',
  seriesNavigation: { episodeNumber: number, series: { databaseId: 10 } },
});
const series = (episodes) => ({
  databaseId: 10,
  slug: 'example',
  title: '連載タイトル',
  content: '<p>紹介文</p>',
  date: '2026-01-01T00:00:00',
  seriesStatus: 'ongoing',
  totalEpisodes: 3,
  publishedCount: episodes.length,
  showInFeatured: true,
  episodes: episodes.map(([id, number]) => ({
    databaseId: id,
    episodeNumber: number,
    title: `記事${id}`,
    path: `/episode-${id}`,
    publishedAt: '2026-01-01T00:00:00Z',
  })),
  upcomingEpisodes: [
    {
      episodeNumber: 2,
      scheduledAt: '2026-12-01T00:00:00Z',
      title: '漏れてはいけない正式タイトル',
      path: '/secret',
    },
  ],
});

test('公開記事を回番号順にそろえ、予告から正式タイトル・URLを除く', () => {
  const result = normalizeSeries(
    [
      series([
        [3, 3],
        [1, 1],
        [2, 2],
      ]),
    ],
    [post(1, 1), post(3, 3)],
  );
  assert.deepEqual(
    result[0].episodes.map((episode) => episode.episodeNumber),
    [1, 3],
  );
  assert.equal(result[0].publishedCount, 2);
  assert(!JSON.stringify(result).includes('/secret'));
  assert(!JSON.stringify(result).includes('漏れてはいけない'));
  const navigation = attachSeriesNavigation([post(1, 1), post(3, 3)], result);
  assert.equal(navigation[0].seriesNavigation.next, null);
});

test('公開・非公開化を全件再生成へ反映し、過去記事の前後リンクも更新する', () => {
  const posts = [post(1, 1), post(2, 2)];
  const published = normalizeSeries(
    [
      series([
        [1, 1],
        [2, 2],
      ]),
    ],
    posts,
  );
  assert.equal(attachSeriesNavigation(posts, published)[0].seriesNavigation.next.databaseId, 2);
  const hidden = normalizeSeries([series([[1, 1]])], [posts[0]]);
  assert.equal(attachSeriesNavigation([posts[0]], hidden)[0].seriesNavigation.next, null);
  assert.equal(attachSeriesNavigation(posts, [])[0].seriesNavigation, null);
  assert.equal(normalizeSeries([{ ...series([]), seriesStatus: null }], posts).length, 0);
});

test('総回数未定・空の公開連載・日本語slugに対応し、HTMLとJSONにSEOを含める', () => {
  const [item] = normalizeSeries(
    [{ ...series([]), slug: '%E8%A6%AA%E5%AD%90', totalEpisodes: null }],
    [],
  );
  const index =
    '<html><head><title>既定</title></head>\n  <div id="root">元</div>\n  <script>\n    if (window.performance) {}\n</script></html>';
  const html = injectIntoIndex(index, item, { schemaVersion: 1, series: item }, true);
  assert(html.includes('/series/%E8%A6%AA%E5%AD%90'));
  assert(html.includes('CreativeWorkSeries'));
  assert(html.includes('記事の公開を準備しています'));
  assert(!html.includes('全null回'));
  assert.equal(normalizeSeries([{ ...series([]), slug: '%2Fsecret' }], []).length, 0);
});

const run = (script, directory, endpoint) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      env: {
        ...process.env,
        BUILD_OUT_DIR: directory,
        WP_GRAPHQL_ENDPOINT: endpoint,
        SITEMAP_FORCE: 'true',
      },
    });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(output))));
  });

test('ビルドを繰り返すと非公開化した連載の古いHTML・JSON・サイトマップを削除する', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ojl-series-build-'));
  let rows = [
    series([
      [1, 1],
      [2, 2],
    ]),
  ];
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    const { query } = JSON.parse(body);
    const key = query.includes('CachedSeries')
      ? 'ojlSeriesCollection'
      : query.includes('AllEvents')
        ? 'events'
        : 'posts';
    const nodes =
      key === 'ojlSeriesCollection' ? rows : key === 'events' ? [] : [post(1, 1), post(2, 2)];
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ data: { [key]: { nodes, pageInfo: { hasNextPage: false } } } }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const endpoint = `http://127.0.0.1:${server.address().port}/graphql`;
  try {
    // 連載キャッシュを先に作らない従来の単独コマンドも維持します。
    await run('scripts/generate-sitemap.mjs', directory, endpoint);
    assert((await readFile(path.join(directory, 'sitemap.xml'), 'utf8')).includes('/episode-1'));
    await writeFile(
      path.join(directory, 'index.html'),
      '<html><head><title>既定</title></head>\n  <div id="root">元</div>\n  <script>\n    if (window.performance) {}\n</script></html>',
    );
    await run('scripts/generate-post-cache.mjs', directory, endpoint);
    const first = JSON.parse(
      await readFile(path.join(directory, 'post-cache/episode-1.json'), 'utf8'),
    );
    assert.equal(first.post.seriesNavigation.next.databaseId, 2);
    await run('scripts/generate-sitemap.mjs', directory, endpoint);
    assert(
      (await readFile(path.join(directory, 'sitemap.xml'), 'utf8')).includes('/series/example'),
    );
    rows = [];
    await run('scripts/generate-post-cache.mjs', directory, endpoint);
    await run('scripts/generate-sitemap.mjs', directory, endpoint);
    assert.deepEqual(await readdir(path.join(directory, 'series-pages')), []);
    assert.deepEqual(await readdir(path.join(directory, 'series-cache')), []);
    assert(
      !(await readFile(path.join(directory, 'sitemap.xml'), 'utf8')).includes('/series/example'),
    );
    assert.equal(
      JSON.parse(await readFile(path.join(directory, 'post-cache/episode-1.json'), 'utf8')).post
        .seriesNavigation,
      null,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
