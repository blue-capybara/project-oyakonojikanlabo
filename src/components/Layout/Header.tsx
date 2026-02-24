import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { searchHistoryApi, SearchHistory } from '../../lib/searchHistory';
import { getFeatureFlag } from '../../config/featureFlags';
import { withBase } from '../../utils/paths';

const menuItems = [
  { label: 'ホーム', to: '/' },
  { label: 'おかいもの', href: 'https://shop.oyakonojikanlabo.jp/' },
  { label: '絵本のくつした', href: 'https://ehonyasan-moe.oyakonojikanlabo.jp/socks/' },
  { label: 'イベント', to: '/event' },
  { label: 'PICO豊中', to: '/pico' },
];

const headerLogoSrc = withBase('images/readdy/f99757ef-08c3-43d5-b778-d956445f2972.png');

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isCondensed, setIsCondensed] = useState(false);
  const drawerCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const isComposingRef = useRef(false);
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const showMembershipFeatures = getFeatureFlag('showMembershipFeatures');
  const openSearchModal = useCallback(() => setSearchModalOpen(true), []);
  const closeSearchModal = useCallback(() => {
    setSearchModalOpen(false);
    setShowHistory(false);
  }, []);

  const openDrawer = useCallback(() => {
    if (drawerCloseTimeoutRef.current) {
      clearTimeout(drawerCloseTimeoutRef.current);
      drawerCloseTimeoutRef.current = null;
    }
    setDrawerVisible(true);
    requestAnimationFrame(() => setDrawerOpen(true));
  }, []);

  const closeDrawer = useCallback(() => {
    if (!drawerVisible && !drawerOpen) {
      return;
    }
    setDrawerOpen(false);
    drawerCloseTimeoutRef.current = setTimeout(() => {
      setDrawerVisible(false);
      drawerCloseTimeoutRef.current = null;
    }, 300);
  }, [drawerOpen, drawerVisible]);

  const renderMenuLinks = (
    itemClassName: string,
    onItemClick?: () => void,
  ) =>
    menuItems.map((item, i) =>
      item.to ? (
        <Link
          key={i}
          to={item.to}
          onClick={onItemClick}
          className={itemClassName}
        >
          {item.label}
        </Link>
      ) : (
        <a
          key={i}
          href={item.href}
          onClick={onItemClick}
          className={itemClassName}
        >
          {item.label}
        </a>
      ),
    );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    navigate(`/search?q=${encodeURIComponent(query)}`);
    closeSearchModal();
    setSearchQuery('');
    // 検索履歴を保存
    searchHistoryApi.saveSearchHistory(query);
  };

  const handleHistoryClick = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    closeSearchModal();
    setSearchQuery('');
  };

  const handleDeleteHistory = async (id: string) => {
    await searchHistoryApi.deleteSearchHistory(id);
    setSearchHistory(prev => prev.filter(item => item.id !== id));
  };

  // 検索履歴を取得
  useEffect(() => {
    if (searchModalOpen) {
      searchHistoryApi.getSearchHistory(5).then(setSearchHistory);
      setShowHistory(true);
      requestAnimationFrame(() => {
        if (searchInputRef.current) {
          const input = searchInputRef.current;
          input.focus();
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }
      });
    } else {
      setShowHistory(false);
    }
  }, [searchModalOpen]);

  useEffect(() => {
    if (searchModalOpen && searchInputRef.current && !isComposingRef.current) {
      const input = searchInputRef.current;
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, [searchModalOpen, searchHistory]);

  useEffect(() => {
    const event = new CustomEvent('ojl:search-panel', { detail: { open: searchModalOpen } });
    window.dispatchEvent(event);
  }, [searchModalOpen]);

  // キーボードショートカット（Ctrl+K）で検索パネルを開く
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearchModal();
      }
      if (e.key === 'Escape') {
        closeSearchModal();
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeDrawer, closeSearchModal, openSearchModal]);

  useEffect(() => {
    const handleScroll = () => {
      setIsCondensed(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (drawerCloseTimeoutRef.current) {
        clearTimeout(drawerCloseTimeoutRef.current);
      }
    };
  }, []);
  const SearchButton = ({ buttonClassName }: { buttonClassName?: string }) => (
    <button
      type="button"
      onClick={openSearchModal}
      className={`w-8 h-8 flex items-center justify-center text-white hover:text-gray-200 ${buttonClassName || ''}`}
      aria-label="検索を開く"
    >
      <i className="ri-search-line ri-lg"></i>
    </button>
  );

  return (
    <>
      <header
        id="site-header"
        className="bg-primary text-white fixed top-0 left-0 right-0 z-50 shadow-md"
      >
      <div className="container mx-auto px-4">
        {/* Mobile header */}
        <div className="py-3 flex items-center md:hidden">
          <div className="w-24">
            <button
              className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-200"
              onClick={openDrawer}
            >
              <i className="ri-menu-line ri-lg"></i>
            </button>
          </div>
          <h1 className="flex-1 flex flex-col items-center">
            <Link to="/" className="flex flex-col items-center">
              <span className="text-[10px] mb-0.5 tracking-wider font-medium">
                絵本のような暮らし、しよう。
              </span>
              <img
                src={headerLogoSrc}
                alt="親子の時間研究所"
                className="h-8 w-auto"
              />
            </Link>
          </h1>
          <div className="w-24 flex items-center justify-end space-x-4">
            <SearchButton />
            {showMembershipFeatures && (
              <Link
                to="/mypage"
                className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-200"
              >
                <i className="ri-user-line ri-lg"></i>
              </Link>
            )}
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:block">
          {isCondensed ? (
            <div className="flex items-center justify-between py-3 transition-all duration-300">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src={headerLogoSrc}
                  alt="親子の時間研究所"
                  className="h-10 w-auto"
                />
              </Link>
              <nav className="flex items-center gap-8 text-sm font-medium tracking-tighter whitespace-nowrap">
                {renderMenuLinks('text-white hover:text-gray-200 whitespace-nowrap px-1')}
              </nav>
              <div className="flex items-center gap-3">
                <SearchButton />
                {showMembershipFeatures && (
                  <Link
                    to="/mypage"
                    className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-200"
                  >
                    <i className="ri-user-line ri-lg"></i>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 space-y-6 transition-all duration-300">
              <div className="relative flex flex-col items-center space-y-3 w-full">
                <span className="text-xs tracking-wider font-medium">
                  絵本のような暮らし、しよう。
                </span>
                <Link to="/" className="flex flex-col items-center">
                  <img
                    src={headerLogoSrc}
                    alt="親子の時間研究所"
                    className="h-10 w-auto"
                  />
                </Link>
                <div className="absolute top-0 right-0 flex items-center gap-3">
                  <SearchButton />
                  {showMembershipFeatures && (
                    <Link
                      to="/mypage"
                      className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-200"
                    >
                      <i className="ri-user-line ri-lg"></i>
                    </Link>
                  )}
                </div>
              </div>
              <nav className="flex items-center gap-10 text-sm font-medium tracking-tighter whitespace-nowrap">
                {renderMenuLinks('text-white hover:text-gray-200 whitespace-nowrap px-2')}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* モバイル用ドロワー */}
      {drawerVisible && (
        <div
          className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100 bg-black/50' : 'opacity-0 bg-black/0'
          }`}
          onClick={closeDrawer}
        >
          <div
            className={`fixed top-0 left-0 h-full w-64 bg-white text-gray-900 shadow-lg p-6 z-50 transform transition-transform duration-300 ${
              drawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">メニュー</h2>
              <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700">
                <i className="ri-close-line ri-2x"></i>
              </button>
            </div>
            <nav className="space-y-4">
              {renderMenuLinks('block text-base hover:text-primary', closeDrawer)}
            </nav>
          </div>
        </div>
      )}
    </header>

      {modalRoot && searchModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-start justify-center px-4 py-10"
          onClick={closeSearchModal}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeSearchModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              aria-label="検索モーダルを閉じる"
            >
              <i className="ri-close-line text-2xl" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 pr-10">サイト内検索</h3>
            <p className="text-sm text-gray-500 mt-1">キーワードを入力して記事やイベントを検索できます。</p>

            <form onSubmit={handleSearch} className="relative mt-4">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={() => { isComposingRef.current = false; }}
                ref={searchInputRef}
                placeholder="キーワードを入力"
                aria-label="キーワードを入力"
                autoComplete="off"
                className="w-full pl-12 pr-28 py-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary/30 focus:border-primary bg-gray-50 text-gray-900"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <i className="ri-search-line text-lg" />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-16 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="検索語をクリア"
                >
                  <i className="ri-close-circle-line text-lg" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-1"
              >
                <span className="text-sm font-semibold">検索</span>
                <i className="ri-arrow-right-line"></i>
              </button>
            </form>

            {showHistory && searchHistory.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">最近の検索</h4>
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    非表示
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {searchHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <button
                        type="button"
                        onClick={() => handleHistoryClick(item.query)}
                        className="flex-1 text-left text-sm text-gray-700 hover:text-primary flex items-center gap-2"
                      >
                        <i className="ri-time-line text-gray-400" />
                        <span>{item.query}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHistory(item.id)}
                        className="text-gray-300 hover:text-red-500 p-1"
                        aria-label="この履歴を削除"
                      >
                        <i className="ri-close-line text-base" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        modalRoot
      )}
    </>
  );
};

export default memo(Header);
