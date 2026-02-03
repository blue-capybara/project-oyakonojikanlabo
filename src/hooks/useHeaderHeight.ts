import { useCallback, useEffect, useState } from 'react';

const SITE_HEADER_ID = 'site-header';

const useHeaderHeight = () => {
  const [headerHeight, setHeaderHeight] = useState(0);

  const measureHeight = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const header = document.getElementById(SITE_HEADER_ID);
    if (header) {
      setHeaderHeight(header.getBoundingClientRect().height);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    measureHeight();
    window.addEventListener('resize', measureHeight);

    const header = document.getElementById(SITE_HEADER_ID);
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    if (header) {
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(() => measureHeight());
        resizeObserver.observe(header);
      } else {
        mutationObserver = new MutationObserver(() => measureHeight());
        mutationObserver.observe(header, {
          attributes: true,
          childList: true,
          subtree: true,
        });
      }
    }

    return () => {
      window.removeEventListener('resize', measureHeight);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [measureHeight]);

  return headerHeight;
};

export default useHeaderHeight;
