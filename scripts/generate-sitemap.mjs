import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SITE_ORIGIN = 'https://oyakonojikanlabo.jp';
const GRAPHQL_ENDPOINT = process.env.WP_GRAPHQL_ENDPOINT ?? 'https://cms.oyakonojikanlabo.jp/graphql';
const PAGE_SIZE = 100;
const OUTPUT_PATH = path.join(process.cwd(), 'dist', 'sitemap.xml');

// SEO: ステージング URL がインデックスされると重複コンテンツ判定を受けるため、本番と判定できない環境では生成をスキップする。
function isProduction() {
  if (process.env.SITEMAP_FORCE === 'true') return true;
  if (process.env.SITEMAP_SKIP === 'true') return false;

  const envFlag = (process.env.APP_ENV ?? process.env.SITE_ENV ?? process.env.NODE_ENV ?? '').toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV ?? '').toLowerCase();
  const netlifyContext = (process.env.CONTEXT ?? '').toLowerCase();
  const deployTarget = (process.env.DEPLOY_TARGET ?? '').toLowerCase();
  const siteUrl = (process.env.SITE_URL ?? process.env.URL ?? '').toLowerCase();

  if (deployTarget === 'staging') return false;
  if (siteUrl.includes('stg.oyakonojikanlabo.jp')) return false;

  if (vercelEnv) return vercelEnv === 'production';
  if (netlifyContext) return netlifyContext === 'production';
  if (envFlag) return ['production', 'prod'].includes(envFlag);

  if (siteUrl) {
    const hostname = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return hostname === 'oyakonojikanlabo.jp' || hostname === 'www.oyakonojikanlabo.jp';
  }

  return false;
}

// SEO: 更新検知を正しく伝えることで再クロール頻度を最適化するため、WordPress の modified を ISO 形式に揃える。
function formatLastmod(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildLoc(pathname) {
  // SEO: 生成先ドメインを固定することで誤ってステージングドメインを登録する事故を防ぐ。
  const url = new URL(pathname, SITE_ORIGIN);
  return url.toString().replace(/\/$/, ''); // 末尾スラッシュは付けない
}

async function fetchAll(query, key) {
  const items = [];
  let after = null;

  while (true) {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { after, pageSize: PAGE_SIZE },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed (${response.status} ${response.statusText})`);
    }

    const result = await response.json();
    if (result.errors?.length) {
      const messages = result.errors.map((error) => error.message).join('; ');
      throw new Error(`GraphQL errors: ${messages}`);
    }

    const connection = result.data?.[key];
    if (!connection) {
      throw new Error(`Unexpected GraphQL response: missing ${key}`);
    }

    items.push(...(connection.nodes ?? []).filter((node) => node?.slug));

    if (!connection.pageInfo?.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }

  return items;
}

const POSTS_QUERY = `
  query AllPosts($after: String, $pageSize: Int = ${PAGE_SIZE}) {
    posts(first: $pageSize, after: $after, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        slug
        modified
      }
    }
  }
`;

const EVENTS_QUERY = `
  query AllEvents($after: String, $pageSize: Int = ${PAGE_SIZE}) {
    events(first: $pageSize, after: $after, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        slug
        modified
      }
    }
  }
`;

async function main() {
  if (!isProduction()) {
    console.log('sitemap: skipped (non-production environment)');
    return;
  }

  const [posts, events] = await Promise.all([
    fetchAll(POSTS_QUERY, 'posts'),
    fetchAll(EVENTS_QUERY, 'events'),
  ]);

  const urls = [
    ...posts.map(({ slug, modified }) => ({
      loc: buildLoc(`/${slug}`),
      lastmod: formatLastmod(modified),
    })),
    ...events.map(({ slug, modified }) => ({
      loc: buildLoc(`/event/${slug}`),
      lastmod: formatLastmod(modified),
    })),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((item) => {
      const lastmod = item.lastmod ? `    <lastmod>${item.lastmod}</lastmod>` : null;
      return [
        '  <url>',
        `    <loc>${escapeXml(item.loc)}</loc>`,
        lastmod,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    }),
    '</urlset>',
    '',
  ].join('\n');

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, xml, 'utf8');

  console.log(`sitemap: generated ${urls.length} URLs -> ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error('sitemap: failed', error);
  process.exitCode = 1;
});
