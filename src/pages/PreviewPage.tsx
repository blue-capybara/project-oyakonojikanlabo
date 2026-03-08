import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Breadcrumb from '../components/Breadcrumb';
import WordPressContent from '../components/Post/WordPressContent';
import { usePreviewPost } from '../hooks/usePreviewPost';
import Seo from '../components/seo/Seo';
import { shouldNoIndex } from '../utils/seo';

/**
 * 投稿詳細ページの見た目に寄せたプレビュー画面。
 * p クエリのみで記事を取得し、アイキャッチも表示する。
 */
const PreviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('p');
  const { data, loading, error } = usePreviewPost(postId);
  const noindex = shouldNoIndex({ force: true });

  const isInvalid = !postId;
  const featuredImageUrl =
    data?.featuredImageUrl ??
    data?.featured_image_url ??
    data?.featuredImage?.sourceUrl ??
    data?.featured_image?.source_url ??
    null;

  return (
    <Layout>
      <Seo
        title={data?.title ?? 'プレビュー'}
        description={data?.excerpt ?? undefined}
        ogType="article"
        noindex={noindex}
      />
      <Breadcrumb items={[{ label: 'HOME', to: '/' }, { label: 'プレビュー' }]} />

      {/* ヘッダー */}
      <div className="container mx-auto px-4 pt-16 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary text-lg">
              <i className="ri-eye-line" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-gray-500">WordPress プレビュー</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {data?.title ?? 'この記事の下書きプレビュー'}
              </h1>
            </div>
          </div>

          {!isInvalid && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-3 py-1 font-semibold">
                プレビュー中
              </span>
              {data?.status && data.status !== 'publish' && (
                <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 font-semibold">
                  {data.status}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* クエリ不足 */}
      {isInvalid && (
        <div className="container mx-auto px-4 pb-12">
          <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 md:p-8">
            <div className="flex gap-2 items-start">
              <i className="ri-error-warning-line text-lg mt-0.5" aria-hidden />
              <div>
                <p className="font-semibold">URLが不正です</p>
                <p className="text-sm mt-1">
                  `p` クエリ（投稿ID）が必要です。もう一度プレビューURLを確認してください。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ローディング／エラー */}
      {!isInvalid && (
        <>
          {loading && (
            <div className="container mx-auto px-4 pb-16">
              <div className="flex flex-col items-center py-16 text-gray-500">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
                  aria-label="loading"
                />
                <p className="mt-4">プレビューを読み込んでいます...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="container mx-auto px-4 pb-12">
              <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 md:p-8">
                <div className="flex gap-2 items-start">
                  <i className="ri-error-warning-line text-lg mt-0.5" aria-hidden />
                  <div>
                    <p className="font-semibold">取得に失敗しました</p>
                    <p className="text-sm mt-1 break-all">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* アイキャッチ画像（投稿詳細に近い大きさで表示） */}
              {featuredImageUrl && (
                <div className="w-full h-[50vh] md:h-[60vh] overflow-hidden relative">
                  <img
                    src={featuredImageUrl}
                    alt={data.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* 本文 */}
              <section className="py-12">
                <div className="container mx-auto px-4">
                  <div className="max-w-3xl mx-auto">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 p-4 text-sm mb-6">
                      これはプレビュー表示です。公開前の記事内容を確認できます。
                    </div>

                    {data.content ? (
                      <WordPressContent html={data.content} className="post-content" />
                    ) : (
                      <p className="text-gray-500">この記事の内容は現在表示できません。</p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {!loading && !error && !data && (
            <div className="container mx-auto px-4 pb-12">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-6 md:p-8 max-w-4xl mx-auto">
                <div className="flex gap-2 items-start">
                  <i className="ri-information-line text-lg mt-0.5" aria-hidden />
                  <div>
                    <p className="font-semibold">記事が見つかりません</p>
                    <p className="text-sm mt-1">記事IDが逆か、まだ作成中の可能性があります。</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default PreviewPage;
