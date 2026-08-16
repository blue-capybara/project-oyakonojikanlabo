import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SITE_ORIGIN = process.env.SITE_URL ?? 'https://oyakonojikanlabo.jp';
const GRAPHQL_ENDPOINT =
  process.env.WP_GRAPHQL_ENDPOINT ?? 'https://cms.oyakonojikanlabo.jp/graphql';
const OUT_DIR = path.resolve(process.cwd(), process.env.BUILD_OUT_DIR ?? 'dist');
const POST_CACHE_DIR = path.join(OUT_DIR, 'post-cache');
const POST_PAGE_DIR = path.join(OUT_DIR, 'post-pages');
const PAGE_SIZE = 20;
const SCHEMA_VERSION = 1;
const RESERVED_SINGLE_SEGMENT_PATHS = new Set([
  'about',
  'archive',
  'contact',
  'contact-pico',
  'contact-us',
  'company-profile',
  'culture-school',
  'event',
  'login',
  'mypage',
  'notationbased',
  'pico',
  'preview',
  'privacy',
  'privacy-policy',
  'search',
  'signup',
]);

const POSTS_QUERY = `
  query CachedPosts($after: String, $pageSize: Int!) {
    posts(first: $pageSize, after: $after, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        databaseId
        slug
        title
        date
        modified
        content
        excerpt
        customCss
        customJs
        featuredImage {
          node {
            sourceUrl
            srcSet
            sizes
            mediaDetails {
              width
              height
            }
          }
        }
        tags {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const stripHtml = (value = '') =>
  String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

const stripExecutableScripts = (value = '') =>
  String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script\b[^>]*\/?\s*>/gi, '');

const serializeForHtml = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

const normalizeSlug = (value) =>
  String(value ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '');

const isSafeSlug = (slug) =>
  slug !== '' &&
  slug !== '.' &&
  slug !== '..' &&
  !slug.includes('/') &&
  !slug.includes('\\') &&
  !slug.includes('\0');

const formatDateJa = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const fetchGraphQL = async (variables, attempt = 1) => {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: POSTS_QUERY, variables }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message).join('; '));
    }

    const posts = payload.data?.posts;
    if (!posts || !Array.isArray(posts.nodes)) {
      throw new Error('posts connection is missing');
    }

    return posts;
  } catch (error) {
    if (attempt >= 3) throw error;
    const delay = attempt * 750;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchGraphQL(variables, attempt + 1);
  }
};

const fetchAllPosts = async () => {
  const posts = [];
  let after = null;

  while (true) {
    const connection = await fetchGraphQL({ after, pageSize: PAGE_SIZE });
    posts.push(...connection.nodes);
    console.log(`post-cache: fetched ${posts.length} post(s)`);

    if (!connection.pageInfo?.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }

  return posts;
};

const buildSnapshotBody = (post) => {
  const hero = post.featuredImage?.node ?? null;
  const dateText = formatDateJa(post.date);
  const content = stripExecutableScripts(post.content ?? '');
  const image = hero?.sourceUrl
    ? `<figure class="ojl-prerender__hero"><img src="${escapeHtml(hero.sourceUrl)}"${hero.srcSet ? ` srcset="${escapeHtml(hero.srcSet)}"` : ''}${hero.sizes ? ` sizes="${escapeHtml(hero.sizes)}"` : ''}${hero.mediaDetails?.width ? ` width="${Number(hero.mediaDetails.width)}"` : ''}${hero.mediaDetails?.height ? ` height="${Number(hero.mediaDetails.height)}"` : ''} alt="${escapeHtml(post.title)}" fetchpriority="high" decoding="async"></figure>`
    : '';

  return `
    <main class="ojl-prerender" data-prerendered-article="true">
      <article>
        ${image}
        <header class="ojl-prerender__header">
          <h1>${escapeHtml(post.title)}</h1>
          ${dateText ? `<p class="ojl-prerender__date">${escapeHtml(dateText)}</p>` : ''}
        </header>
        <div class="ojl-prerender__content">${content}</div>
      </article>
    </main>`;
};

const injectIntoIndex = (indexHtml, post, envelope) => {
  const canonicalUrl = new URL(`/${encodeURIComponent(post.slug)}`, SITE_ORIGIN).toString();
  const description = stripHtml(post.excerpt || post.content).slice(0, 180);
  const title = `${post.title}｜親子の時間研究所`;
  const heroUrl = post.featuredImage?.node?.sourceUrl ?? '';

  const seoMarkup = `
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(post.title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  ${heroUrl ? `<meta property="og:image" content="${escapeHtml(heroUrl)}" />` : ''}
  <style data-ojl-prerender-style>
    .ojl-prerender{max-width:960px;margin:0 auto;padding:32px 20px 64px;font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;color:#2b2b2b;line-height:1.8}
    .ojl-prerender__hero{margin:0 0 28px}.ojl-prerender__hero img{display:block;width:100%;height:auto}
    .ojl-prerender__header{margin-bottom:32px}.ojl-prerender__header h1{font-size:clamp(1.75rem,4vw,2.5rem);line-height:1.4;margin:0}.ojl-prerender__date{color:#667085;font-size:.9rem}
    .ojl-prerender__content img,.ojl-prerender__content iframe{max-width:100%;height:auto}.ojl-prerender__content table{width:100%;border-collapse:collapse}.ojl-prerender__content th,.ojl-prerender__content td{border:1px solid #d8dee8;padding:.7rem}.ojl-prerender__content th{background:#eef3f8;text-align:left}
  </style>`;

  let html = indexHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace('</head>', `${seoMarkup}\n</head>`);

  const rootStart = html.indexOf('  <div id="root">');
  const rootEndMarker = '  <script>\n    if (window.performance';
  const rootEnd = html.indexOf(rootEndMarker, rootStart);
  if (rootStart < 0 || rootEnd < 0) {
    throw new Error('built index root markers were not found');
  }

  const embeddedData = `  <script id="ojl-post-cache" type="application/json">${serializeForHtml(envelope)}</script>\n`;
  html = `${html.slice(0, rootStart)}  <div id="root">${buildSnapshotBody(post)}\n  </div>\n${embeddedData}${html.slice(rootEnd)}`;

  return html;
};

async function main() {
  const indexPath = path.join(OUT_DIR, 'index.html');
  const indexHtml = await readFile(indexPath, 'utf8');
  const posts = await fetchAllPosts();

  await rm(POST_CACHE_DIR, { recursive: true, force: true });
  await rm(POST_PAGE_DIR, { recursive: true, force: true });
  await mkdir(POST_CACHE_DIR, { recursive: true });
  await mkdir(POST_PAGE_DIR, { recursive: true });

  let generated = 0;
  for (const post of posts) {
    const slug = normalizeSlug(post.slug);
    if (!isSafeSlug(slug)) {
      console.warn(`post-cache: skipped unsafe slug: ${JSON.stringify(post.slug)}`);
      continue;
    }
    if (RESERVED_SINGLE_SEGMENT_PATHS.has(slug.toLowerCase())) {
      console.warn(`post-cache: skipped reserved route: ${slug}`);
      continue;
    }

    const normalizedPost = { ...post, slug: undefined };
    delete normalizedPost.slug;

    const envelope = {
      schemaVersion: SCHEMA_VERSION,
      slug,
      path: `/${slug}`,
      generatedAt: new Date().toISOString(),
      post: normalizedPost,
    };

    await Promise.all([
      writeFile(path.join(POST_CACHE_DIR, `${slug}.json`), `${JSON.stringify(envelope)}\n`, 'utf8'),
      writeFile(
        path.join(POST_PAGE_DIR, `${slug}.html`),
        injectIntoIndex(indexHtml, { ...post, slug }, envelope),
        'utf8',
      ),
    ]);
    generated += 1;
  }

  if (generated === 0) {
    throw new Error('no post cache files were generated');
  }

  console.log(`post-cache: generated ${generated} HTML/JSON pair(s) into ${OUT_DIR}`);
}

main().catch((error) => {
  console.error('post-cache: failed', error);
  process.exitCode = 1;
});
