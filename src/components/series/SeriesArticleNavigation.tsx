import { Link } from 'react-router-dom';
import { SeriesNavigationData, seriesPath } from '../../lib/series';

export default function SeriesArticleNavigation({
  navigation,
  footer = false,
}: {
  navigation?: SeriesNavigationData | null;
  footer?: boolean;
}) {
  if (!navigation?.series) return null;
  const target = navigation.series.previewPath ?? seriesPath(navigation.series.slug);
  return (
    <nav
      aria-label={footer ? '連載の前後の記事' : 'この記事の連載'}
      className="my-6 rounded-xl border border-primary/20 bg-primary/5 p-5"
    >
      <Link to={target} className="font-bold text-primary hover:underline">
        {navigation.series.title}
      </Link>
      <p className="mt-1 text-sm text-gray-600">第{navigation.episodeNumber}回</p>
      {footer && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['前の回', navigation.previous],
              ['次の回', navigation.next],
            ].map(([label, episode]) =>
              typeof episode === 'object' && episode ? (
                <Link
                  key={String(label)}
                  to={episode.path}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:border-primary"
                >
                  <span className="block text-xs text-gray-500">
                    {String(label)} · 第{episode.episodeNumber}回
                  </span>
                  <span className="mt-1 block font-semibold">{episode.title}</span>
                </Link>
              ) : null,
            )}
          </div>
          <Link
            to={target}
            className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
          >
            連載の紹介・すべての回を見る →
          </Link>
        </>
      )}
    </nav>
  );
}
