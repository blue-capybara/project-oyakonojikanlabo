import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { initGa4B, sendGa4BPageView } from './ga4b';

type UseGa4BPageViewOptions = {
  linkerDomains?: string[];
};

let lastPath: string | null = null;

export const useGa4BPageView = (options: UseGa4BPageViewOptions = {}) => {
  const location = useLocation();
  const prevPathRef = useRef<string | null>(lastPath);
  const { linkerDomains } = options;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const path = `${location.pathname}${location.search}${location.hash}`;
    initGa4B(linkerDomains);
    if (lastPath === path) return;

    const referrer = prevPathRef.current
      ? `${window.location.origin}${prevPathRef.current}`
      : document.referrer || undefined;

    sendGa4BPageView({
      path,
      referrer,
    });

    prevPathRef.current = path;
    lastPath = path;
  }, [location.pathname, location.search, location.hash, linkerDomains]);
};
