import { Link } from 'react-router-dom';
import { SeriesNavigationData, seriesPath } from '../../lib/series';
import { formatSeriesScheduledDate, seriesTocRows } from '../../lib/seriesToc.mjs';

export default function SeriesArticleNavigation({
  navigation,
  footer = false,
  currentPost,
}: {
  navigation?: SeriesNavigationData | null;
  footer?: boolean;
  currentPost?: { title: string };
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
      aria-label="連載の目次"
      className="my-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5"
    >
      <h2 className="text-base font-semibold leading-relaxed text-gray-900">
        {navigation.series.title}
      </h2>
      <ol className="mt-3 space-y-1">
        {seriesTocRows(navigation, currentPost).map((row) => (
          <li key={row.episodeNumber}>
            {row.type === 'upcoming' ? (
              <div className="flex flex-wrap gap-x-2 px-3 py-3 text-sm leading-relaxed text-gray-600">
                <span>第{row.episodeNumber}回</span>
                <span>
                  <time dateTime={row.scheduledAt}>
                    {formatSeriesScheduledDate(row.scheduledAt)}
                  </time>
                  公開予定
                </span>
              </div>
            ) : row.current ? (
              <div
                aria-current="page"
                className="rounded-lg bg-primary/20 px-3 py-3 text-sm font-semibold leading-relaxed text-gray-800"
              >
                第{row.episodeNumber}回 {row.title}
                <span className="ml-2 inline-block rounded bg-white px-2 py-0.5 text-xs text-gray-700">
                  この記事
                </span>
              </div>
            ) : (
              <Link
                to={row.path!}
                className="flex gap-2 rounded-lg px-3 py-3 text-sm leading-relaxed text-gray-800 hover:bg-white hover:underline focus-visible:outline-accent"
              >
                <span aria-hidden="true" className="shrink-0 text-accent">
                  ▶
                </span>
                <span className="min-w-0 break-words">
                  第{row.episodeNumber}回 {row.title}
                </span>
              </Link>
            )}
          </li>
        ))}
      </ol>
      <Link
        to={target}
        className="mt-3 inline-flex items-center gap-2 rounded text-sm font-semibold leading-relaxed text-gray-700 hover:underline focus-visible:outline-accent"
      >
        連載の紹介を見る
        <span aria-hidden="true">→</span>
      </Link>
    </nav>
  );
}
