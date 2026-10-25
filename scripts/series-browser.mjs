// Apacheで配信した一時成果物と、隔離WordPressだけを使用する操作テストです。
import assert from 'node:assert/strict';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-chromium';

const root = process.env.OJL_SERIES_TEST_ROOT;
const out = process.env.BUILD_OUT_DIR;
if (
  !root ||
  !out ||
  (await readFile(path.join(root, '.ojl-series-test'), 'utf8')).trim() !== 'isolated-series-test'
) {
  throw new Error('隔離WordPressと一時ビルド先を指定してください。');
}
const fixture = JSON.parse(await readFile(path.join(root, '.series-phase2-fixture.json'), 'utf8'));
const origin = 'http://127.0.0.1:8791';
const index = JSON.parse(await readFile(path.join(out, 'series-index.json'), 'utf8'));
const series = index.series.find((item) => item.databaseId === fixture.series);
assert(series, '隔離環境とビルド成果物の連載が一致しません。');
const posts = await Promise.all(
  (await readdir(path.join(out, 'post-cache'))).map(async (file) => {
    const value = JSON.parse(await readFile(path.join(out, 'post-cache', file), 'utf8'));
    return {
      ...value.post,
      slug: value.slug,
      id: String(value.post.databaseId),
      __typename: 'Post',
    };
  }),
);
const first = posts.find((post) => post.databaseId === fixture.first);
const features = [1, 2, 3, 4, 5].map((number) => ({
  __typename: 'Feature',
  id: `fixture-feature-${number}`,
  featureSettings: { relatedPost: { nodes: [{ ...first, title: `特集スライド${number}` }] } },
}));

const browser = await chromium.launch({ headless: true });
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' && ['8791', '8789'].includes(url.port))
        return route.continue();
      if (url.hostname === 'cms.oyakonojikanlabo.jp' && url.pathname === '/graphql') {
        return route.fulfill({
          json: {
            data: { features: { nodes: features }, posts: { nodes: posts }, events: { nodes: [] } },
          },
        });
      }
      if (url.pathname.endsWith('.css'))
        return route.fulfill({ contentType: 'text/css', body: '' });
      if (url.pathname.includes('/wp-json/')) return route.fulfill({ json: { items: [] } });
      return route.abort();
    });
    const noOverflow = async () =>
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        `${width}pxで横スクロールが発生しています。`,
      );
    const response = await page.goto(`${origin}/series/${encodeURIComponent(series.slug)}`);
    assert.equal(response.status(), 200);
    await page.getByRole('heading', { level: 1, name: series.title }).waitFor();
    assert.equal(
      await page.getByRole('link', { name: /第1回から読む/ }).getAttribute('href'),
      `/${first.slug}`,
    );
    assert.equal(await page.locator('link[rel="canonical"]').count(), 1);
    assert.equal(
      await page.locator('link[rel="canonical"]').getAttribute('href'),
      `https://oyakonojikanlabo.jp/series/${encodeURIComponent(series.slug)}`,
    );
    assert.match(await page.locator('main').innerText(), /1回公開/);
    assert(
      !(await page
        .locator('body')
        .innerText()
        .then((text) => text.includes('未公開正式タイトル秘密'))),
    );
    assert((await page.locator('img').count()) > 0);
    await noOverflow();
    await mkdir('/private/tmp/ojl-series-phase2-screenshots', { recursive: true });
    await page.screenshot({
      path: `/private/tmp/ojl-series-phase2-screenshots/series-${width}.png`,
      fullPage: true,
    });
    await page.getByRole('link', { name: /第1回から読む/ }).click();
    await page.getByRole('navigation', { name: 'この記事の連載' }).waitFor();
    assert.equal(await page.getByRole('navigation', { name: '連載の前後の記事' }).count(), 1);
    assert.equal(await page.getByRole('link', { name: /次の回/ }).count(), 0);
    await page.getByRole('button', { name: /シェアする/ }).waitFor({ state: 'visible' });
    assert(
      (await page.getByRole('link', { name: '商品を見る' }).getAttribute('href')).includes(
        '/products/example',
      ),
    );
    await noOverflow();
    await page.screenshot({
      path: `/private/tmp/ojl-series-phase2-screenshots/article-${width}.png`,
      fullPage: true,
    });
    await page.goto(`${origin}/${fixture.normalSlug}`);
    await page.getByRole('heading', { level: 1, name: '通常の記事' }).waitFor();
    assert.equal(await page.getByRole('navigation', { name: 'この記事の連載' }).count(), 0);

    await page.goto(origin);
    const featured = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: '注目の特集', exact: true }) });
    await featured.getByRole('link', { name: new RegExp(series.title) }).waitFor();
    assert.equal(await featured.getByRole('link').count(), 4);
    const hero = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: /^特集スライド[1-5]$/ }) })
      .first();
    assert.equal(await hero.locator(`a[href^="/series/"]`).count(), 0);
    const articles = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: '記事一覧', exact: true }) });
    assert.equal(await articles.locator('a[href^="/series/"]').count(), 0);
    await noOverflow();
    await page.screenshot({
      path: `/private/tmp/ojl-series-phase2-screenshots/home-${width}.png`,
      fullPage: true,
    });

    for (const suffix of ['/series', '/series/does-not-exist', `/series/${fixture.draftSlug}`]) {
      assert.equal((await page.goto(origin + suffix)).status(), 404, `${suffix}のHTTPステータス`);
      await page.getByRole('heading', { level: 1, name: '404', exact: true }).waitFor();
    }

    assert.equal(
      (await page.request.get(`${origin}/series-cache/does-not-exist.json`)).status(),
      404,
    );
    const previewResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/wp-json/ojl/v1/series-preview') &&
        response.request().method() === 'POST',
    );
    await page.goto(
      `${origin}/preview?p=${fixture.draft}&series_preview=1#token=${encodeURIComponent(fixture.previewToken)}`,
    );
    await page.getByRole('heading', { level: 1, name: '非公開の連載タイトル秘密' }).waitFor();
    assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
    assert.equal(await page.locator('link[rel="canonical"]').count(), 0);
    assert.equal(await page.getByRole('link', { name: /下書きの記事タイトル秘密/ }).count(), 1);
    assert.match((await previewResponse).headers()['cache-control'], /no-store/);
    await noOverflow();
    await page.goto(
      `${origin}/preview?p=${fixture.draftArticle}&series_preview=1#token=${encodeURIComponent(fixture.previewPostToken)}`,
    );
    await page.getByRole('heading', { level: 1, name: '下書きの記事タイトル秘密' }).waitFor();
    const parentLink = page.getByRole('navigation', { name: 'この記事の連載' }).getByRole('link');
    assert((await parentLink.getAttribute('href')).includes('series_preview=1#token='));
    await noOverflow();
    await page.goto(`${origin}/preview?p=${fixture.draft}&series_preview=1#token=invalid`);
    await page.getByText(/プレビューの期限が切れたか/).waitFor();
    assert.equal(await page.getByRole('heading', { name: '非公開の連載タイトル秘密' }).count(), 0);
    console.log(`成功: ${width}pxで連載・記事・特集・通常記事・404・署名プレビューを検証`);
    await page.close();
  }
} finally {
  await browser.close();
}
