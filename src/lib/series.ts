export interface SeriesEpisode {
  databaseId: number;
  episodeNumber: number;
  title: string;
  path: string;
  publishedAt: string;
  imageUrl?: string | null;
  preview?: boolean;
}

export interface SeriesData {
  databaseId: number;
  slug: string;
  title: string;
  content?: string | null;
  excerpt?: string | null;
  date: string;
  modified?: string;
  featuredImage?: { node?: { sourceUrl?: string | null } | null } | null;
  seriesStatus: 'ongoing' | 'completed';
  totalEpisodes: number | null;
  showInFeatured: boolean;
  publishedCount: number;
  episodes: SeriesEpisode[];
  upcomingEpisodes: { episodeNumber: number; scheduledAt: string }[];
}

export interface SeriesNavigationData {
  episodeNumber: number;
  series: Pick<SeriesData, 'databaseId' | 'slug' | 'title'> & { previewPath?: string };
  previous?: SeriesEpisode | null;
  next?: SeriesEpisode | null;
}

export const SERIES_FIELDS = `
  databaseId slug title content excerpt date modified
  featuredImage { node { sourceUrl } }
  seriesStatus totalEpisodes showInFeatured publishedCount
  episodes { databaseId episodeNumber title path publishedAt imageUrl }
  upcomingEpisodes { episodeNumber scheduledAt }
`;

export const SERIES_NAVIGATION_FIELDS = `
  seriesNavigation {
    episodeNumber
    series { databaseId slug title }
    previous { databaseId episodeNumber title path publishedAt imageUrl }
    next { databaseId episodeNumber title path publishedAt imageUrl }
  }
`;

export const seriesPath = (slug: string) => {
  try {
    return `/series/${encodeURIComponent(decodeURIComponent(slug))}`;
  } catch {
    return `/series/${encodeURIComponent(slug)}`;
  }
};

const normalizeSlug = (slug: string) => {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
};

export const readEmbeddedSeries = (slug: string): SeriesData | null => {
  const text = document.getElementById('ojl-series-cache')?.textContent;
  if (!text) return null;
  try {
    const cache = JSON.parse(text);
    return cache.schemaVersion === 1 &&
      cache.slug === normalizeSlug(slug) &&
      cache.series?.seriesStatus
      ? cache.series
      : null;
  } catch {
    return null;
  }
};

export const fetchSeriesCache = async (
  slug: string,
  signal: AbortSignal,
): Promise<SeriesData | null> => {
  const response = await fetch(`/series-cache/${encodeURIComponent(normalizeSlug(slug))}.json`, {
    signal,
  });
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json'))
    return null;
  const cache = await response.json();
  return cache.schemaVersion === 1 &&
    cache.slug === normalizeSlug(slug) &&
    cache.series?.seriesStatus
    ? cache.series
    : null;
};

export const seriesStructuredData = (series: SeriesData) => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWorkSeries',
  name: series.title,
  url: `https://oyakonojikanlabo.jp${seriesPath(series.slug)}`,
  ...(series.featuredImage?.node?.sourceUrl ? { image: series.featuredImage.node.sourceUrl } : {}),
  hasPart: series.episodes
    .filter((episode) => !episode.preview)
    .map((episode) => ({
      '@type': 'Article',
      name: episode.title,
      position: episode.episodeNumber,
      url: `https://oyakonojikanlabo.jp${episode.path}`,
    })),
});
