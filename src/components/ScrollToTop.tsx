import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const MAX_HASH_SCROLL_RETRIES = 20;

const findHashTarget = (hash: string): HTMLElement | null => {
  const rawId = hash.replace(/^#/, '');
  if (!rawId) return null;

  const decodedId = decodeURIComponent(rawId);
  return document.getElementById(decodedId) ?? document.getElementById(rawId);
};

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    let frameId: number | null = null;
    let retryCount = 0;

    const scrollToHashTarget = () => {
      const target = findHashTarget(hash);
      if (target) {
        target.scrollIntoView({ block: 'start' });
        return;
      }

      if (retryCount >= MAX_HASH_SCROLL_RETRIES) {
        return;
      }

      retryCount += 1;
      frameId = window.requestAnimationFrame(scrollToHashTarget);
    };

    scrollToHashTarget();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
