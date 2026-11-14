import {
  readFile,
  mkdir,
  open,
  rename,
  lstat,
  realpath,
  unlink,
  appendFile,
} from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { JSDOM } from 'jsdom';

export const schema = JSON.parse(
  await readFile(new URL('./shopify-articles.schema.json', import.meta.url), 'utf8'),
);
export const ARTICLE_ID =
  /^article_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MO_FIELDS = 'id type handle fields { key value } capabilities { publishable { status } }';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const iso = () => new Date().toISOString();
const empty = (value) => (value == null || value === '' ? null : value);
const statusOf = (object) => object?.capabilities?.publishable?.status;
export const fieldsOf = (object) =>
  Object.fromEntries((object?.fields ?? []).map(({ key, value }) => [key, empty(value)]));
export const handleFor = (id) => {
  if (!ARTICLE_ID.test(id)) throw new Error('固定記事IDの形式が不正です。');
  return id.replace('article_', 'article-');
};

export function configFrom(env = process.env) {
  const store = env.SHOPIFY_STORE_DOMAIN ?? '';
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(store))
    throw new Error('SHOPIFY_STORE_DOMAINに対象ストアのmyshopify.comドメインを指定してください。');
  if (!env.SHOPIFY_ADMIN_TOKEN) throw new Error('SHOPIFY_ADMIN_TOKENが未設定です。');
  const base = new URL(
    env.CONTENT_API_BASE_URL ?? 'https://cms.oyakonojikanlabo.jp/wp-json/ojl-content/v1',
  );
  const origin = new URL(env.PUBLIC_SITE_ORIGIN ?? 'https://oyakonojikanlabo.jp');
  for (const u of [base, origin]) {
    if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash)
      throw new Error('API・公開サイトには認証情報やクエリを含まないHTTPS URLを指定してください。');
  }
  if (origin.pathname !== '/') throw new Error('PUBLIC_SITE_ORIGINにはパスを含めないでください。');
  const version = env.SHOPIFY_ADMIN_API_VERSION ?? '2026-07';
  if (!/^20\d{2}-(01|04|07|10)$/.test(version))
    throw new Error('Shopify APIの安定バージョンを指定してください。');
  return {
    store,
    token: env.SHOPIFY_ADMIN_TOKEN,
    version,
    base: base.href.replace(/\/$/, ''),
    origin: origin.origin,
  };
}

export function normalizeUrl(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password || u.hash || u.search)
    throw new Error('記事URLはクエリ・フラグメントのないHTTPS URLにしてください。');
  u.pathname = u.pathname.replace(/\/$/, '') || '/';
  // パス文字の大小は変えず、同じバイトを示す%hh表記だけを揃えます。
  u.pathname = u.pathname.replace(/%[0-9a-f]{2}/gi, (encoded) => encoded.toUpperCase());
  return u.href;
}

export function validateArticle(article, origin) {
  if (
    !article ||
    !ARTICLE_ID.test(article.id) ||
    typeof article.title !== 'string' ||
    !article.title.trim() ||
    typeof article.excerpt !== 'string' ||
    [...article.excerpt].length > 160
  )
    throw new Error('記事APIの必須項目または抜粋が不正です。');
  if (new URL(normalizeUrl(article.canonical_url)).origin !== origin)
    throw new Error('公開記事URLのドメインが一致しません。');
  if (
    typeof article.updated_at !== 'string' ||
    !/Z$/.test(article.updated_at) ||
    !Number.isFinite(Date.parse(article.updated_at))
  )
    throw new Error('記事更新日時が不正です。');
  if (
    article.image !== null &&
    (!article.image ||
      typeof article.image.alt !== 'string' ||
      new URL(article.image.url).protocol !== 'https:')
  )
    throw new Error('記事画像の形式が不正です。');
  return article;
}

/** スクリプトは実行せず、HTML構造と埋め込みデータを照合します。 */
export function verifyPublicHtml({ status, url, contentType, html }, canonicalUrl) {
  const expected = normalizeUrl(canonicalUrl);
  if (
    status !== 200 ||
    normalizeUrl(url) !== expected ||
    !/^text\/html(?:;|$)/i.test(contentType ?? '')
  )
    throw new Error('公開記事のHTTP応答または最終URLが一致しません。');
  const dom = new JSDOM(html);
  try {
    const doc = dom.window.document;
    const canonicals = [...doc.querySelectorAll('link[rel]')].filter((n) =>
      n.rel.toLowerCase().split(/\s+/).includes('canonical'),
    );
    if (
      canonicals.length !== 1 ||
      normalizeUrl(new URL(canonicals[0].getAttribute('href'), url).href) !== expected
    )
      throw new Error('公開ページのcanonicalが一致しません。');
    if (!doc.querySelector('main[data-prerendered-article="true"] article'))
      throw new Error('記事HTMLの識別マーカーがありません。');
    const scripts = doc.querySelectorAll('script#ojl-post-cache[type="application/json"]');
    if (scripts.length !== 1) throw new Error('埋め込み記事データがありません。');
    const data = JSON.parse(scripts[0].textContent);
    if (
      data.schemaVersion !== 1 ||
      typeof data.slug !== 'string' ||
      !data.slug ||
      /[/\\?#]/.test(data.slug) ||
      typeof data.path !== 'string' ||
      !data.path.startsWith('/') ||
      data.path.startsWith('//') ||
      !Number.isFinite(Date.parse(data.generatedAt)) ||
      !data.post ||
      !Number.isInteger(data.post.databaseId) ||
      data.post.databaseId <= 0 ||
      typeof data.post.title !== 'string' ||
      typeof data.post.content !== 'string'
    )
      throw new Error('埋め込み記事データの形式が不正です。');
    if (
      normalizeUrl(new URL(data.path, url).href) !== expected ||
      normalizeUrl(new URL('/' + data.slug, url).href) !== expected
    )
      throw new Error('埋め込み記事パスが一致しません。');
    return true;
  } finally {
    dom.window.close();
  }
}

/** 全フィールドを指定し、任意項目の空値は明示的なnullとして置換します。 */
export function articleValues(article, syncedAt = iso()) {
  return {
    content_id: article.id,
    title: article.title,
    excerpt: empty(article.excerpt),
    canonical_url: article.canonical_url,
    image_url: article.image?.url ?? null,
    image_alt: empty(article.image?.alt),
    source_updated_at: article.updated_at,
    synced_at: syncedAt,
  };
}

function equivalent(a, b, key) {
  if (key.endsWith('_at') && a && b) return Date.parse(a) === Date.parse(b);
  return empty(a) === empty(b);
}
export function matchesValues(object, values, includeSynced = false) {
  const fields = fieldsOf(object);
  return Object.entries(values).every(
    ([key, value]) =>
      (!includeSynced && key === 'synced_at') || equivalent(fields[key], value, key),
  );
}

export function createClients(config, fetchImpl = fetch) {
  async function request(url, options = {}, retry = true) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetchImpl(url, {
          ...options,
          signal: AbortSignal.timeout(20000),
          redirect: 'error',
        });
        if (retry && (res.status === 429 || res.status >= 500) && attempt < 2) {
          await res.body?.cancel();
          await sleep(
            Math.min(10000, Number(res.headers.get('retry-after') || attempt + 1) * 1000),
          );
          continue;
        }
        return res;
      } catch {
        if (!retry || attempt === 2)
          throw new Error('通信が完了しませんでした。更新結果が不明な場合は再確認してください。');
        await sleep(1000 * (attempt + 1));
      }
    }
  }
  async function content(suffix) {
    const res = await request(config.base + suffix, {
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    });
    if (!/^application\/json(?:;|$)/i.test(res.headers.get('content-type') ?? ''))
      throw new Error('記事APIがJSONを返していません。');
    let payload;
    try {
      payload = await res.json();
    } catch {
      throw new Error('記事APIのJSONが不正です。');
    }
    if (
      res.status === 404 &&
      payload?.code === 'ARTICLE_UNAVAILABLE' &&
      payload?.data?.status === 404
    )
      return null;
    if (res.status !== 200) throw new Error(`記事APIの確認不能（HTTP ${res.status}）。`);
    return payload;
  }
  async function gql(query, variables = {}) {
    const mutation = /^\s*mutation\b/.test(query);
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await request(
        `https://${config.store}/admin/api/${config.version}/graphql.json`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': config.token },
          body: JSON.stringify({ query, variables }),
        },
        !mutation,
      );
      const used = res.headers.get('x-shopify-api-version');
      if (used && used !== config.version)
        throw new Error(
          'Shopify APIバージョンが要求と異なります。対応バージョンを確認してください。',
        );
      if (!res.ok) throw new Error(`Shopify APIの確認不能（HTTP ${res.status}）。`);
      const payload = await res.json();
      if (
        payload.errors?.length &&
        payload.errors.every((e) => e.extensions?.code === 'THROTTLED') &&
        attempt < 2
      ) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      if (payload.errors?.length || !payload.data)
        throw new Error('Shopify GraphQLエラー。API仕様・権限を確認してください。');
      for (const value of Object.values(payload.data)) {
        if (value?.userErrors?.length)
          throw new Error(
            'Shopify保存エラー：' +
              value.userErrors
                .map((e) => (e.field ?? []).join('.') + ' ' + (e.code ?? '入力または競合'))
                .join(' / '),
          );
      }
      const cost = payload.extensions?.cost;
      if (cost?.throttleStatus?.currentlyAvailable < 100 && cost.throttleStatus.restoreRate > 0)
        await sleep(Math.ceil(100 / cost.throttleStatus.restoreRate) * 1000);
      return payload.data;
    }
  }
  async function connection(query, key, variables = {}) {
    const items = [];
    const seen = new Set();
    let after = null;
    do {
      const data = (await gql(query, { ...variables, after }))[key];
      if (!Array.isArray(data?.nodes) || typeof data.pageInfo?.hasNextPage !== 'boolean')
        throw new Error('Shopify一覧を完全に取得できません。');
      items.push(...data.nodes);
      if (!data.pageInfo.hasNextPage) break;
      after = data.pageInfo.endCursor;
      if (!after || seen.has(after)) throw new Error('Shopifyのページ分割が不正です。');
      seen.add(after);
    } while (true);
    return items;
  }
  return {
    gql,
    async articles() {
      const articles = [];
      const ids = new Set();
      let totalPages = 1;
      for (let page = 1; page <= totalPages; page++) {
        const data = await content(`/articles?page=${page}&per_page=100`);
        const p = data?.pagination;
        if (
          !Array.isArray(data?.data) ||
          p?.page !== page ||
          p?.per_page !== 100 ||
          !Number.isInteger(p?.total) ||
          p.total < 0 ||
          !Number.isInteger(p?.total_pages) ||
          p.total_pages !== Math.ceil(p.total / 100) ||
          p.total_pages > 1000000
        )
          throw new Error('記事一覧のページ情報が不正です。');
        if (page > 1 && totalPages !== p.total_pages)
          throw new Error('記事一覧が取得中に変わりました。再実行してください。');
        totalPages = p.total_pages;
        for (const raw of data.data) {
          const article = validateArticle(raw, config.origin);
          if (ids.has(article.id)) throw new Error('記事一覧の固定IDが重複しています。');
          ids.add(article.id);
          articles.push(article);
        }
      }
      return articles;
    },
    async article(id) {
      handleFor(id);
      const data = await content('/articles/' + id);
      if (data === null) return null;
      const article = validateArticle(data.data, config.origin);
      if (article.id !== id) throw new Error('要求した固定IDとAPI応答が一致しません。');
      return article;
    },
    objects: () =>
      connection(
        `query($after: String) { metaobjects(type: "ojl_article", first: 100, after: $after) { nodes { ${MO_FIELDS} } pageInfo { hasNextPage endCursor } } }`,
        'metaobjects',
      ),
    products: (legacyNamespace = 'my_fields') =>
      connection(
        `query($after: String, $legacy: String!) { products(first: 100, after: $after) { nodes { id title status related: metafield(namespace: "custom", key: "related_article") { value type compareDigest } legacy: metafield(namespace: $legacy, key: "wp_post_id") { value type } } pageInfo { hasNextPage endCursor } } }`,
        'products',
        { legacy: legacyNamespace },
      ),
    async object(id) {
      return (await gql(`query($id: ID!) { metaobject(id: $id) { ${MO_FIELDS} } }`, { id }))
        .metaobject;
    },
    async reference(id) {
      const p = (
        await gql(
          'query($id: ID!) { product(id: $id) { id related: metafield(namespace: "custom", key: "related_article") { value type compareDigest } } }',
          { id },
        )
      ).product;
      if (!p) throw new Error('商品が存在しません。');
      return p.related;
    },
    async legacyReference(id, namespace) {
      const p = (
        await gql(
          'query($id: ID!, $namespace: String!) { product(id: $id) { legacy: metafield(namespace: $namespace, key: "wp_post_id") { value type } } }',
          { id, namespace },
        )
      ).product;
      if (!p) throw new Error('商品が存在しません。');
      return p.legacy;
    },
    async publicPage(article) {
      let url = article.canonical_url;
      for (let n = 0; n <= 5; n++) {
        if (new URL(url).origin !== config.origin)
          throw new Error('記事URLが公開サイト外へ転送されました。');
        const res = await fetchImpl(url, {
          signal: AbortSignal.timeout(20000),
          redirect: 'manual',
          headers: { Accept: 'text/html', 'Cache-Control': 'no-cache' },
        });
        if ([301, 302, 303, 307, 308].includes(res.status)) {
          const next = res.headers.get('location');
          await res.body?.cancel();
          if (!next) throw new Error('記事URLの転送先がありません。');
          url = new URL(next, url).href;
          continue;
        }
        return verifyPublicHtml(
          {
            status: res.status,
            url,
            contentType: res.headers.get('content-type'),
            html: await res.text(),
          },
          article.canonical_url,
        );
      }
      throw new Error('記事URLの転送回数を超えました。');
    },
    async saveArticle(article) {
      const values = articleValues(article);
      const result = await gql(
        `mutation($handle: MetaobjectHandleInput!, $values: JSON!) { metaobjectUpsert(handle: $handle, values: $values) { metaobject { ${MO_FIELDS} } userErrors { field code } } }`,
        { handle: { type: 'ojl_article', handle: handleFor(article.id) }, values },
      );
      const object = result.metaobjectUpsert.metaobject;
      if (!object?.id) throw new Error('記事の保存結果を確認できません。');
      if (!matchesValues(await this.object(object.id), values, true))
        throw new Error('空値を含む記事データの保存結果が一致しません。');
      await this.setStatus(object.id, 'ACTIVE');
      return this.object(object.id);
    },
    async setStatus(id, status) {
      await gql(
        'mutation($id: ID!, $metaobject: MetaobjectUpdateInput!) { metaobjectUpdate(id: $id, metaobject: $metaobject) { metaobject { id } userErrors { field code } } }',
        {
          id,
          metaobject: {
            capabilities: { publishable: { status } },
            fields: [{ key: 'synced_at', value: iso() }],
          },
        },
      );
      if (statusOf(await this.object(id)) !== status)
        throw new Error('記事の公開状態を保存できません。');
    },
    async setReference(id, value, compareDigest) {
      await gql(
        'mutation($fields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $fields) { metafields { value compareDigest } userErrors { field code } } }',
        {
          fields: [
            {
              ownerId: id,
              namespace: 'custom',
              key: 'related_article',
              type: 'metaobject_reference',
              value,
              compareDigest,
            },
          ],
        },
      );
      const ref = await this.reference(id);
      if (ref?.value !== value) throw new Error('商品参照の保存結果が一致しません。');
      return ref;
    },
    async deleteReference(id) {
      await gql(
        'mutation($fields: [MetafieldIdentifierInput!]!) { metafieldsDelete(metafields: $fields) { deletedMetafields { ownerId } userErrors { field message } } }',
        { fields: [{ ownerId: id, namespace: 'custom', key: 'related_article' }] },
      );
      if (await this.reference(id)) throw new Error('商品参照の解除結果が一致しません。');
    },
  };
}

export function objectIndex(objects) {
  const byId = new Map();
  const byContent = new Map();
  for (const object of objects) {
    const id = fieldsOf(object).content_id;
    if (
      object.type !== 'ojl_article' ||
      !ARTICLE_ID.test(id) ||
      object.handle !== handleFor(id) ||
      byContent.has(id) ||
      byId.has(object.id)
    )
      throw new Error(
        'Metaobjectの固定ID・handleが不正または重複しています。自動修正は行いません。',
      );
    byId.set(object.id, object);
    byContent.set(id, object);
  }
  return { byId, byContent };
}

export async function synchronize(clients, { apply = false, deactivateOnly = false } = {}) {
  const objects = await clients.objects();
  const { byContent } = objectIndex(objects);
  const results = [];
  let articles = [];
  if (!deactivateOnly) {
    try {
      articles = await clients.articles();
    } catch (error) {
      results.push({ level: 2, reason: '一覧取得失敗：' + error.message });
    }
  }
  const ids = new Set([...byContent.keys(), ...articles.map((a) => a.id)]);
  const listed = new Set(articles.map((a) => a.id));
  for (const id of ids) {
    const old = byContent.get(id);
    try {
      // 保存直前にも現在状態を照合し、一覧取得中の非公開化を拾います。
      const article = await clients.article(id);
      if (!article) {
        if (old && statusOf(old) !== 'DRAFT') {
          if (apply) await clients.setStatus(old.id, 'DRAFT');
          results.push({
            level: 0,
            article: id,
            reason: apply ? '非公開化しました。' : '非公開化予定です。',
          });
        }
        continue;
      }
      if (deactivateOnly || !listed.has(id)) continue;
      if (old && matchesValues(old, articleValues(article)) && statusOf(old) === 'ACTIVE') continue;
      await clients.publicPage(article);
      const current = await clients.article(id);
      if (!current) {
        if (apply && old) await clients.setStatus(old.id, 'DRAFT');
        results.push({
          level: 0,
          article: id,
          reason: '確認中に公開終了しました。同期対象外です。',
        });
        continue;
      }
      if (JSON.stringify(articleValues(current, '')) !== JSON.stringify(articleValues(article, '')))
        throw new Error('確認中に記事が変更されました。再実行してください。');
      if (apply) await clients.saveArticle(article);
      results.push({ level: 0, article: id, reason: apply ? '同期しました。' : '同期予定です。' });
    } catch (error) {
      results.push({ level: 2, article: id, reason: error.message });
    }
  }
  return results;
}

export async function check(clients) {
  const objects = await clients.objects();
  // 不正な1記事があっても、影響する商品を特定できるよう検査を続けます。
  const byId = new Map(objects.map((object) => [object.id, object]));
  const counts = new Map();
  for (const object of objects) {
    const id = fieldsOf(object).content_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const products = await clients.products();
  const results = [];
  const states = new Map();
  for (const product of products) {
    if (!product.related) continue;
    const context = {
      product: product.id,
      title: product.title,
      productStatus: product.status,
      display: '不明',
    };
    const object = byId.get(product.related.value);
    if (product.related.type !== 'metaobject_reference' || !object) {
      results.push({
        ...context,
        level: 1,
        reason: '記事参照が不正、またはMetaobjectがありません。',
      });
      continue;
    }
    const id = fieldsOf(object).content_id;
    context.display =
      statusOf(object) === 'DRAFT'
        ? '非表示'
        : fieldsOf(object).title && fieldsOf(object).canonical_url
          ? '表示対象'
          : '非表示';
    try {
      objectIndex([object]);
      if (counts.get(id) !== 1)
        throw new Error('Metaobjectの固定記事IDが重複しています。保守担当者が確認してください。');
      if (!states.has(id)) {
        try {
          const article = await clients.article(id);
          if (article) await clients.publicPage(article);
          states.set(id, { article });
        } catch (error) {
          states.set(id, { error });
        }
      }
      const state = states.get(id);
      if (state.error) throw state.error;
      if (!state.article)
        results.push({
          ...context,
          article: id,
          level: 1,
          reason:
            statusOf(object) === 'DRAFT'
              ? '公開記事として取得できません。表示停止済み。選択を解除するか別の記事を選んでください。'
              : '利用不可の記事がACTIVEです。非公開化が未反映です。',
        });
      else if (
        statusOf(object) !== 'ACTIVE' ||
        !matchesValues(object, articleValues(state.article))
      )
        results.push({
          ...context,
          article: id,
          level: 1,
          reason: '記事データまたは公開状態が未同期です。同期を再実行してください。',
        });
    } catch (error) {
      results.push({ ...context, article: id, level: 2, reason: '確認不能：' + error.message });
    }
  }
  return {
    results,
    checkedProducts: products.length,
    linkedProducts: products.filter((p) => p.related).length,
  };
}

/** 既存定義との食い違いは自動変更せず、導入担当者へ返します。 */
export async function setup(clients, { apply = false } = {}) {
  let definition = (
    await clients.gql(
      'query { metaobjectDefinitionByType(type: "ojl_article") { id displayNameKey access { admin storefront } capabilities { publishable { enabled } } fieldDefinitions { key required type { name } } } }',
    )
  ).metaobjectDefinitionByType;
  const existing = (
    await clients.gql(
      'query { metafieldDefinitions(ownerType: PRODUCT, namespace: "custom", key: "related_article", first: 10) { nodes { id type { name } validations { name value } access { storefront } } } }',
    )
  ).metafieldDefinitions.nodes;
  if (existing.length) {
    const field = existing[0];
    if (
      existing.length !== 1 ||
      !definition ||
      field.type.name !== schema.product.type ||
      field.access.storefront !== 'PUBLIC_READ' ||
      field.validations.length !== 1 ||
      !field.validations.some(
        (v) => v.name === 'metaobject_definition_id' && v.value === definition.id,
      )
    )
      throw new Error('既存の商品参照定義が仕様と異なります。自動変更は中止しました。');
  }
  const results = [];
  if (definition) {
    const expected = schema.metaobject;
    if (
      definition.displayNameKey !== expected.displayNameKey ||
      definition.access.admin !== expected.access.admin ||
      definition.access.storefront !== expected.access.storefront ||
      !definition.capabilities.publishable.enabled ||
      definition.fieldDefinitions.length !== expected.fieldDefinitions.length ||
      expected.fieldDefinitions.some(
        (field) =>
          !definition.fieldDefinitions.some(
            (f) =>
              f.key === field.key && f.required === field.required && f.type.name === field.type,
          ),
      )
    )
      throw new Error('既存の記事Metaobject定義が仕様と異なります。自動変更は中止しました。');
  } else {
    if (apply)
      definition = (
        await clients.gql(
          'mutation($definition: MetaobjectDefinitionCreateInput!) { metaobjectDefinitionCreate(definition: $definition) { metaobjectDefinition { id } userErrors { field code } } }',
          { definition: schema.metaobject },
        )
      ).metaobjectDefinitionCreate.metaobjectDefinition;
    results.push({
      level: 0,
      reason: apply ? '記事定義を作成しました。' : '記事定義を作成予定です。',
    });
  }
  if (!existing.length) {
    if (apply) {
      if (!definition?.id) throw new Error('記事定義の作成結果を確認できません。');
      await clients.gql(
        'mutation($definition: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $definition) { createdDefinition { id } userErrors { field code } } }',
        {
          definition: {
            ...schema.product,
            validations: [{ name: 'metaobject_definition_id', value: definition.id }],
          },
        },
      );
    }
    results.push({
      level: 0,
      reason: apply ? '商品参照定義を作成しました。' : '商品参照定義を作成予定です。',
    });
  }
  return results;
}

async function privateDirectory(directory, create = true) {
  if (create) await mkdir(directory, { recursive: true, mode: 0o700 });
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.mode & 0o077)
    throw new Error(
      '移行記録のディレクトリは所有者のみアクセスできる実ディレクトリ（700）にしてください。',
    );
  if ((await realpath(directory)) !== path.resolve(directory))
    throw new Error('移行記録の保存先にシンボリックリンクは使用できません。');
}

/** rename前に内容、rename後にディレクトリをfsyncします。 */
export async function saveJournal(filename, journal) {
  const temporary = filename + '.' + randomUUID() + '.tmp';
  let handle;
  try {
    handle = await open(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o600,
    );
    await handle.writeFile(JSON.stringify(journal, null, 2) + '\n');
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporary, filename);
    const directory = await open(path.dirname(filename), constants.O_RDONLY);
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  } finally {
    await handle?.close();
    await unlink(temporary).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

export async function migrate(
  clients,
  config,
  {
    apply = false,
    map,
    legacyNamespace,
    root = path.join(os.homedir(), '.local/share/oyako-content-sync/migrations'),
  } = {},
) {
  if (!legacyNamespace || !/^[a-zA-Z0-9_-]+$/.test(legacyNamespace))
    throw new Error('--legacy-namespaceの明示が必要です。');
  if (
    map?.schema_version !== 1 ||
    !map.articles ||
    typeof map.articles !== 'object' ||
    Array.isArray(map.articles) ||
    new URL(map.source_origin).origin !== new URL(config.base).origin
  )
    throw new Error('移行対応表の形式・取得元が不正です。');
  const seen = new Set();
  for (const [numeric, id] of Object.entries(map.articles)) {
    if (!/^[1-9][0-9]*$/.test(numeric) || !ARTICLE_ID.test(id) || seen.has(id))
      throw new Error('移行対応表に不正値または重複があります。');
    seen.add(id);
  }
  const { byContent } = objectIndex(await clients.objects());
  const products = await clients.products(legacyNamespace);
  const journal = {
    schema_version: 1,
    store: config.store,
    migration_id: randomUUID(),
    created_at: iso(),
    updated_at: iso(),
    entries: [],
  };
  const results = [];
  for (const product of products) {
    if (!product.legacy || product.related) continue;
    const articleId = map.articles[product.legacy.value];
    const object = byContent.get(articleId);
    if (product.legacy.type !== 'number_integer' || !object || statusOf(object) !== 'ACTIVE') {
      results.push({
        product: product.id,
        title: product.title,
        level: 1,
        reason: '旧IDに対応する公開済み同期記事がありません。移行対象外です。',
      });
      continue;
    }
    const article = await clients.article(articleId);
    if (!article || !matchesValues(object, articleValues(article))) {
      results.push({
        product: product.id,
        level: 1,
        reason: '公開記事が取得できないか未同期です。移行対象外です。',
      });
      continue;
    }
    await clients.publicPage(article);
    journal.entries.push({
      product_id: product.id,
      title: product.title,
      legacy_value: product.legacy.value,
      content_id: articleId,
      before: null,
      after: object.id,
      state: 'planned',
    });
  }
  if (!apply)
    return {
      results: [
        ...results,
        ...journal.entries.map((e) => ({
          product: e.product_id,
          title: e.title,
          article: e.content_id,
          level: 0,
          reason: '空欄へ参照を設定予定です。',
        })),
      ],
    };
  await privateDirectory(root);
  const storeDirectory = path.join(root, config.store);
  await privateDirectory(storeDirectory);
  const directory = path.join(storeDirectory, journal.migration_id);
  await privateDirectory(directory);
  const filename = path.join(directory, 'journal.json');
  await saveJournal(filename, journal);
  // 保存障害は捕捉せず即座に中断します。plannedのままでも復旧時に再照合できます。
  for (const entry of journal.entries) {
    try {
      const legacy = await clients.legacyReference(entry.product_id, legacyNamespace);
      if (
        legacy?.type !== 'number_integer' ||
        legacy.value !== entry.legacy_value ||
        (await clients.reference(entry.product_id))
      ) {
        entry.state = 'skipped';
        entry.detail = '実行前に商品設定が変更されました。';
      } else {
        const currentArticle = await clients.article(entry.content_id);
        const currentObject = await clients.object(entry.after);
        if (
          !currentArticle ||
          statusOf(currentObject) !== 'ACTIVE' ||
          !matchesValues(currentObject, articleValues(currentArticle))
        )
          throw new Error('実行前に記事の公開状態または同期内容が変更されました。');
        const ref = await clients.setReference(entry.product_id, entry.after, null);
        entry.state = 'applied';
        entry.after_digest = ref.compareDigest;
      }
    } catch (error) {
      entry.state = 'unknown';
      entry.detail = error.message;
    }
    journal.updated_at = iso();
    await saveJournal(filename, journal);
    results.push({
      product: entry.product_id,
      title: entry.title,
      article: entry.content_id,
      level: entry.state === 'applied' ? 0 : 2,
      reason: entry.detail ?? '移行しました。',
    });
    if (entry.state === 'unknown') break;
  }
  return { results, journal: filename };
}

export async function restore(clients, config, { apply = false, filename } = {}) {
  if (!filename || !path.isAbsolute(filename))
    throw new Error('--journalには移行記録の絶対パスを指定してください。');
  await privateDirectory(path.dirname(filename), false);
  const stat = await lstat(filename);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.mode & 0o077)
    throw new Error('移行記録は所有者のみアクセスできる通常ファイル（600）にしてください。');
  const journal = JSON.parse(await readFile(filename, 'utf8'));
  if (
    journal.schema_version !== 1 ||
    journal.store !== config.store ||
    !Array.isArray(journal.entries) ||
    journal.entries.some(
      (e) =>
        !/^gid:\/\/shopify\/Product\/\d+$/.test(e.product_id) ||
        !/^gid:\/\/shopify\/Metaobject\/\d+$/.test(e.after) ||
        e.before !== null,
    )
  )
    throw new Error('移行記録が不正、または対象ストアが違います。');
  const results = [];
  for (const entry of journal.entries) {
    if (entry.state === 'skipped' || entry.restore_state === 'restored') continue;
    try {
      const current = await clients.reference(entry.product_id);
      if (!current) {
        entry.restore_state = 'restored';
      } else if (
        current.type !== 'metaobject_reference' ||
        current.value !== entry.after ||
        (entry.after_digest && current.compareDigest !== entry.after_digest)
      ) {
        results.push({
          product: entry.product_id,
          level: 1,
          reason: '移行後に参照が変更されています。復旧対象外です。',
        });
        continue;
      } else if (apply) {
        entry.restore_state = 'planned';
        journal.updated_at = iso();
        await saveJournal(filename, journal);
        // 削除APIにはCASがないため、直前にも照合します。運用中の対象商品編集は止めます。
        const latest = await clients.reference(entry.product_id);
        if (latest?.value !== current.value || latest?.compareDigest !== current.compareDigest)
          throw new Error('復旧直前に参照が変更されました。');
        await clients.deleteReference(entry.product_id);
        entry.restore_state = 'restored';
      }
      results.push({
        product: entry.product_id,
        level: 0,
        reason: apply ? '変更前の空欄へ復旧済みです。' : '変更前の空欄へ復旧予定です。',
      });
    } catch (error) {
      // 復旧の結果が不明なら次の商品へ進みません。
      results.push({ product: entry.product_id, level: 2, reason: error.message });
      if (apply) {
        journal.updated_at = iso();
        await saveJournal(filename, journal);
      }
      break;
    }
    if (apply) {
      journal.updated_at = iso();
      await saveJournal(filename, journal);
    }
  }
  return { results, journal: filename };
}

export function report(results, store) {
  const cell = (s) =>
    String(s ?? '—')
      .replace(/[\r\n]/g, ' ')
      .replace(/\|/g, '\\|')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  return (
    '| 商品 / 管理画面 | 商品状態 | 記事ID | カード | 判定・対応 |\n| --- | --- | --- | --- | --- |\n' +
    results
      .map((r) => {
        const productId = r.product?.match(/^gid:\/\/shopify\/Product\/(\d+)$/)?.[1];
        const link = productId ? ` [管理画面](https://${store}/admin/products/${productId})` : '';
        return `| ${cell(r.title ?? r.product)}${link} | ${cell(r.productStatus)} | ${cell(r.article)} | ${cell(r.display)} | ${r.level === 2 ? '確認不能：' : ''}${cell(r.reason)} |`;
      })
      .join('\n') +
    '\n'
  );
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      apply: { type: 'boolean', default: false },
      map: { type: 'string' },
      'legacy-namespace': { type: 'string' },
      journal: { type: 'string' },
    },
  });
  const [command] = positionals;
  if (
    positionals.length !== 1 ||
    !['setup', 'sync', 'deactivate', 'check', 'migrate', 'restore'].includes(command)
  )
    throw new Error(
      'setup / sync / deactivate / check / migrate / restore を指定してください。変更には--applyが必要です。',
    );
  if (['migrate', 'restore'].includes(command) && (process.env.CI || process.env.GITHUB_ACTIONS))
    throw new Error('移行・復旧は永続保存できるローカル環境でのみ実行してください。');
  const config = configFrom();
  const clients = createClients(config);
  let outcome;
  if (command === 'setup') outcome = { results: await setup(clients, values) };
  if (command === 'sync' || command === 'deactivate')
    outcome = {
      results: await synchronize(clients, {
        apply: values.apply,
        deactivateOnly: command === 'deactivate',
      }),
    };
  if (command === 'check') outcome = await check(clients);
  if (command === 'migrate')
    outcome = await migrate(clients, config, {
      apply: values.apply,
      legacyNamespace: values['legacy-namespace'],
      map: JSON.parse(await readFile(values.map, 'utf8')),
    });
  if (command === 'restore')
    outcome = await restore(clients, config, { apply: values.apply, filename: values.journal });
  const text =
    `${command} / ${values.apply && command !== 'check' ? '実行' : '読み取りのみ'}\n\n` +
    report(outcome.results, config.store) +
    (outcome.checkedProducts !== undefined
      ? `\n商品確認 ${outcome.checkedProducts}件 / 設定あり ${outcome.linkedProducts}件\n`
      : '') +
    (outcome.journal ? `\n移行記録: ${outcome.journal}\n` : '') +
    (outcome.results.length ? '' : '\n問題・変更対象はありません。\n');
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, text);
  process.exitCode = Math.max(0, ...outcome.results.map((r) => r.level));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(async (error) => {
    console.error(error.message);
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        '\n関連記事の確認を完了できませんでした。実行ログを確認してください。\n',
      ).catch(() => {});
    }
    process.exitCode = 2;
  });
}
