import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { gql, request } from 'graphql-request';
import Layout from '../components/Layout/Layout';
import Breadcrumb from '../components/Breadcrumb';
import WordPressContent from '../components/Post/WordPressContent';
import Seo from '../components/seo/Seo';
import ArticleHeroImage from '../components/article/ArticleHeroImage';
import ArticleTitleBlock from '../components/article/ArticleTitleBlock';
import ArticleBodyContainer from '../components/article/ArticleBodyContainer';

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';

type PageData = {
  title: string;
  date?: string;
  content?: string | null;
  customCss?: string | null;
  customJs?: string | null;
  featuredImage?: {
    node?: {
      sourceUrl?: string | null;
    } | null;
  } | null;
};

type PageResponse = {
  page: PageData | null;
};

const GET_PAGE_BY_URI = gql`
  query GetPageByUri($uri: ID!) {
    page(id: $uri, idType: URI) {
      title
      date
      content
      customCss
      customJs
      featuredImage {
        node {
          sourceUrl
        }
      }
    }
  }
`;

const isValidDate = (value: string) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const formatDateJa = (value?: string) => {
  if (!value || !isValidDate(value)) {
    return '';
  }
  return new Date(value).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface StaticWpPageProps {
  pageUri: string;
  pageName: string;
  sharePath: string;
  backLink?: {
    label: string;
    to: string;
  };
}

const StaticWpPage: React.FC<StaticWpPageProps> = ({
  pageUri,
  pageName,
  sharePath,
  backLink = { label: 'HOMEに戻る', to: '/' },
}) => {
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);

        const data = await request<PageResponse>(endpoint, GET_PAGE_BY_URI, { uri: pageUri });

        if (!data.page) {
          setNotFound(true);
          setError('ページが見つかりませんでした');
          setPage(null);
          return;
        }

        setPage(data.page);
      } catch (err) {
        console.error('固定ページの取得に失敗しました:', err);
        setError('ページの読み込み中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [pageUri]);

  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    if (/^https?:\/\//.test(sharePath)) {
      return sharePath;
    }
    return `https://oyakonojikanlabo.jp${sharePath.startsWith('/') ? sharePath : `/${sharePath}`}`;
  }, [sharePath]);

  const shareText = useMemo(
    () => `${page?.title ?? pageName} | 親子の時間研究所`,
    [page?.title, pageName],
  );

  const handleShareClick = (platform: 'x' | 'facebook' | 'line' | 'email') => {
    if (!shareUrl) return;

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

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
        const subject = encodeURIComponent(page?.title ?? pageName);
        const body = encodeURIComponent(`${shareText}\n${shareUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        break;
      }
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-32 text-center">読み込み中...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">ページが見つかりません</h2>
              <p className="text-gray-600 mb-8">{error}</p>
            </div>
            <div className="space-y-4">
              <Link
                to={backLink.to}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {backLink.label}
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

  if (!page || notFound) {
    return (
      <Layout>
        <div className="container mx-auto py-32 text-center">ページが見つかりませんでした。</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title={page.title ?? pageName}
        description={page.content ?? undefined}
        ogImage={page.featuredImage?.node?.sourceUrl ?? undefined}
      />
      <Breadcrumb items={[{ label: 'HOME', to: '/' }, { label: page.title ?? pageName }]} />

      <ArticleHeroImage src={page.featuredImage?.node?.sourceUrl} alt={page.title ?? pageName} />

      <ArticleTitleBlock title={page.title ?? pageName} dateText={formatDateJa(page.date)} />

      <ArticleBodyContainer>
        {page.content ? (
          <WordPressContent
            html={page.content}
            customCss={page.customCss}
            customJs={page.customJs}
            className="post-content"
          />
        ) : (
          <p className="text-gray-500">現在、コンテンツが表示できません。</p>
        )}
      </ArticleBodyContainer>

      <section className="pb-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to={backLink.to} className="flex items-center text-gray-600 hover:text-primary">
                <div className="w-5 h-5 flex items-center justify-center mr-1">
                  <i className="ri-arrow-left-line"></i>
                </div>
                <span>{backLink.label}</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-full transition-colors hover:bg-gray-50"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-share-line"></i>
                </div>
                <span>シェアする</span>
              </button>
            </div>
          </div>
        </div>
      </section>

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

export default StaticWpPage;
