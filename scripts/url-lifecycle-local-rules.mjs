import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

export const LOCAL_SOFT404_CSV_RELATIVE_PATH = 'data/url-lifecycle/gsc_soft404.csv';

const GRAPHQL_ENDPOINT = process.env.WP_GRAPHQL_ENDPOINT ?? 'https://cms.oyakonojikanlabo.jp/graphql';
const PAGE_SIZE = 100;
const STATIC_VALID_EXACT_PATHS = [
  '/',
  '/archive/',
  '/event/',
  '/pico/',
  '/culture-school/',
  '/preview/',
  '/about/',
  '/contact/',
  '/contact-pico/',
  '/privacy/',
  '/privacy-policy/',
  '/notationbased/',
  '/contact-us/',
  '/company-profile/',
  '/admin/reservations/',
  '/monzukuri-bu/',
  '/our-products-lineup/',
  '/and-the-institute-of-time-for-parents/',
  '/digital-honor-award-memorial-campaign/',
];
const STATIC_VALID_PREFIXES = [
  '/monzukuri-bu/',
  '/tag/',
  '/search/',
  '/event/',
  '/school-detail/',
  '/admin/',
  '/lp/',
  '/assets/',
  '/icons/',
  '/fonts/',
  '/images/',
  '/favicon',
  '/manifest',
];
const EXACT_SKIP_PATTERNS = [
  /^\/author(?:\/.*)?$/i,
  /^\/category(?:\/.*)?$/i,
  /^\/events\/page\/[0-9]+\/?$/i,
  /^\/page\/[0-9]+\/?$/i,
  /^\/search\/[^/]+\/?$/i,
  /^\/search\/[^/]+\/page\/[0-9]+\/?$/i,
  /^\/search\/.+\/feed(?:\/(?:atom|rss2))?\/?$/i,
  /^\/tag\/[^/]+\/page\/[0-9]+\/?$/i,
  /^\/tag\/.+\/feed(?:\/(?:atom|rss2))?\/?$/i,
  /^\/tags\/[^/]+\/?$/i,
];
const PROTECTED_SYSTEM_PREFIXES = ['/wp-admin/', '/wp-login.php', '/wp-json/', '/xmlrpc.php'];
const LOCAL_REDIRECT_RULES = [
  'RewriteRule ^tags/([^/]+)/?$ /tag/$1/ [R=301,L,NE]',
  'RewriteRule ^search/([^/]+)/?$ /search/?q=$1 [R=301,L,NE,B]',
  'RewriteRule ^search/([^/]+)/page/[0-9]+/?$ /search/?q=$1 [R=301,L,NE,B]',
  'RewriteRule ^tag/([^/]+)/page/[0-9]+/?$ /tag/$1/ [R=301,L,NE]',
  'RewriteRule ^events/page/[0-9]+/?$ /event/ [R=301,L,NE]',
];
const LOCAL_GONE_RULES = [
  'RewriteRule ^category(?:/.*)?$ - [G,L,NC]',
  'RewriteRule ^author(?:/.*)?$ - [G,L,NC]',
  'RewriteRule ^page/[0-9]+/?$ - [G,L,NC]',
  'RewriteRule ^search/.+/feed(?:/(?:atom|rss2))?/?$ - [G,L,NC]',
  'RewriteRule ^tag/.+/feed(?:/(?:atom|rss2))?/?$ - [G,L,NC]',
];

const POSTS_QUERY = `
  query AllPostsForLifecycle($after: String, $pageSize: Int = ${PAGE_SIZE}) {
    posts(first: $pageSize, after: $after, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        slug
      }
    }
  }
`;

function hasFileExtension(pathname) {
  const lastSegment = pathname.split('/').filter(Boolean).pop() ?? '';
  return /\.[a-z0-9]{1,10}$/i.test(lastSegment);
}

export function normalizeUrlPath(input) {
  const value = `${input ?? ''}`.trim();
  if (!value) return null;

  let pathname = value;

  try {
    pathname = new URL(value).pathname;
  } catch {
    pathname = value;
  }

  pathname = pathname.split('#')[0].split('?')[0].trim();
  if (!pathname) return null;
  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }

  pathname = pathname.replace(/\/{2,}/g, '/');

  if (pathname !== '/' && !hasFileExtension(pathname)) {
    pathname = pathname.replace(/\/?$/, '/');
  }

  return pathname;
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function toCsvCell(value) {
  const stringValue = `${value ?? ''}`;
  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function parseSoft404Csv(text) {
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  const header = parseCsvLine(lines[0]);
  const normalizedHeader = header.map((cell) => cell.trim().toLowerCase());
  const urlIndex = normalizedHeader.findIndex((cell) => cell === 'url');
  const lastCrawledIndex = normalizedHeader.findIndex(
    (cell) => cell === 'last_crawled' || cell === 'last_crawl' || cell === '前回のクロール',
  );

  if (urlIndex < 0) {
    throw new Error('soft404 CSV に url 列がありません');
  }

  const rowMap = new Map();

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const pathname = normalizeUrlPath(cells[urlIndex]);
    if (!pathname) continue;

    const lastCrawled = (cells[lastCrawledIndex] ?? '').trim();
    const previous = rowMap.get(pathname);

    if (!previous || lastCrawled > previous.lastCrawled) {
      rowMap.set(pathname, {
        url: pathname,
        lastCrawled,
        source: 'gsc_soft404',
      });
    }
  }

  return [...rowMap.values()].sort((a, b) => a.url.localeCompare(b.url, 'ja'));
}

export function serializeSoft404Csv(rows) {
  const header = ['url', 'last_crawled', 'source'];
  const body = rows.map((row) =>
    [row.url, row.lastCrawled ?? '', row.source ?? 'gsc_soft404'].map(toCsvCell).join(','),
  );

  return `${header.join(',')}\n${body.join('\n')}\n`;
}

function escapeApacheRegex(value) {
  return value.replace(/[\\.^$|?*+()[\]{}]/g, '\\$&');
}

function buildRequestUriPattern(pathname) {
  if (pathname === '/') {
    return '^/$';
  }

  const hasTrailingSlash = pathname.endsWith('/');
  const core = hasTrailingSlash ? pathname.slice(0, -1) : pathname;
  const escaped = escapeApacheRegex(core);

  if (!core) {
    return '^/$';
  }

  return hasTrailingSlash ? `^${escaped}/?$` : `^${escaped}$`;
}

function isProtectedExactPath(pathname, validPostPaths) {
  if (validPostPaths.has(pathname)) {
    return true;
  }

  if (STATIC_VALID_EXACT_PATHS.includes(pathname)) {
    return true;
  }

  if (STATIC_VALID_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  if (PROTECTED_SYSTEM_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return false;
}

async function fetchAll(query, key) {
  const items = [];
  let after = null;

  while (true) {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          after,
          pageSize: PAGE_SIZE,
        },
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

    if (!connection.pageInfo?.hasNextPage) {
      break;
    }

    after = connection.pageInfo.endCursor;
  }

  return items;
}

async function fetchPublishedPostPaths() {
  const posts = await fetchAll(POSTS_QUERY, 'posts');
  return new Set(posts.map((post) => normalizeUrlPath(`/${post.slug}`)).filter(Boolean));
}

function buildExactGoneRules(rows) {
  const lines = ['# ===== 410: ローカルCSV由来の個別ルール ====='];

  for (const row of rows) {
    lines.push(`# ${row.url} (last_crawl=${row.lastCrawled || 'unknown'}, source=${row.source})`);
    lines.push(`RewriteCond %{REQUEST_URI} ${buildRequestUriPattern(row.url)} [NC]`);
    lines.push('RewriteRule ^ - [G,L]');
  }

  return lines;
}

export async function buildLocalLifecycleRules({ projectRoot }) {
  const csvPath = path.join(projectRoot, LOCAL_SOFT404_CSV_RELATIVE_PATH);

  try {
    await access(csvPath);
  } catch {
    console.log(`postbuild: skipped local soft404 rules (${LOCAL_SOFT404_CSV_RELATIVE_PATH} not found)`);
    return '';
  }

  const csvText = await readFile(csvPath, 'utf8');
  const rows = parseSoft404Csv(csvText);

  if (rows.length === 0) {
    console.log(`postbuild: skipped local soft404 rules (${LOCAL_SOFT404_CSV_RELATIVE_PATH} is empty)`);
    return '';
  }

  let validPostPaths = null;

  try {
    validPostPaths = await fetchPublishedPostPaths();
  } catch (error) {
    console.warn('postbuild: failed to fetch published posts, exact 410 rules will be skipped', error);
  }

  const exactRows =
    validPostPaths === null
      ? []
      : rows.filter((row) => {
          if (row.url === '/') return false;
          if (EXACT_SKIP_PATTERNS.some((pattern) => pattern.test(row.url))) return false;
          if (isProtectedExactPath(row.url, validPostPaths)) return false;
          return true;
        });

  const sections = [
    '# ===== ローカル soft404 由来ルール =====',
    `# 入力CSV: ${LOCAL_SOFT404_CSV_RELATIVE_PATH}`,
    '',
    '# ===== 301: ローカル構造ルール =====',
    ...LOCAL_REDIRECT_RULES,
    '',
    '# ===== 410: ローカル構造ルール =====',
    ...LOCAL_GONE_RULES,
  ];

  if (validPostPaths === null) {
    sections.push('', '# published posts の取得に失敗したため、個別 410 ルールは今回スキップしました。');
  } else if (exactRows.length > 0) {
    sections.push('', ...buildExactGoneRules(exactRows));
  } else {
    sections.push('', '# 個別 410 ルールの追加対象はありません。');
  }

  console.log(
    `postbuild: prepared local soft404 rules (source=${rows.length}, exact_410=${exactRows.length}, protected_posts=${
      validPostPaths?.size ?? 0
    })`,
  );

  return `${sections.join('\n')}\n`;
}
