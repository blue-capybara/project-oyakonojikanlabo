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

  if (!footer) {
    return (
      <nav
        aria-label="この記事の連載"
        className="my-5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
      >
        <div className="flex items-baseline gap-3">
          <span className="shrink-0 rounded bg-primary/20 px-2 py-0.5 text-xs font-semibold text-gray-700">
            連載
          </span>
          <Link
            to={target}
            className="min-w-0 flex-1 break-words text-sm font-semibold leading-relaxed text-gray-800 hover:underline focus-visible:outline-accent"
          >
            {navigation.series.title}
          </Link>
          <span className="shrink-0 text-xs text-gray-600">第{navigation.episodeNumber}回</span>
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="連載の前後の記事"
      className="my-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5"
    >
      <h2 className="text-base font-semibold text-gray-900">この連載のほかの記事を読む</h2>
      {(navigation.previous || navigation.next) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { label: '前の回', episode: navigation.previous },
            { label: '次の回', episode: navigation.next },
          ].map(({ label, episode }) =>
            episode ? (
              <Link
                key={label}
                to={episode.path}
                className="min-w-0 rounded-lg border border-primary/20 bg-white p-4 transition-colors hover:border-accent focus-visible:outline-accent"
              >
                <span className="block text-xs text-gray-600">
                  {label} · 第{episode.episodeNumber}回
                </span>{' '}
                <span className="mt-1 block break-words text-sm font-semibold leading-relaxed text-gray-900">
                  {episode.title}
                </span>
              </Link>
            ) : null,
          )}
        </div>
      )}
      <Link
        to={target}
        className="mt-3 inline-flex items-center gap-2 rounded text-sm font-semibold leading-relaxed text-gray-700 hover:underline focus-visible:outline-accent"
      >
        連載の紹介・すべての回を見る
        <span aria-hidden="true">→</span>
      </Link>
    </nav>
  );
}
