import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { rawRequest } from 'graphql-request';
import Layout from '../components/Layout/Layout';
import SeriesDetail from '../components/series/SeriesDetail';
import NotFoundPage from './NotFoundPage';
import { SeriesData, SERIES_FIELDS, fetchSeriesCache, readEmbeddedSeries } from '../lib/series';

export default function SeriesDetailPage() {
  const { slug = '' } = useParams();
  const [series, setSeries] = useState<SeriesData | null>(() => readEmbeddedSeries(slug));
  const [loading, setLoading] = useState(!series);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setSeries(null);
    (async () => {
      let cached = readEmbeddedSeries(slug);
      if (!cached) {
        try {
          cached = await fetchSeriesCache(slug, controller.signal);
        } catch (error) {
          if (controller.signal.aborted) throw error;
        }
      }
      if (cached) return cached;
      const response = await rawRequest<{ ojlSeries: SeriesData | null }>(
        import.meta.env.VITE_WP_GRAPHQL_ENDPOINT || 'https://cms.oyakonojikanlabo.jp/graphql',
        `query SeriesDetail($slug: ID!) { ojlSeries(id: $slug, idType: SLUG) { ${SERIES_FIELDS} } }`,
        { slug },
      );
      return response.data.ojlSeries?.seriesStatus ? response.data.ojlSeries : null;
    })()
      .then((value) => {
        if (!controller.signal.aborted) setSeries(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);
  if (loading)
    return (
      <Layout>
        <p className="py-24 text-center">連載を読み込み中です…</p>
      </Layout>
    );
  if (error)
    return (
      <Layout>
        <p role="alert" className="py-24 text-center">
          連載を取得できませんでした。時間をおいて再度お試しください。
        </p>
      </Layout>
    );
  if (!series) return <NotFoundPage />;
  return (
    <Layout>
      <SeriesDetail series={series} />
    </Layout>
  );
}
