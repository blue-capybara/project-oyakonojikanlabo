import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Layout/Header';
import Breadcrumb from '../components/Breadcrumb';
import { searchApi, SearchResult } from '../lib/searchApi';
import { graphqlIntrospection } from '../lib/graphqlIntrospection';
import useHeaderHeight from '../hooks/useHeaderHeight';

type FilterType = 'all' | 'article' | 'event' | 'school';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      // デバッグ用：GraphQLスキーマを確認
      graphqlIntrospection.getAvailableTypes();
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError(null);

    try {
      // 実際のAPI呼び出し
      const searchResults = await searchApi.searchAll(searchQuery, 30);
      setResults(searchResults);
    } catch (error) {
      console.error('検索エラー:', error);
      setError('検索中にエラーが発生しました。時間をおいて再度お試しください。');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults =
    activeFilter === 'all' ? results : results.filter((result) => result.type === activeFilter);

  const getTypeLabel = (type: FilterType) => {
    switch (type) {
      case 'article':
        return '記事';
      case 'event':
        return 'イベント';
      case 'school':
        return 'スクール';
      default:
        return type;
    }
  };

  const getTypeColor = (type: FilterType) => {
    switch (type) {
      case 'article':
        return 'bg-blue-100 text-blue-800';
      case 'event':
        return 'bg-red-100 text-red-800';
      case 'school':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Header />
      <div
        className="px-4 bg-gray-50 min-h-screen"
        style={{ paddingTop: headerHeight ? `${headerHeight}px` : undefined }}
      >
        <Breadcrumb items={[{ label: 'HOME', to: '/' }, { label: '検索結果' }]} />

        <div className="container mx-auto max-w-[1536px] py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">「{query}」の検索結果</h1>
            <p className="text-gray-600">
              {loading ? '検索中...' : `${filteredResults.length}件の結果が見つかりました`}
            </p>
          </div>

          {/* フィルター */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'all', label: 'すべて' },
                  { id: 'article', label: '記事' },
                  { id: 'event', label: 'イベント' },
                  { id: 'school', label: 'スクール' },
                ] as Array<{ id: FilterType; label: string }>
              ).map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-2 text-sm rounded-full transition-colors ${
                    activeFilter === filter.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-primary hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <i className="ri-error-warning-line text-red-500 mr-2"></i>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* 検索結果 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">検索中...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredResults.map((result) => (
                <div key={result.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-64 flex-shrink-0">
                      <Link to={result.url} className="block h-full">
                        <img
                          src={result.image}
                          alt={result.title}
                          className="w-full h-48 md:h-full object-cover hover:opacity-90 transition-opacity"
                        />
                      </Link>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`inline-block ${getTypeColor(result.type)} px-3 py-1 text-xs rounded-full`}
                        >
                          {getTypeLabel(result.type)}
                        </span>
                        {result.category && (
                          <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 text-xs rounded-full">
                            {result.category}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-3">
                        <Link to={result.url} className="hover:text-primary transition-colors">
                          {result.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 mb-4">{result.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {result.date && (
                            <span className="flex items-center">
                              <i className="ri-calendar-line mr-1"></i>
                              {result.date}
                            </span>
                          )}
                          {result.location && (
                            <span className="flex items-center">
                              <i className="ri-map-pin-line mr-1"></i>
                              {result.location}
                            </span>
                          )}
                        </div>
                        <a
                          href={result.url}
                          className="text-primary font-medium hover:text-primary/80 flex items-center"
                        >
                          詳しく見る
                          <i className="ri-arrow-right-line ml-1"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredResults.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-search-line text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-bold mb-2">検索結果が見つかりませんでした</h3>
              <p className="text-gray-600">別のキーワードで検索してみてください</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchPage;
