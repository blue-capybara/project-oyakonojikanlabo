import React from 'react';
import { useFeaturePosts, type FeaturePostEntry } from './useFeaturePosts';
import { seriesPath, type SeriesData } from '../../lib/series';

export type FeaturedContentEntry = {
  featureId: string;
  post: FeaturePostEntry['post'] | SeriesData;
  path: string;
  series: boolean;
};

export const useFeaturedContent = () => {
  const { featurePosts, loading, error } = useFeaturePosts();
  const [series, setSeries] = React.useState<SeriesData[]>([]);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch('/series-index.json', { signal: controller.signal })
      .then(async (response) =>
        response.ok && response.headers.get('content-type')?.includes('application/json')
          ? response.json()
          : null,
      )
      .then((cache) => {
        if (!controller.signal.aborted)
          setSeries(cache?.schemaVersion === 1 ? (cache.series ?? []) : []);
      })
      .catch(() => {
        /* 連載JSONを取得できなくても通常の特集を表示します。 */
      });
    return () => controller.abort();
  }, []);

  // 両方の表示枠で、掲載指定の連載を新しい順に先頭へ置きます。
  const items: FeaturedContentEntry[] = React.useMemo(
    () => [
      ...series
        .filter((item) => item.showInFeatured)
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((item) => ({
          featureId: `series-${item.databaseId}`,
          post: item,
          path: seriesPath(item.slug),
          series: true,
        })),
      ...featurePosts.map((item) => ({ ...item, path: `/${item.post.slug}`, series: false })),
    ],
    [featurePosts, series],
  );

  return { items, loading, error };
};
