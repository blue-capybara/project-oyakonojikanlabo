import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const SITE_ORIGIN = process.env.SITE_URL ?? 'https://oyakonojikanlabo.jp';
const GRAPHQL_ENDPOINT =
  process.env.WP_GRAPHQL_ENDPOINT ?? 'https://cms.oyakonojikanlabo.jp/graphql';
const OUT_DIR = path.resolve(process.cwd(), process.env.BUILD_OUT_DIR ?? 'dist');
const POST_CACHE_DIR = path.join(OUT_DIR, 'post-cache');
const POST_PAGE_DIR = path.join(OUT_DIR, 'post-pages');
const SERIES_CACHE_DIR = path.join(OUT_DIR, 'series-cache');
const SERIES_PAGE_DIR = path.join(OUT_DIR, 'series-pages');
const PAGE_SIZE = 20;
const SCHEMA_VERSION = 1;
const RESERVED_SINGLE_SEGMENT_PATHS = new Set([
  'about',
  'and-the-institute-of-time-for-parents',
  'archive',
  'contact',
  'contact-pico',
  'contact-us',
  'company-profile',
  'culture-school',
  'digital-honor-award-memorial-campaign',
  'event',
  'login',
  'monzukuri-bu',
  'mypage',
  'notationbased',
  'our-products-lineup',
  'pico',
  'preview',
  'privacy',
  'privacy-policy',
  'search',
  'signup',
  'series',
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
        seriesNavigation { episodeNumber series { databaseId slug title } }
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

const SERIES_QUERY = `
  query CachedSeries($after: String, $pageSize: Int!) {
    ojlSeriesCollection(first: $pageSize, after: $after, where: { status: PUBLISH }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId slug title date modified content excerpt
        featuredImage { node { sourceUrl } }
        seriesStatus totalEpisodes showInFeatured publishedCount
        episodes { databaseId episodeNumber title path publishedAt imageUrl }
        upcomingEpisodes { episodeNumber scheduledAt }
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
    .replace(/\s*\[&hellip;\]\s*/gi, '…')
    .replace(/&hellip;/gi, '…')
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

const fetchGraphQL = async (variables, query = POSTS_QUERY, key = 'posts', attempt = 1) => {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message).join('; '));
    }

    const posts = payload.data?.[key];
    if (!posts || !Array.isArray(posts.nodes)) {
      throw new Error(`${key} connection is missing`);
    }

    return posts;
  } catch (error) {
    if (attempt >= 3) throw error;
    const delay = attempt * 750;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchGraphQL(variables, query, key, attempt + 1);
  }
};

const fetchAllPosts = async (query = POSTS_QUERY, key = 'posts') => {
  const posts = [];
  let after = null;

  while (true) {
    const connection = await fetchGraphQL({ after, pageSize: PAGE_SIZE }, query, key);
    posts.push(...connection.nodes);
    console.log(`post-cache: fetched ${posts.length} ${key}`);

    if (!connection.pageInfo?.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }

  return posts;
};

const decodedSlug = (value) => {
  try {
    return decodeURIComponent(normalizeSlug(value));
  } catch {
    return '';
  }
};
export const seriesPath = (slug) => `/series/${encodeURIComponent(decodedSlug(slug))}`;

/** 公開GraphQLから受け取った項目だけを採用し、記事との対応を全件スナップショットで確認します。 */
export const normalizeSeries = (rows, posts) => {
  const byId = new Map(posts.map((post) => [post.databaseId, post]));
  return rows
    .filter(
      (row) =>
        ['ongoing', 'completed'].includes(row.seriesStatus) &&
        row.publishedCount !== null &&
        isSafeSlug(decodedSlug(row.slug)),
    )
    .map((row) => {
      const episodes = (row.episodes ?? [])
        .filter((episode) => {
          const post = byId.get(episode.databaseId);
          return (
            post &&
            post.seriesNavigation?.series?.databaseId === row.databaseId &&
            post.seriesNavigation.episodeNumber === episode.episodeNumber
          );
        })
        .map((episode) => ({
          databaseId: episode.databaseId,
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          path: episode.path,
          publishedAt: episode.publishedAt,
          imageUrl: episode.imageUrl ?? null,
        }))
        .sort((a, b) => a.episodeNumber - b.episodeNumber);
      return {
        databaseId: row.databaseId,
        slug: decodedSlug(row.slug),
        title: row.title,
        content: row.content ?? '',
        excerpt: row.excerpt ?? '',
        date: row.date,
        modified: row.modified,
        featuredImage: row.featuredImage ?? null,
        seriesStatus: row.seriesStatus,
        totalEpisodes: row.totalEpisodes ?? null,
        showInFeatured: row.showInFeatured === true,
        publishedCount: episodes.length,
        episodes,
        upcomingEpisodes: (row.upcomingEpisodes ?? []).map(({ episodeNumber, scheduledAt }) => ({
          episodeNumber,
          scheduledAt,
        })),
      };
    });
};

export const attachSeriesNavigation = (posts, series) =>
  posts.map((post) => {
    const navigation = post.seriesNavigation;
    const parent = series.find((item) => item.databaseId === navigation?.series?.databaseId);
    const number = navigation?.episodeNumber;
    if (
      !parent ||
      !parent.episodes.some(
        (episode) => episode.databaseId === post.databaseId && episode.episodeNumber === number,
      )
    ) {
      return { ...post, seriesNavigation: null };
    }
    return {
      ...post,
      seriesNavigation: {
        episodeNumber: number,
        series: { databaseId: parent.databaseId, slug: parent.slug, title: parent.title },
        previous: parent.episodes.find((episode) => episode.episodeNumber === number - 1) ?? null,
        next: parent.episodes.find((episode) => episode.episodeNumber === number + 1) ?? null,
      },
    };
  });

const seriesNavigationHtml = (navigation, footer = false) => {
  if (!navigation?.series) return '';
  const links = footer
    ? [navigation.previous, navigation.next]
        .filter(Boolean)
        .map(
          (episode) =>
            `<p><a href="${escapeHtml(episode.path)}">第${episode.episodeNumber}回 ${escapeHtml(episode.title)}</a></p>`,
        )
        .join('')
    : '';
  return `<nav aria-label="連載"><a href="${escapeHtml(seriesPath(navigation.series.slug))}">${escapeHtml(navigation.series.title)}</a> · 第${navigation.episodeNumber}回${links}</nav>`;
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
          ${seriesNavigationHtml(post.seriesNavigation)}
          <h1>${escapeHtml(post.title)}</h1>
          ${dateText ? `<p class="ojl-prerender__date">${escapeHtml(dateText)}</p>` : ''}
        </header>
        <div class="ojl-prerender__content">${content}</div>
        ${seriesNavigationHtml(post.seriesNavigation, true)}
      </article>
    </main>`;
};

export const injectIntoIndex = (indexHtml, post, envelope, series = false) => {
  const canonicalUrl = new URL(
    series ? seriesPath(post.slug) : `/${encodeURIComponent(post.slug)}`,
    SITE_ORIGIN,
  ).toString();
  const description = stripHtml(post.excerpt || post.content).slice(0, 180);
  const title = `${post.title}｜親子の時間研究所`;
  const heroUrl = post.featuredImage?.node?.sourceUrl ?? '';

  const seoMarkup = `
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="${series ? 'website' : 'article'}" />
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
  const structuredData = series
    ? `<script type="application/ld+json">${serializeForHtml({
        '@context': 'https://schema.org',
        '@type': 'CreativeWorkSeries',
        name: post.title,
        url: canonicalUrl,
        ...(heroUrl ? { image: heroUrl } : {}),
        hasPart: post.episodes.map((episode) => ({
          '@type': 'Article',
          name: episode.title,
          position: episode.episodeNumber,
          url: new URL(episode.path, SITE_ORIGIN).toString(),
        })),
      })}</script>`
    : '';
  // Reactへの切り替え・SPA遷移で、前ページのcanonicalやOGPをHelmetが置き換えられるようにします。
  html = html.replace(
    '</head>',
    `${seoMarkup.replace(/<(meta|link) /g, '<$1 data-rh="true" ')}\n${structuredData.replace('<script ', '<script data-rh="true" ')}\n</head>`,
  );

  const rootStart = html.indexOf('  <div id="root">');
  const rootEndMarker = '  <script>\n    if (window.performance';
  const rootEnd = html.indexOf(rootEndMarker, rootStart);
  if (rootStart < 0 || rootEnd < 0) {
    throw new Error('built index root markers were not found');
  }

  const embeddedData = `  <script id="ojl-${series ? 'series' : 'post'}-cache" type="application/json">${serializeForHtml(envelope)}</script>\n`;
  html = `${html.slice(0, rootStart)}  <div id="root">${series ? buildSeriesSnapshot(post) : buildSnapshotBody(post)}\n  </div>\n${embeddedData}${html.slice(rootEnd)}`;

  return html;
};

const buildSeriesSnapshot = (series) => {
  const first = series.episodes.find((episode) => episode.episodeNumber === 1);
  return `<main class="ojl-prerender" data-prerendered-series="true">
    ${series.featuredImage?.node?.sourceUrl ? `<img src="${escapeHtml(series.featuredImage.node.sourceUrl)}" alt="" style="max-width:100%;height:auto">` : ''}
    <h1>${escapeHtml(series.title)}</h1>
    <p>${series.seriesStatus === 'completed' ? '完結' : '連載中'}${series.totalEpisodes ? ` · 全${series.totalEpisodes}回` : ''} · ${series.publishedCount}回公開</p>
    <div class="ojl-prerender__content">${stripExecutableScripts(series.content)}</div>
    ${first ? `<p><a href="${escapeHtml(first.path)}">第1回から読む</a></p>` : '<p>記事の公開を準備しています。</p>'}
    <h2>連載の記事</h2><ol>${series.episodes.map((episode) => `<li><a href="${escapeHtml(episode.path)}">第${episode.episodeNumber}回 ${escapeHtml(episode.title)}</a>${episode.imageUrl ? `<img src="${escapeHtml(episode.imageUrl)}" alt="" loading="lazy" style="max-width:160px;height:auto">` : ''}<time datetime="${escapeHtml(episode.publishedAt)}">${escapeHtml(formatDateJa(episode.publishedAt))}</time></li>`).join('')}</ol>
    ${series.upcomingEpisodes.map((episode) => `<p>第${episode.episodeNumber}回：${escapeHtml(formatDateJa(episode.scheduledAt))} 公開予定</p>`).join('')}
  </main>`;
};

async function main() {
  const indexPath = path.join(OUT_DIR, 'index.html');
  const indexHtml = await readFile(indexPath, 'utf8');
  const [rawPosts, rawSeries] = await Promise.all([
    fetchAllPosts(),
    fetchAllPosts(SERIES_QUERY, 'ojlSeriesCollection'),
  ]);
  const publicPosts = rawPosts.filter(
    (post) =>
      isSafeSlug(normalizeSlug(post.slug)) &&
      !RESERVED_SINGLE_SEGMENT_PATHS.has(normalizeSlug(post.slug).toLowerCase()),
  );
  const series = normalizeSeries(rawSeries, publicPosts);
  const posts = attachSeriesNavigation(publicPosts, series);

  await rm(POST_CACHE_DIR, { recursive: true, force: true });
  await rm(POST_PAGE_DIR, { recursive: true, force: true });
  await mkdir(POST_CACHE_DIR, { recursive: true });
  await mkdir(POST_PAGE_DIR, { recursive: true });
  for (const directory of [SERIES_CACHE_DIR, SERIES_PAGE_DIR]) {
    await rm(directory, { recursive: true, force: true });
    await mkdir(directory, { recursive: true });
  }
  for (const item of series) {
    const envelope = {
      schemaVersion: 1,
      slug: item.slug,
      path: seriesPath(item.slug),
      generatedAt: new Date().toISOString(),
      series: item,
    };
    await writeFile(
      path.join(SERIES_CACHE_DIR, `${item.slug}.json`),
      JSON.stringify(envelope) + '\n',
    );
    await writeFile(
      path.join(SERIES_PAGE_DIR, `${item.slug}.html`),
      injectIntoIndex(indexHtml, item, envelope, true),
    );
  }
  await writeFile(
    path.join(OUT_DIR, 'series-index.json'),
    JSON.stringify({
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      series: series.map(({ content, episodes, upcomingEpisodes, ...summary }) => summary),
    }) + '\n',
  );

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

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  main().catch((error) => {
    console.error('post-cache: failed', error);
    process.exitCode = 1;
  });
