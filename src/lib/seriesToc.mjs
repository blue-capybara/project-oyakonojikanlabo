export const SERIES_NAVIGATION_SLOT = 'ojl-series-navigation';
export const SERIES_NAVIGATION_SELECTOR = '[data-ojl-series-navigation]';

// WordPressの専用ブロックが出力する空の配置枠だけを扱います。
const slotPattern = () =>
  /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<div\b[^>]*\bdata-ojl-series-navigation(?=[\s=>])(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?[^>]*>\s*<\/div>/gi;
export const hasSeriesNavigationSlot = (html) =>
  [...html.matchAll(slotPattern())].some(([match]) => /^<div\b/i.test(match));
export const replaceSeriesNavigationSlots = (html, navigationHtml) => {
  let inserted = false;
  return html.replace(slotPattern(), (match) => {
    if (!/^<div\b/i.test(match)) return match;
    if (inserted) return '';
    inserted = true;
    return navigationHtml;
  });
};

export const formatSeriesScheduledDate = (value) =>
  new Date(value).toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
  });

export const seriesTocRows = (navigation, currentPost) => {
  if (!navigation?.series) return [];
  const rows = new Map();
  const episodes = navigation.series.episodes ?? [navigation.previous, navigation.next];
  for (const episode of episodes) {
    if (!episode || episode.preview) continue;
    rows.set(episode.episodeNumber, {
      type: 'episode',
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      path: episode.path,
      current: episode.episodeNumber === navigation.episodeNumber,
    });
  }
  const current = rows.get(navigation.episodeNumber);
  if (currentPost?.title || current) {
    rows.set(navigation.episodeNumber, {
      type: 'episode',
      episodeNumber: navigation.episodeNumber,
      title: currentPost?.title || current.title,
      path: null,
      current: true,
    });
  }
  for (const episode of navigation.series.upcomingEpisodes ?? []) {
    if (rows.has(episode.episodeNumber) || !Number.isFinite(Date.parse(episode.scheduledAt)))
      continue;
    rows.set(episode.episodeNumber, {
      type: 'upcoming',
      episodeNumber: episode.episodeNumber,
      scheduledAt: episode.scheduledAt,
    });
  }
  return [...rows.values()].sort((a, b) => a.episodeNumber - b.episodeNumber);
};
