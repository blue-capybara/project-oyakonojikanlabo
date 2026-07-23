import { useEffect, useState } from 'react';

const MOBILE_MEDIA_QUERY = '(max-width: 599px)';

const getMatches = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(MOBILE_MEDIA_QUERY).matches;

/**
 * ホーム画面のカードが1列表示になる幅をスマートフォン表示として扱います。
 */
export const useIsMobileView = () => {
  const [isMobile, setIsMobile] = useState(getMatches);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const updateMatches = () => setIsMobile(mediaQuery.matches);

    updateMatches();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMatches);
      return () => mediaQuery.removeEventListener('change', updateMatches);
    }

    // 古いSafari向けの互換処理です。
    mediaQuery.addListener(updateMatches);
    return () => mediaQuery.removeListener(updateMatches);
  }, []);

  return isMobile;
};
