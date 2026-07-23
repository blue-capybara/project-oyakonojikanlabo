import React from 'react';
import { Link } from 'react-router-dom';
import { FeaturePostEntry, useFeaturePosts } from './useFeaturePosts';
import { withBase } from '../../utils/paths';

type FeatureSectionProps = {
  posts?: FeaturePostEntry[];
  loadingOverride?: boolean;
  errorOverride?: boolean;
};

const FeatureSection: React.FC<FeatureSectionProps> = ({
  posts,
  loadingOverride,
  errorOverride,
}) => {
  const { featurePosts, loading, error } = useFeaturePosts({
    skip: Boolean(posts),
  });

  const resolvedPosts = posts ?? featurePosts;
  const visiblePosts = resolvedPosts.slice(0, 4);
  const isLoading = loadingOverride ?? loading;
  const isError = errorOverride ?? Boolean(error);

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-gray-500">
          特集を読み込み中です…
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-red-600">
          特集の取得に失敗しました。時間をおいて再度お試しください。
        </div>
      </section>
    );
  }

  if (!resolvedPosts.length) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-gray-500">
          現在表示できる特集がありません。
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <h2 className="mb-6 text-center text-3xl font-bold">注目の特集</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {visiblePosts.map(({ featureId, post }) => (
            <Link
              key={featureId}
              to={`/${post.slug}`}
              className="group flex min-h-24 items-center gap-4 border-b border-gray-200 p-3 transition-colors duration-200 last:border-b-0 hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:min-h-28 sm:gap-6 sm:p-4"
            >
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-gray-100 sm:h-24 sm:w-40">
                <img
                  src={
                    post.featuredImage?.node?.sourceUrl ??
                    withBase('images/readdy/921de84646a0d38dfa688f1d826685e6.jpeg')
                  }
                  alt={post.title}
                  className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-6">
                <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900 group-hover:text-primary sm:line-clamp-1 sm:text-lg">
                  {post.title}
                </h3>
                <time
                  dateTime={post.date}
                  className="mt-2 block shrink-0 whitespace-nowrap text-xs text-gray-500 sm:mt-0 sm:text-sm"
                >
                  {new Date(post.date).toLocaleDateString('ja-JP')}
                </time>
              </div>
              <i
                className="ri-arrow-right-line shrink-0 text-xl text-primary transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              ></i>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
