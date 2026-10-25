import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import Breadcrumb from '../Breadcrumb';
import ArticleHeroImage from '../article/ArticleHeroImage';
import WordPressContent from '../Post/WordPressContent';
import { SeriesData, seriesPath, seriesStructuredData } from '../../lib/series';
import { shouldNoIndex } from '../../utils/seo';

export default function SeriesDetail({
  series,
  preview = false,
}: {
  series: SeriesData;
  preview?: boolean;
}) {
  const episodes = [...series.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
  const first = episodes.find((episode) => episode.episodeNumber === 1);
  return (
    <>
      <Seo
        title={series.title}
        description={series.excerpt || series.content || undefined}
        ogImage={series.featuredImage?.node?.sourceUrl || undefined}
        canonical={seriesPath(series.slug)}
        noindex={shouldNoIndex({ force: preview })}
      />
      {!preview && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(seriesStructuredData(series)).replace(/</g, '\\u003c')}
          </script>
        </Helmet>
      )}
      <Breadcrumb items={[{ label: 'HOME', to: '/' }, { label: series.title }]} />
      <ArticleHeroImage src={series.featuredImage?.node?.sourceUrl} alt={series.title} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {preview && (
          <p className="mb-6 rounded-lg bg-amber-50 p-4 text-amber-900">
            公開前のプレビューです。連載設定は保存済みの内容を表示します。
          </p>
        )}
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">
            連載コラム
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1">
            {series.seriesStatus === 'completed' ? '完結' : '連載中'}
          </span>
          {series.totalEpisodes !== null && (
            <span className="px-2 py-1">全{series.totalEpisodes}回</span>
          )}
          <span className="px-2 py-1">{series.publishedCount}回公開</span>
        </div>
        <h1 className="text-3xl font-bold leading-snug sm:text-4xl">{series.title}</h1>
        {series.content && (
          <div className="my-8">
            <WordPressContent html={series.content} className="post-content" />
          </div>
        )}
        {first && (
          <Link
            to={first.path}
            className="my-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white hover:opacity-90"
          >
            第1回から読む →
          </Link>
        )}
        <h2 className="mb-5 mt-8 text-2xl font-bold">連載の記事</h2>
        {!episodes.length && (
          <p className="rounded-lg bg-gray-50 p-6 text-gray-600">記事の公開を準備しています。</p>
        )}
        <ol className="grid gap-4">
          {episodes.map((episode) => (
            <li key={episode.databaseId}>
              <Link
                to={episode.path}
                className="group flex gap-4 rounded-xl border border-gray-200 p-4 transition-colors hover:border-primary hover:bg-primary/5 sm:gap-6"
              >
                {episode.imageUrl && (
                  <img
                    src={episode.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-20 w-24 shrink-0 rounded-lg object-cover sm:h-28 sm:w-40"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-primary">
                    第{episode.episodeNumber}回{episode.preview ? '（未公開・プレビュー）' : ''}
                  </p>
                  <h3 className="mt-1 text-base font-bold leading-relaxed group-hover:text-primary sm:text-xl">
                    {episode.title}
                  </h3>
                  {!episode.preview && (
                    <time
                      dateTime={episode.publishedAt}
                      className="mt-2 block text-xs text-gray-500 sm:text-sm"
                    >
                      {new Date(episode.publishedAt).toLocaleDateString('ja-JP')}
                    </time>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>
        {series.upcomingEpisodes.length > 0 && (
          <div className="mt-6 rounded-lg bg-gray-50 p-5 text-sm text-gray-600">
            {series.upcomingEpisodes.map((episode) => (
              <p key={episode.episodeNumber}>
                第{episode.episodeNumber}回：
                {new Date(episode.scheduledAt).toLocaleDateString('ja-JP')} 公開予定
              </p>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
