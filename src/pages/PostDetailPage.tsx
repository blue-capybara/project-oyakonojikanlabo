import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { request, gql } from 'graphql-request';
import Layout from '../components/Layout/Layout';
import Breadcrumb from '../components/Breadcrumb';
import useFavorite from '../hooks/useFavorite';
import WordPressContent from '../components/Post/WordPressContent';
import ArticleHeroImage from '../components/article/ArticleHeroImage';
import ArticleTitleBlock from '../components/article/ArticleTitleBlock';
import ArticleBodyContainer from '../components/article/ArticleBodyContainer';
import { getFeatureFlag } from '../config/featureFlags';
import { send404Event, sendRelatedPostClickEvent, sendShareClickEvent } from '../lib/ga';
import Seo from '../components/seo/Seo';
import GonePage from './GonePage';
import NotFoundPage from './NotFoundPage';
import { fetchUrlLifecycle } from '../lib/urlLifecycle';

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';
const relatedEndpoint = `${new URL(endpoint).origin}/wp-json/okjl/v1`;
const RELATED_POSTS_LIMIT = 6;

interface PostTag {
  name: string;
  slug?: string;
}

interface PostData {
  databaseId: number;
  title: string;
  date: string;
  content: string;
  excerpt?: string | null;
  customCss?: string | null;
  customJs?: string | null;
  featuredImage?: {
    node?: {
      sourceUrl?: string | null;
    } | null;
  } | null;
  tags: {
    nodes: PostTag[];
  } | null;
}

interface PostResponse {
  post: PostData | null;
}

interface RelatedPostRawItem {
  id?: number;
  title?: string;
  slug?: string;
  link?: string;
  thumbnail?: string;
  date?: string;
  source?: string;
}

interface RelatedPostsResponse {
  items?: RelatedPostRawItem[];
}

interface RelatedPost {
  id: number;
  title: string;
  slug: string;
  link: string;
  thumbnail: string;
  date: string;
  source: string;
}

const GET_POST_BY_SLUG = gql`
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      databaseId
      title
      date
      content
      excerpt
      customCss
      customJs
      featuredImage {
        node {
          sourceUrl
        }
      }
      tags {
        nodes {
          name
          slug
        }
      }
    }
  }
`;

const isValidDate = (value: string) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const formatDateJa = (value: string) => {
  if (!isValidDate(value)) {
    return '';
  }
  return new Date(value).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const normalizeRelatedPost = (item: RelatedPostRawItem): RelatedPost | null => {
  if (!item.id || item.id <= 0) {
    return null;
  }

  const title = (item.title ?? '').trim();
  if (!title) {
    return null;
  }

  return {
    id: item.id,
    title,
    slug: (item.slug ?? '').trim(),
    link: (item.link ?? '').trim(),
    thumbnail: (item.thumbnail ?? '').trim(),
    date: (item.date ?? '').trim(),
    source: (item.source ?? '').trim(),
  };
};

const buildRelatedPostPath = (relatedPost: RelatedPost) => {
  if (relatedPost.slug) {
    return `/${relatedPost.slug}`;
  }

  if (relatedPost.link) {
    try {
      const url = new URL(relatedPost.link);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      if (relatedPost.link.startsWith('/')) {
        return relatedPost.link;
      }
    }
  }

  return '/archive';
};

const PostDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [gone, setGone] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const showMembershipFeatures = getFeatureFlag('showMembershipFeatures');

  const {
    isFavorited,
    loading: favoriteLoading,
    processing: favoriteProcessing,
    error: favoriteError,
    toggleFavorite,
  } = useFavorite({ targetType: 'post', targetId: slug ?? null });

  const favoriteBusy = useMemo(
    () => favoriteLoading || favoriteProcessing,
    [favoriteLoading, favoriteProcessing],
  );

  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    if (!slug) {
      return 'https://oyakonojikanlabo.jp';
    }
    return `https://oyakonojikanlabo.jp/${slug}`;
  }, [slug]);

  const shareText = useMemo(() => {
    const title = post?.title ?? '親子の時間研究所の記事';
    return `${title} | 親子の時間研究所`;
  }, [post?.title]);

  const handleFavoriteClick = async () => {
    const result = await toggleFavorite();

    if (!result.success) {
      if (result.reason === 'auth-required') {
        alert('お気に入り機能を利用するにはログインが必要です。');
      } else if (result.reason === 'missing-target') {
        alert('お気に入り対象が正しく読み込まれていません。ページを再読み込みしてください。');
      } else {
        alert('お気に入りの更新に失敗しました。時間をおいて再度お試しください。');
      }
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleRelatedPostClick = (relatedPost: RelatedPost, position: number) => {
    sendRelatedPostClickEvent({
      currentPostSlug: slug ?? '',
      currentPostId: post?.databaseId,
      relatedPostId: relatedPost.id,
      relatedPostSlug: relatedPost.slug || undefined,
      relatedPostSource: relatedPost.source || undefined,
      position,
    });
  };

  const handleShareClick = (platform: 'x' | 'facebook' | 'line' | 'email') => {
    if (!shareUrl) return;

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    sendShareClickEvent({ platform, content_type: 'post', content_slug: slug ?? '' });

    switch (platform) {
      case 'x': {
        const xUrl = `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        window.open(xUrl, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'facebook': {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        window.open(facebookUrl, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'line': {
        const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedText}`;
        window.open(lineUrl, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'email': {
        const subject = encodeURIComponent(post?.title ?? '記事のご案内');
        const body = encodeURIComponent(`${shareText}\n${shareUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    if (!slug) {
      setError('記事のスラッグが指定されていません');
      setNotFound(true);
      setGone(false);
      setLoading(false);
      setRelatedPosts([]);
      setRelatedLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        setGone(false);

        const lifecycle = await fetchUrlLifecycle(endpoint, `/${slug}`);
        if (lifecycle?.status === 301 && lifecycle.redirectTo) {
          window.location.replace(lifecycle.redirectTo);
          return;
        }

        if (lifecycle?.status === 410) {
          setPost(null);
          setGone(true);
          setNotFound(false);
          return;
        }

        if (lifecycle?.status === 404) {
          setPost(null);
          setNotFound(true);
          setGone(false);
          return;
        }

        const data = await request<PostResponse>(endpoint, GET_POST_BY_SLUG, { slug });
        if (!data.post) {
          setError(null);
          setNotFound(true); // SEO: コンテンツ不存在が確定したときだけ 404 を GA に送る
          setGone(false);
          setPost(null);
        } else {
          setPost(data.post);
          setNotFound(false);
          setGone(false);
        }
      } catch (error) {
        console.error('記事取得エラー:', error);
        setError('記事の読み込み中にエラーが発生しました');
        setNotFound(false); // 通信エラーなどは 404 と区別し、SEO 計測しない
        setGone(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (!post?.databaseId) {
      setRelatedPosts([]);
      setRelatedLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchRelatedPosts = async () => {
      try {
        setRelatedLoading(true);

        const response = await fetch(
          `${relatedEndpoint}/related/${post.databaseId}?limit=${RELATED_POSTS_LIMIT}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`関連記事取得APIのレスポンスが不正です: ${response.status}`);
        }

        const data = (await response.json()) as RelatedPostsResponse;
        const normalizedRelatedPosts = (data.items ?? [])
          .map((item) => normalizeRelatedPost(item))
          .filter((item): item is RelatedPost => item !== null)
          .slice(0, RELATED_POSTS_LIMIT);

        if (!controller.signal.aborted) {
          setRelatedPosts(normalizedRelatedPosts);
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        console.error('関連記事の取得に失敗しました:', err);
        setRelatedPosts([]);
      } finally {
        if (!controller.signal.aborted) {
          setRelatedLoading(false);
        }
      }
    };

    fetchRelatedPosts();

    return () => {
      controller.abort();
    };
  }, [post?.databaseId]);

  useEffect(() => {
    if (notFound) {
      send404Event(); // SEO: 301 に逃げず 404 を Search Console に伝えるための専用イベント
    }
  }, [notFound]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-32 text-center">読み込み中...</div>
      </Layout>
    );
  }

  if (gone) {
    return (
      <GonePage
        title="この記事は公開を終了しました"
        message="この記事は削除または公開終了のため、現在は表示できません。"
        backTo="/archive"
        backLabel="記事一覧に戻る"
      />
    );
  }

  if (notFound) {
    return <NotFoundPage />;
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-gray-300 mb-4">ERROR</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">記事を読み込めませんでした</h2>
              <p className="text-gray-600 mb-8">{error}</p>
            </div>

            <div className="space-y-4">
              <Link
                to="/archive"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                記事一覧に戻る
              </Link>

              <div className="text-sm text-gray-500">
                <Link to="/" className="text-blue-600 hover:underline">
                  ホームに戻る
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto py-32 text-center">記事が見つかりませんでした。</div>
      </Layout>
    );
  }

  const tags = post.tags?.nodes ?? [];
  const ogImage = post.featuredImage?.node?.sourceUrl ?? undefined;
  const description = post.excerpt ?? post.content ?? undefined;
  const favoriteAction = showMembershipFeatures ? (
    <button
      type="button"
      onClick={handleFavoriteClick}
      disabled={favoriteBusy}
      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-full transition-colors ${
        favoriteBusy ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'
      }`}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        <i className={`${isFavorited ? 'ri-heart-fill text-red-500' : 'ri-heart-line'}`}></i>
      </div>
      <span>お気に入り</span>
    </button>
  ) : null;

  return (
    <Layout>
      <Seo
        title={post.title}
        description={description ?? undefined}
        ogType="article"
        ogImage={ogImage}
      />
      <Breadcrumb
        items={[
          { label: 'HOME', to: '/' },
          { label: '記事一覧', to: '/archive' },
          { label: post?.title ?? '読み込み中...' },
        ]}
      />

      <ArticleHeroImage src={post.featuredImage?.node?.sourceUrl} alt={post.title} />

      <ArticleTitleBlock title={post.title} dateText={formatDateJa(post.date)} />

      {/* 記事本文 */}
      <ArticleBodyContainer>
        {showMembershipFeatures && favoriteError && (
          <p className="mb-4 text-sm text-red-500" role="alert">
            {favoriteError}
          </p>
        )}
        {/* WordPressのHTMLをそのままレンダリング */}
        {post?.content ? (
          <WordPressContent
            html={post.content}
            customCss={post.customCss}
            customJs={post.customJs}
            className="post-content"
          />
        ) : (
          <p className="text-gray-500">この記事の内容は現在表示できません。</p>
        )}
      </ArticleBodyContainer>

      <section className="pb-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <Link to="/archive" className="flex items-center text-gray-600 hover:text-primary">
                <div className="w-5 h-5 flex items-center justify-center mr-1">
                  <i className="ri-arrow-left-line"></i>
                </div>
                <span>記事一覧に戻る</span>
              </Link>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-full transition-colors hover:bg-gray-50"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-share-line"></i>
                  </div>
                  <span>シェアする</span>
                </button>
                {favoriteAction}
              </div>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) =>
                  tag.slug ? (
                    <Link
                      key={`${tag.slug}-${index}`}
                      to={`/tag/${encodeURIComponent(tag.slug)}`}
                      className="inline-block bg-blue-100 text-blue-800 px-3 py-1 text-xs rounded-full hover:bg-blue-200 transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ) : (
                    <span
                      key={`${tag.name}-${index}`}
                      className="inline-block bg-blue-100 text-blue-800 px-3 py-1 text-xs rounded-full"
                    >
                      {tag.name}
                    </span>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {(relatedLoading || relatedPosts.length > 0) && (
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">次に読みたい記事</h2>

              {relatedLoading ? (
                <div className="py-10 flex items-center justify-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
                  <span>関連記事を読み込み中...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost, index) => (
                    <Link
                      key={relatedPost.id}
                      to={buildRelatedPostPath(relatedPost)}
                      onClick={() => handleRelatedPostClick(relatedPost, index + 1)}
                      className="group block h-full"
                    >
                      <div className="flex h-full flex-col bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
                        <img
                          src={relatedPost.thumbnail || '/default.jpg'}
                          alt={relatedPost.title}
                          className="w-full h-40 object-cover object-top"
                        />
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="text-lg font-bold line-clamp-2 mb-3">
                            {relatedPost.title}
                          </h3>
                          {relatedPost.date && (
                            <p className="mt-auto text-sm text-gray-500">
                              {formatDateJa(relatedPost.date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* シェアモーダル */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">シェアする</h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="閉じる"
              >
                <i className="ri-close-line ri-lg"></i>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleShareClick('x')}
                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Xでシェア"
              >
                <i className="ri-twitter-x-fill ri-lg"></i>
                <span>X</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareClick('facebook')}
                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Facebookでシェア"
              >
                <i className="ri-facebook-fill ri-lg text-[#1877F2]"></i>
                <span>Facebook</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareClick('line')}
                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="LINEでシェア"
              >
                <i className="ri-line-fill ri-lg text-[#06C755]"></i>
                <span>LINE</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareClick('email')}
                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="メールでシェア"
              >
                <i className="ri-mail-fill ri-lg text-gray-600"></i>
                <span>メール</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PostDetailPage;
