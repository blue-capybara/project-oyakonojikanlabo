import React from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import ArticlesSection from '../components/HomePage/ArticlesSection';
import EventsSection from '../components/HomePage/EventsSection';
import ShoppingSection from '../components/HomePage/ShoppingSection';
import PicoBanner from '../components/HomePage/PicoBanner';
import PicoEvents from '../components/HomePage/PicoEvents';
import CollaborationBanner from '../components/HomePage/CollaborationBanner';
import FeatureSection from '../components/HomePage/FeatureSection';
import { featureClient, useFeaturePosts } from '../components/HomePage/useFeaturePosts';
import Seo from '../components/seo/Seo';
import { withBase } from '../utils/paths';

const stripHtml = (html?: string | null) =>
  html
    ? html
        .replace(/<[^>]*>?/gm, '')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

const decodeEntities = (text: string) =>
  text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;|&hellip;/gi, '…');

const truncateText = (text: string, max = 120) =>
  text.length > max ? `${text.slice(0, max)}…` : text;

const sanitizeExcerpt = (excerpt?: string | null, content?: string | null) => {
  const base = excerpt?.trim().length ? excerpt : (content ?? '');
  if (!base) return '';

  const cleaned = decodeEntities(stripHtml(base))
    .replace(/\[&hellip;\]/gi, '')
    .replace(/\[\s*…\s*\]/g, '')
    .trim();

  return truncateText(cleaned);
};

const HomePageContent: React.FC = () => {
  const { featurePosts, loading, error } = useFeaturePosts();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showLoader, setShowLoader] = React.useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = React.useState(false);
  const mainSlides = React.useMemo(() => featurePosts.slice(0, 5), [featurePosts]);

  // 検索パネル開閉イベントを購読し、スライダー自動進行の停止に利用
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail;
      if (detail && typeof detail.open === 'boolean') {
        setIsSearchPanelOpen(detail.open);
      }
    };
    window.addEventListener('ojl:search-panel', handler as EventListener);
    return () => window.removeEventListener('ojl:search-panel', handler as EventListener);
  }, []);

  React.useEffect(() => {
    if (!mainSlides.length) return;
    if (currentIndex >= mainSlides.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, mainSlides.length]);

  React.useEffect(() => {
    if (!mainSlides.length || isSearchPanelOpen) return;
    const timer = setInterval(() => {
      const active = document.activeElement;
      const isSearchFocused =
        active instanceof HTMLInputElement && active.placeholder === 'キーワードを入力';
      if (isSearchFocused || isSearchPanelOpen) return; // 検索入力中／パネル開時は停止

      setCurrentIndex((prev) => (prev + 1) % mainSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [mainSlides.length, isSearchPanelOpen]);

  // ローディングが300ms以上続いたときだけ簡易オーバーレイを表示
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (loading) {
      timer = setTimeout(() => setShowLoader(true), 300);
    } else {
      setShowLoader(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  const hasFeatures = mainSlides.length > 0;
  const main = hasFeatures ? mainSlides[currentIndex] : undefined;
  const description =
    sanitizeExcerpt(main?.post?.excerpt, main?.post?.content) ||
    '親子時間の最新特集からピックアップ。メインビジュアル内で自動スライドするカルーセルをお試しください。';

  return (
    <Layout showNewsletter={true}>
      <Seo
        title="親子の時間研究所"
        description="親子の時間研究所（oyakonojikanlabo）は、親子で楽しめる学び・イベント・暮らしの情報を発信するメディアです。"
      />
      {showLoader && (
        <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="mt-3 text-primary/80 text-sm">コンテンツを読み込み中です…</p>
        </div>
      )}
      {/* メインビジュアル */}
      <section className="relative min-h-[720px] overflow-hidden bg-gradient-to-br from-primary/90 to-primary">
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col lg:flex-row items-center justify-between min-h-[720px] py-16">
            <div className="w-full lg:w-1/2 text-white z-10">
              <div className="flex gap-2 mb-6">
                <span className="inline-block bg-white/20 text-white px-4 py-1 text-xs rounded-full">
                  特集
                </span>
                {main?.post?.date && (
                  <span className="inline-block bg-white/20 text-white px-4 py-1 text-xs rounded-full">
                    {new Date(main.post.date).toLocaleDateString('ja-JP')}
                  </span>
                )}
              </div>
              <h2 className="text-2xl lg:text-4xl font-bold mb-6 leading-tight animate-fade-in">
                {main?.post?.title ?? '特集記事を読み込み中です…'}
              </h2>
              <p className="text-base lg:text-lg mb-8 leading-relaxed opacity-90">{description}</p>
              <div className="flex flex-col lg:flex-row gap-4">
                {main ? (
                  <Link
                    to={`/${main.post.slug}`}
                    className="bg-white text-primary px-10 py-4 font-bold rounded-button whitespace-nowrap hover:bg-yellow-300 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
                  >
                    記事を読む
                  </Link>
                ) : (
                  <span className="bg-white/30 text-white px-10 py-4 font-bold rounded-button whitespace-nowrap">
                    準備中
                  </span>
                )}
              </div>
            </div>
            <div className="w-full lg:w-1/2 mt-12 lg:mt-0 relative z-10">
              <div className="relative w-full max-w-xl mx-auto">
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl bg-white/10">
                  {mainSlides.map((item, idx) => (
                    <img
                      key={item.featureId}
                      src={
                        item.post.featuredImage?.node?.sourceUrl ??
                        withBase('images/readdy/921de84646a0d38dfa688f1d826685e6.jpeg')
                      }
                      alt={item.post.title}
                      className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
                        idx === currentIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  ))}
                  {!mainSlides.length && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/70">
                      画像を準備中です
                    </div>
                  )}
                </div>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasFeatures) return;
                      setCurrentIndex((prev) => (prev === 0 ? mainSlides.length - 1 : prev - 1));
                    }}
                    className="bg-white text-primary w-10 h-10 rounded-full shadow-lg hover:bg-yellow-300 hover:text-white transition"
                    aria-label="前へ"
                    disabled={!hasFeatures}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasFeatures) return;
                      setCurrentIndex((prev) => (prev + 1) % mainSlides.length);
                    }}
                    className="bg-white text-primary w-10 h-10 rounded-full shadow-lg hover:bg-yellow-300 hover:text-white transition"
                    aria-label="次へ"
                    disabled={!hasFeatures}
                  >
                    ›
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                {mainSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition ${
                      idx === currentIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                    aria-label={`特集 ${idx + 1} を表示`}
                    disabled={!hasFeatures}
                  />
                ))}
              </div>
              <div className="flex items-center justify-center gap-3 mt-3">
                {mainSlides.map((item, idx) => (
                  <button
                    key={`${item.featureId}-thumb`}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-14 h-14 rounded-md overflow-hidden border transition ${
                      idx === currentIndex ? 'border-white' : 'border-white/30'
                    }`}
                    aria-label={`特集サムネイル ${idx + 1}`}
                    disabled={!hasFeatures}
                  >
                    <img
                      src={
                        item.post.featuredImage?.node?.sourceUrl ??
                        withBase('images/readdy/921de84646a0d38dfa688f1d826685e6.jpeg')
                      }
                      alt={item.post.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* 特集セクション（独立表示） */}
      <FeatureSection posts={undefined} loadingOverride={loading} errorOverride={Boolean(error)} />

      {/* 記事一覧セクション */}
      <ArticlesSection />

      {/* イベント情報セクション */}
      <EventsSection />

      {/* おかいものセクション */}
      <ShoppingSection />

      {/* 豊中PICOバナー */}
      <PicoBanner />

      {/* PICOイベント */}
      <PicoEvents />

      {/* コラボレーションバナー */}
      <CollaborationBanner />
    </Layout>
  );
};

const HomePage: React.FC = () => (
  <ApolloProvider client={featureClient}>
    <HomePageContent />
  </ApolloProvider>
);

export default HomePage;
