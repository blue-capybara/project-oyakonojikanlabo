import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { gql, request } from 'graphql-request';
import Layout from '../components/Layout/Layout';
import Breadcrumb from '../components/Breadcrumb';
import { getFeatureFlag } from '../config/featureFlags';
import Seo from '../components/seo/Seo';

const INITIAL_FETCH_COUNT = 12;
const LOAD_MORE_FETCH_COUNT = 12;
const TAG_PREVIEW_COUNT_DESKTOP = 14;

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
  categories: string[];
}

interface ArchiveArticlesResponse {
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
}

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';

const GET_ARCHIVE_POSTS = gql`
  query GetArchivePosts($first: Int!, $after: String, $search: String) {
    posts(first: $first, after: $after, where: { search: $search, orderby: { field: DATE, order: DESC } }) {
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
`;

const ArchivePage: React.FC = () => {
  const showMembershipFeatures = getFeatureFlag('showMembershipFeatures');
  const [selectedTag, setSelectedTag] = useState('すべて');
  const [sortBy, setSortBy] = useState('新着順');
  const [articles, setArticles] = useState<Article[]>([]);
  const [tagOptions, setTagOptions] = useState<string[]>(['すべて']);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isAllTagsOpen, setIsAllTagsOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pageInfo, setPageInfo] = useState<{ hasNextPage: boolean; endCursor: string | null }>({
    hasNextPage: false,
    endCursor: null,
  });

  const articlesRef = useRef<Article[]>([]);
  const searchRef = useRef<string>('');
  const [searchParams, setSearchParams] = useSearchParams();

  const updateTagOptions = useCallback((updatedArticles: Article[]) => {
    const tagSet = new Set<string>();
    updatedArticles.forEach((article) => {
      article.tags.forEach((tag) => tagSet.add(tag));
    });
    setTagOptions(['すべて', ...Array.from(tagSet)]);
  }, []);

  const fetchArticles = useCallback(
    async ({ after, append, search }: { after?: string | null; append?: boolean; search?: string } = {}) => {
      const isAppend = append ?? false;
      if (isAppend) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const providedSearch = search ?? undefined;
        const effectiveSearch = providedSearch !== undefined ? providedSearch : searchRef.current;
        const normalizedSearch = effectiveSearch?.trim() ?? '';

        const data = await request<ArchiveArticlesResponse>(endpoint, GET_ARCHIVE_POSTS, {
          first: isAppend ? LOAD_MORE_FETCH_COUNT : INITIAL_FETCH_COUNT,
          after: after ?? null,
          search: normalizedSearch === '' ? null : normalizedSearch,
        });

        const formattedArticles = data.posts.nodes.map((post): Article => {
          const postCategories = post.categories.nodes.map((cat) => cat.name).filter(Boolean);
          const postTags = post.tags.nodes.map((tag) => tag.name).filter(Boolean);
          const primaryCategory = postCategories[0] ?? 'その他';
          const normalizedTags = postTags.length > 0 ? postTags : ['タグ未設定'];

          return {
            id: post.id,
            slug: post.slug,
            title: post.title,
            category: primaryCategory,
            categories: postCategories,
            tags: normalizedTags,
            date: new Date(post.date).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            author: post.author?.node?.name ?? '親子の時間研究所',
            excerpt: post.excerpt.replace(/<[^>]+>/g, ''),
            image: post.featuredImage?.node?.sourceUrl ?? '/default.jpg',
            publishedAt: post.date,
          };
        });

        const updatedArticles = isAppend ? [...articlesRef.current, ...formattedArticles] : formattedArticles;

        articlesRef.current = updatedArticles;
        setArticles(updatedArticles);
        updateTagOptions(updatedArticles);
        setPageInfo({
          hasNextPage: data.posts.pageInfo.hasNextPage,
          endCursor: data.posts.pageInfo.endCursor,
        });
        if (!isAppend && providedSearch !== undefined) {
          searchRef.current = normalizedSearch;
        }
      } catch (err) {
        console.error('記事一覧の取得に失敗しました:', err);
        setError('記事の取得中にエラーが発生しました。時間をおいて再度お試しください。');
      } finally {
        if (isAppend) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [updateTagOptions],
  );

  useEffect(() => {
    const rawQuery = searchParams.get('q') ?? '';
    const normalized = rawQuery.trim();

    setSearchInput((prev) => (prev !== rawQuery ? rawQuery : prev));
    setSearchKeyword((prev) => (prev !== normalized ? normalized : prev));
    if (normalized !== searchRef.current) {
      setSelectedTag((prev) => (prev === 'すべて' ? prev : 'すべて'));
    }

    if (normalized === searchRef.current && articlesRef.current.length > 0) {
      return;
    }

    fetchArticles({ search: normalized });
  }, [searchParams, fetchArticles]);

  const filteredArticles = useMemo(() => {
    const articlesByTag =
      selectedTag === 'すべて' ? articles : articles.filter((article) => article.tags.includes(selectedTag));

    if (sortBy === '新着順') {
      return [...articlesByTag].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
    }

    if (sortBy === '古い順') {
      return [...articlesByTag].sort(
        (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
      );
    }

    return articlesByTag;
  }, [articles, selectedTag, sortBy]);

  const hasMore = pageInfo.hasNextPage;

  const handleLoadMore = () => {
    if (!pageInfo.hasNextPage || isLoadingMore) {
      return;
    }
    fetchArticles({ after: pageInfo.endCursor, append: true });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchInput.trim();

    if (trimmed === searchRef.current && !error) {
      return;
    }

    setSelectedTag('すべて');
    setSearchInput(trimmed);
    const params = new URLSearchParams(searchParams);
    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    setSearchParams(params, { replace: true });
  };

  const handleClearSearch = () => {
    if (!searchRef.current && searchInput === '' && !(searchParams.get('q') ?? '')) {
      return;
    }
    setSelectedTag('すべて');
    setSearchInput('');
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params, { replace: true });
  };

  const visibleDesktopTags = useMemo(() => {
    if (tagOptions.length <= TAG_PREVIEW_COUNT_DESKTOP) {
      return tagOptions;
    }
    return tagOptions.slice(0, TAG_PREVIEW_COUNT_DESKTOP);
  }, [tagOptions]);

  const hiddenTagCount = Math.max(tagOptions.length - visibleDesktopTags.length, 0);

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setIsAllTagsOpen(false);
  };

  const renderTagChip = (tag: string, size: 'sm' | 'md' = 'md') => {
    // 横方向の余白を広げて視認性を向上
    const base = size === 'sm' ? 'text-xs px-3.5 py-1.5' : 'text-sm px-5 py-2';
    return (
      <button
        type="button"
        key={tag}
        onClick={() => handleSelectTag(tag)}
        className={`rounded-full transition-colors whitespace-nowrap font-medium ${base} ${
          selectedTag === tag ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800 hover:bg-primary hover:text-white'
        }`}
      >
        {tag}
      </button>
    );
  };

  const handleOpenAllTags = () => {
    setIsAllTagsOpen(true);
    requestAnimationFrame(() => setIsModalVisible(true));
  };

  const handleCloseAllTags = () => {
    setIsModalVisible(false);
    setIsAllTagsOpen(false);
  };

  return (
    <Layout showNewsletter>
      <Seo
        title="記事一覧"
        description="親子の時間研究所の記事一覧ページです。最新記事から子育て・イベント情報までまとめてチェックできます。"
      />
      <Breadcrumb
        items={[
          { label: 'HOME', to: '/' },
          { label: '記事一覧' },
        ]}
      />

      <div className="container mx-auto px-4 pb-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-4">記事一覧</h1>
          <p className="text-gray-600">
            「親子の時間研究所」がお届けする、いろんな読みものたち。気になる記事があれば、どうぞのぞいてみてください。
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2 md:gap-4">
              <div className="relative">
                <select
                  value={selectedTag}
                  onChange={(e) => handleSelectTag(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-8"
                >
                  {tagOptions.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <i className="ri-arrow-down-s-line text-gray-400" />
                </div>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-8"
                >
                  <option value="新着順">新着順</option>
                  <option value="古い順">古い順</option>
                  <option value="人気順">人気順</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <i className="ri-arrow-down-s-line text-gray-400" />
                </div>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="記事を検索"
                aria-label="記事を検索"
                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                autoComplete="off"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-gray-400 pointer-events-none">
                <i className="ri-search-line" />
              </div>
              {(searchInput !== '' || searchKeyword !== '') && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="検索条件をクリア"
                >
                  <i className="ri-close-circle-line text-lg" />
                </button>
              )}
            </form>
          </div>

          <div className="mt-4 space-y-3">
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-500">タグで絞り込む</p>
                <button
                  type="button"
                  onClick={handleOpenAllTags}
                  className="text-sm text-primary font-semibold flex items-center gap-1"
                >
                  すべてのタグを見る
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>
              <div className="overflow-x-auto -mx-4 px-4">
                <div className="flex items-center gap-2 flex-nowrap py-2">
                  {tagOptions.map((tag) => renderTagChip(tag, 'sm'))}
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">タグで絞り込む</p>
                <button
                  type="button"
                  onClick={handleOpenAllTags}
                  className="text-sm text-primary font-semibold flex items-center gap-1"
                >
                  すべてのタグを見る
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleDesktopTags.map((tag) => renderTagChip(tag))}
                {hiddenTagCount > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenAllTags}
                    className="px-5 py-2 text-sm rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors font-medium"
                  >
                    +{hiddenTagCount}タグ
                  </button>
                )}
              </div>
            </div>

            {searchKeyword !== '' && (
              <p className="mt-3 text-sm text-gray-500">
                キーワード「{searchKeyword}」の検索結果を表示しています。
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
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
        ) : filteredArticles.length === 0 ? (
          <div className="py-16 text-center text-gray-600">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <i className="ri-article-line text-2xl text-gray-400" />
            </div>
            <p>条件に一致する記事が見つかりませんでした。</p>
            <p className="text-sm mt-2">別のタグやキーワードでお試しください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
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
                      {showMembershipFeatures && (
                        <button
                          type="button"
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="お気に入りに追加する"
                        >
                          <i className="ri-heart-line" />
                        </button>
                      )}
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

        {!isLoading && !error && hasMore && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
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

      {isAllTagsOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 md:px-6">
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 ${
              isModalVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={handleCloseAllTags}
            aria-hidden="true"
          />
          <div
            className={`relative w-full md:max-w-4xl bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[75vh] md:max-h-[70vh] overflow-y-auto p-6 md:p-8 transform-gpu transition-all duration-200 ease-out ${
              isModalVisible ? 'opacity-100 translate-y-0 md:scale-100' : 'opacity-0 translate-y-3 md:translate-y-0 md:scale-95'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">すべてのタグ</h3>
              <button
                type="button"
                onClick={handleCloseAllTags}
                className="text-gray-500 hover:text-gray-700"
                aria-label="タグリストを閉じる"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => renderTagChip(tag))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ArchivePage;
