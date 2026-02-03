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
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">特集</h2>
        <div className="grid grid-cols-1 min-[600px]:grid-cols-2 lg:grid-cols-3 gap-8">
          {resolvedPosts.map(({ featureId, post }) => (
            <Link
              key={featureId}
              to={`/${post.slug}`}
              className="bg-white rounded-lg shadow-md overflow-hidden block h-full transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="w-full h-48 overflow-hidden bg-gray-100">
                <img
                  src={
                    post.featuredImage?.node?.sourceUrl ??
                    withBase('images/readdy/921de84646a0d38dfa688f1d826685e6.jpeg')
                  }
                  alt={post.title}
                  className="w-full h-full object-cover object-top transition-transform duration-300 hover:scale-105"
                />
              </div>
              <div className="p-6">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 text-xs rounded-full mb-3">
                  特集
                </span>
                <h3
                  className="text-xl font-bold mb-2 leading-tight"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  公開日: {new Date(post.date).toLocaleDateString('ja-JP')}
                </p>
                <span className="text-primary font-medium flex items-center">
                  詳しく見る
                  <div className="w-5 h-5 flex items-center justify-center ml-1">
                    <i className="ri-arrow-right-line"></i>
                  </div>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
