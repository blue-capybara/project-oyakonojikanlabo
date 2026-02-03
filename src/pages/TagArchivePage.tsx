import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gql, request } from 'graphql-request';
import Layout from '../components/Layout/Layout';
import Breadcrumb from '../components/Breadcrumb';
import Seo from '../components/seo/Seo';
import NotFoundPage from './NotFoundPage';

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';

const INITIAL_FETCH_COUNT = 12;
const LOAD_MORE_FETCH_COUNT = 12;

interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  excerpt: string;
  image: string;
  publishedAt: string;
  tags: string[];
}

interface TagArchiveResponse {
  tag: {
    name: string;
    posts: {
      nodes: Array<{
        id: string;
        slug: string;
        title: string;
        excerpt: string;
        date: string;
        categories: {
          nodes: Array<{ name: string }>;
        };
        tags: {
          nodes: Array<{ name: string }>;
        };
        author?: {
          node?: {
            name?: string | null;
          } | null;
        } | null;
        featuredImage?: {
          node?: {
            sourceUrl?: string | null;
          } | null;
        } | null;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  } | null;
}

const GET_TAG_ARCHIVE = gql`
  query GetTagArchive($slug: ID!, $first: Int!, $after: String) {
    tag(id: $slug, idType: SLUG) {
      name
      posts(first: $first, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          id
          slug
          title
          excerpt
          date
          categories {
            nodes {
              name
            }
          }
          tags {
            nodes {
              name
            }
          }
          author {
            node {
              name
            }
          }
          featuredImage {
            node {
              sourceUrl
            }
          }
        }
      }
    }
  }
`;

const TagArchivePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tagName, setTagName] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pageInfo, setPageInfo] = useState<{ hasNextPage: boolean; endCursor: string | null }>({
    hasNextPage: false,
    endCursor: null,
  });

  const fetchTagPosts = useCallback(
    async ({ after, append }: { after?: string | null; append?: boolean } = {}) => {
      if (!slug) return;
      const isAppend = append ?? false;
      if (isAppend) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setNotFound(false);

      try {
        const data = await request<TagArchiveResponse>(endpoint, GET_TAG_ARCHIVE, {
          slug,
          first: isAppend ? LOAD_MORE_FETCH_COUNT : INITIAL_FETCH_COUNT,
          after: after ?? null,
        });

        if (!data.tag) {
          setNotFound(true);
          setTagName(null);
          setArticles([]);
          return;
        }

        setTagName(data.tag.name);

        const formattedArticles = data.tag.posts.nodes.map((post): Article => {
          const postCategories = post.categories.nodes.map((cat) => cat.name).filter(Boolean);
          const postTags = post.tags.nodes.map((tag) => tag.name).filter(Boolean);
          const primaryCategory = postCategories[0] ?? 'その他';
          const normalizedTags = postTags.length > 0 ? postTags : ['タグ未設定'];

          return {
            id: post.id,
            slug: post.slug,
            title: post.title,
            category: primaryCategory,
            tags: normalizedTags,
            date: new Date(post.date).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            author: post.author?.node?.name ?? '親子の時間研究所',
            excerpt: post.excerpt ? post.excerpt.replace(/<[^>]+>/g, '') : '',
            image: post.featuredImage?.node?.sourceUrl ?? '/default.jpg',
            publishedAt: post.date,
          };
        });

        setArticles((prev) => (isAppend ? [...prev, ...formattedArticles] : formattedArticles));
        setPageInfo({
          hasNextPage: data.tag.posts.pageInfo.hasNextPage,
          endCursor: data.tag.posts.pageInfo.endCursor,
        });
      } catch (err) {
        console.error('タグ記事の取得に失敗しました:', err);
        setError('タグ記事の取得中にエラーが発生しました。時間をおいて再度お試しください。');
      } finally {
        if (isAppend) {
          setIsLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [slug],
  );

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    fetchTagPosts({ after: null, append: false });
  }, [slug, fetchTagPosts]);

  const hasMore = pageInfo.hasNextPage;

  const pageTitle = useMemo(() => {
    if (tagName) return `#${tagName}`;
    if (slug) return `#${slug}`;
    return 'タグ一覧';
  }, [tagName, slug]);

  if (notFound) {
    return <NotFoundPage />;
  }

  return (
    <Layout showNewsletter>
      <Seo
        title={tagName ? `${tagName}のタグ一覧` : 'タグ一覧'}
        description={tagName ? `${tagName}のタグ記事一覧です。` : 'タグ記事一覧です。'}
      />
      <Breadcrumb
        items={[
          { label: 'HOME', to: '/' },
          { label: '記事一覧', to: '/archive' },
          { label: pageTitle },
        ]}
      />

      <section className="pt-32 pb-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-primary font-semibold">TAG</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">{pageTitle}</h1>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              <p className="mt-4">読み込み中です...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
              <div className="flex items-center gap-2">
                <i className="ri-error-warning-line" />
                <span>{error}</span>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="py-16 text-center text-gray-600">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <i className="ri-article-line text-2xl text-gray-400" />
              </div>
              <p>このタグの記事が見つかりませんでした。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  to={`/${article.slug}`}
                  className="group block h-full hover:cursor-pointer"
                >
                  <div className="flex h-full flex-col bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-48 object-cover object-top"
                    />
                    <div className="flex flex-col flex-1 p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2 flex-wrap">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span
                              key={`${article.id}-${tag}`}
                              className="inline-block bg-gray-100 text-gray-800 px-3 py-1 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2 line-clamp-1">{article.title}</h3>
                      <p className="text-gray-600 line-clamp-2">{article.excerpt}</p>
                      <div className="mt-auto flex justify-between items-center pt-4">
                        <span className="text-gray-500 text-sm">{article.date}</span>
                        <span className="text-gray-500 text-sm">{article.author}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && !error && hasMore && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={() => fetchTagPosts({ after: pageInfo.endCursor, append: true })}
                disabled={isLoadingMore}
                className={`px-8 py-3 rounded-button text-white transition-colors ${
                  isLoadingMore ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isLoadingMore ? '読み込み中…' : 'もっと見る'}
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default TagArchivePage;
