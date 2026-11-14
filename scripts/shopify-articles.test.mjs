import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, rm, realpath } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  articleValues,
  verifyPublicHtml,
  createClients,
  synchronize,
  check,
  migrate,
  restore,
  objectIndex,
  setup,
  schema,
  normalizeUrl,
} from './shopify-articles.mjs';

const id = 'article_12345678-1234-4234-8234-123456789abc';
const article = {
  id,
  title: '親子の時間',
  excerpt: '本文',
  canonical_url: 'https://example.com/column',
  image: null,
  updated_at: '2026-09-01T00:00:00Z',
};
const config = {
  store: 'example.myshopify.com',
  token: 'テスト専用',
  base: 'https://cms.example.com/wp-json/ojl-content/v1',
  origin: 'https://example.com',
  version: '2026-07',
};
const gid = 'gid://shopify/Metaobject/1';
const product = {
  id: 'gid://shopify/Product/1',
  title: '商品A',
  status: 'ACTIVE',
  legacy: { value: '42', type: 'number_integer' },
  related: null,
};
const object = (data = article, status = 'ACTIVE') => ({
  id: gid,
  type: 'ojl_article',
  handle: data.id.replace('_', '-'),
  capabilities: { publishable: { status } },
  fields: Object.entries(articleValues(data)).map(([key, value]) => ({ key, value })),
});
function fakeClients(overrides = {}) {
  const writes = [];
  return {
    writes,
    objects: async () => [object()],
    object: async () => object(),
    legacyReference: async () => product.legacy,
    articles: async () => [article],
    article: async () => article,
    products: async () => [],
    publicPage: async () => true,
    saveArticle: async (a) => writes.push(['save', a]),
    setStatus: async (...args) => writes.push(args),
    ...overrides,
  };
}
const html = (url = article.canonical_url) =>
  `<link rel="canonical" href="${url}"><main data-prerendered-article="true"><article>本文</article></main><script id="ojl-post-cache" type="application/json">${JSON.stringify({ schemaVersion: 1, slug: 'column', path: '/column', generatedAt: article.updated_at, post: { databaseId: 42, title: article.title, content: '本文' } })}</script>`;
const publicResult = (body = html()) => ({
  status: 200,
  url: article.canonical_url,
  contentType: 'text/html; charset=utf-8',
  html: body,
});
const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

test('URL比較は日本語の%表記を揃え、パスの大小・query・fragmentを混同しない', () => {
  assert.equal(
    normalizeUrl('https://example.com/%e8%a8%98%e4%ba%8b/'),
    normalizeUrl('https://example.com/記事'),
  );
  assert.notEqual(
    normalizeUrl('https://example.com/Article'),
    normalizeUrl('https://example.com/article'),
  );
  assert.throws(() => normalizeUrl('https://example.com/article?preview=1'));
  assert.throws(() => normalizeUrl('https://example.com/article#part'));
});

test('空値の保存確認に失敗したらACTIVEへ進めない', async () => {
  const queries = [];
  const clients = createClients(config, async (_url, options) => {
    const { query } = JSON.parse(options.body);
    queries.push(query);
    if (query.includes('metaobjectUpsert('))
      return jsonResponse({ data: { metaobjectUpsert: { metaobject: object(), userErrors: [] } } });
    return jsonResponse({
      data: {
        metaobject: object({
          ...article,
          image: { url: 'https://example.com/old.jpg', alt: '古い画像' },
        }),
      },
    });
  });
  await assert.rejects(clients.saveArticle(article), /保存結果が一致しません/);
  assert.ok(queries.every((q) => !q.includes('metaobjectUpdate(')));
});

test('商品参照の作成はcompareDigest:nullを送り、競合時に再試行しない', async () => {
  let calls = 0;
  const clients = createClients(config, async (_url, options) => {
    calls++;
    const { variables } = JSON.parse(options.body);
    assert.equal(variables.fields[0].compareDigest, null);
    return jsonResponse({
      data: {
        metafieldsSet: { userErrors: [{ field: ['metafields', '0'], code: 'STALE_OBJECT' }] },
      },
    });
  });
  await assert.rejects(clients.setReference(product.id, gid, null));
  assert.equal(calls, 1);
});

test('公開URLは200・最終URL・canonical・記事HTML・埋め込みパスをすべて検査する', () => {
  assert.equal(verifyPublicHtml(publicResult(), article.canonical_url + '/'), true);
  for (const bad of [
    publicResult('<h1>ページがありません</h1>'),
    publicResult(html('https://example.com/other')),
    publicResult(html().replace('"path":"/column"', '"path":"/other"')),
    { ...publicResult(), status: 404 },
    { ...publicResult(), url: 'https://example.com/other' },
    { ...publicResult(), contentType: 'application/json' },
    publicResult(html() + '<link rel="canonical" href="/column">'),
  ])
    assert.throws(() => verifyPublicHtml(bad, article.canonical_url));
});

test('一般的な404を記事削除として扱わず、定義済みエラーだけを利用不可にする', async () => {
  const unavailable = createClients(config, async () =>
    jsonResponse({ code: 'ARTICLE_UNAVAILABLE', data: { status: 404 } }, 404),
  );
  assert.equal(await unavailable.article(id), null);
  for (const payload of [
    { code: 'rest_no_route', data: { status: 404 } },
    { code: 'ARTICLE_UNAVAILABLE' },
  ]) {
    await assert.rejects(createClients(config, async () => jsonResponse(payload, 404)).article(id));
  }
});

test('一覧は最後のページまで取得し、固定ID重複や途中失敗を正常扱いしない', async () => {
  let calls = 0;
  const clients = createClients(config, async () => {
    calls++;
    return jsonResponse({
      data: calls === 1 ? [article] : [],
      pagination: { page: calls, per_page: 100, total: 101, total_pages: 2 },
    });
  });
  assert.deepEqual(await clients.articles(), [article]);
  assert.equal(calls, 2);
  await assert.rejects(
    createClients(config, async () =>
      jsonResponse({
        data: [article, article],
        pagination: { page: 1, per_page: 100, total: 2, total_pages: 1 },
      }),
    ).articles(),
  );
});

test('空になった任意項目を含む全8項目をvaluesで送り、読み戻してACTIVEにする', async () => {
  const emptyArticle = { ...article, excerpt: '', image: null };
  let saved;
  const mutations = [];
  const clients = createClients(config, async (_url, options) => {
    const { query, variables } = JSON.parse(options.body);
    if (query.includes('metaobjectUpsert(')) {
      mutations.push('upsert');
      assert.deepEqual(
        Object.keys(variables.values).sort(),
        schema.metaobject.fieldDefinitions.map((f) => f.key).sort(),
      );
      for (const key of ['excerpt', 'image_url', 'image_alt'])
        assert.equal(variables.values[key], null);
      assert.equal(variables.metaobject, undefined);
      saved = object(emptyArticle, 'DRAFT');
      saved.fields = Object.entries(variables.values).map(([key, value]) => ({ key, value }));
      return jsonResponse({ data: { metaobjectUpsert: { metaobject: saved, userErrors: [] } } });
    }
    if (query.includes('metaobjectUpdate(')) {
      mutations.push('activate');
      saved.capabilities.publishable.status = 'ACTIVE';
      return jsonResponse({
        data: { metaobjectUpdate: { metaobject: { id: gid }, userErrors: [] } },
      });
    }
    return jsonResponse({ data: { metaobject: saved } });
  });
  assert.equal((await clients.saveArticle(emptyArticle)).id, gid);
  assert.deepEqual(mutations, ['upsert', 'activate']);
});

test('一覧失敗でも個別に確定できた公開終了だけDRAFTにする', async () => {
  const clients = fakeClients({
    articles: async () => {
      throw new Error('一覧失敗');
    },
    article: async () => null,
  });
  const result = await synchronize(clients, { apply: true });
  assert.deepEqual(clients.writes, [[gid, 'DRAFT']]);
  assert.equal(result[0].level, 2);
  clients.writes.length = 0;
  clients.article = async () => {
    throw new Error('認証失敗');
  };
  await synchronize(clients, { apply: true });
  assert.equal(clients.writes.length, 0);
});

test('slug変更と再公開は同じ固定IDで同期し、dry-runでは書き込まない', async () => {
  const changed = { ...article, title: '新タイトル', canonical_url: 'https://example.com/new' };
  const clients = fakeClients({ article: async () => changed, articles: async () => [changed] });
  await synchronize(clients);
  assert.equal(clients.writes.length, 0);
  await synchronize(clients, { apply: true });
  assert.equal(clients.writes[0][1].id, id);
  clients.writes.length = 0;
  clients.objects = async () => [object(changed, 'DRAFT')];
  await synchronize(clients, { apply: true });
  assert.equal(clients.writes.length, 1);
});

test('公開ページ不一致では更新せず、deactivateでは公開記事を更新しない', async () => {
  const clients = fakeClients({
    objects: async () => [object(article, 'DRAFT')],
    publicPage: async () => {
      throw new Error('Soft 404');
    },
  });
  assert.equal((await synchronize(clients, { apply: true }))[0].level, 2);
  await synchronize(clients, { apply: true, deactivateOnly: true });
  assert.equal(clients.writes.length, 0);
});

test('重複固定IDは更新せず停止する', () =>
  assert.throws(() => objectIndex([object(), { ...object(), id: 'gid://shopify/Metaobject/2' }])));

test('checkは未選択を正常とし、非公開記事とアーカイブ商品を状態付きで返す', async () => {
  const clients = fakeClients({
    objects: async () => [object(article, 'DRAFT')],
    products: async () => [
      product,
      {
        ...product,
        id: 'gid://shopify/Product/2',
        status: 'ARCHIVED',
        related: { type: 'metaobject_reference', value: gid },
      },
    ],
    article: async () => null,
  });
  const result = await check(clients);
  assert.equal(result.checkedProducts, 2);
  assert.equal(result.linkedProducts, 1);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].display, '非表示');
  assert.equal(result.results[0].productStatus, 'ARCHIVED');
});

test('setupは読み取りのみが既定で、既存の型違いは自動変更しない', async () => {
  const calls = [];
  const clients = {
    gql: async (query) => {
      calls.push(query);
      return query.includes('metaobjectDefinitionByType')
        ? { metaobjectDefinitionByType: null }
        : { metafieldDefinitions: { nodes: [] } };
    },
  };
  assert.equal((await setup(clients)).length, 2);
  assert.ok(calls.every((q) => q.startsWith('query')));
  clients.gql = async () => ({
    metaobjectDefinitionByType: { displayNameKey: 'wrong' },
    metafieldDefinitions: { nodes: [] },
  });
  await assert.rejects(setup(clients, { apply: true }), /仕様と異なります/);
});

test('checkは壊れた記事IDがあっても影響する商品を報告する', async () => {
  const clients = fakeClients({
    objects: async () => [{ ...object(), handle: '壊れたhandle' }],
    products: async () => [{ ...product, related: { type: 'metaobject_reference', value: gid } }],
  });
  const result = await check(clients);
  assert.equal(result.results[0].product, product.id);
  assert.equal(result.results[0].level, 2);
  assert.match(result.results[0].reason, /固定ID/);
});

test('移行前に永続JSONを保存し、空欄のみCAS設定する。復旧は記録と現値を照合する', async () => {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'ojl-migration-')));
  let reference = null;
  let filename;
  const clients = fakeClients({
    products: async () => [product],
    reference: async () => reference,
    setReference: async (_id, value, digest) => {
      assert.equal(digest, null);
      reference = { type: 'metaobject_reference', value, compareDigest: 'digest1' };
      return reference;
    },
    deleteReference: async () => {
      reference = null;
    },
  });
  const map = { schema_version: 1, source_origin: 'https://cms.example.com', articles: { 42: id } };
  try {
    const dry = await migrate(clients, config, { map, legacyNamespace: 'my_fields', root });
    assert.equal(dry.journal, undefined);
    assert.equal(reference, null);
    const result = await migrate(clients, config, {
      map,
      legacyNamespace: 'my_fields',
      root,
      apply: true,
    });
    filename = result.journal;
    assert.equal((await stat(filename)).mode & 0o777, 0o600);
    const journal = JSON.parse(await readFile(filename, 'utf8'));
    assert.equal(journal.entries[0].state, 'applied');
    assert.equal(journal.entries[0].before, null);
    assert.ok(!JSON.stringify(journal).includes(config.token));
    await assert.rejects(
      restore(clients, { ...config, store: 'other.myshopify.com' }, { filename, apply: true }),
    );
    await restore(clients, config, { filename });
    assert.equal(reference.value, gid);
    reference = { ...reference, value: 'gid://shopify/Metaobject/2' };
    assert.equal((await restore(clients, config, { filename, apply: true })).results[0].level, 1);
    reference = { type: 'metaobject_reference', value: gid, compareDigest: 'digest1' };
    await restore(clients, config, { filename, apply: true });
    assert.equal(reference, null);
    assert.equal(JSON.parse(await readFile(filename, 'utf8')).entries[0].restore_state, 'restored');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('移行の通信中断はunknownとして保存し、復旧時に実際の保存結果を読み直す', async () => {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'ojl-migration-')));
  let reference = null;
  const clients = fakeClients({
    products: async () => [product],
    reference: async () => reference,
    setReference: async () => {
      reference = { value: gid, type: 'metaobject_reference', compareDigest: 'd' };
      throw new Error('通信中断');
    },
    deleteReference: async () => {
      reference = null;
    },
  });
  try {
    const result = await migrate(clients, config, {
      apply: true,
      legacyNamespace: 'my_fields',
      map: { schema_version: 1, source_origin: 'https://cms.example.com', articles: { 42: id } },
      root,
    });
    assert.equal(JSON.parse(await readFile(result.journal, 'utf8')).entries[0].state, 'unknown');
    await restore(clients, config, { apply: true, filename: result.journal });
    assert.equal(reference, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
