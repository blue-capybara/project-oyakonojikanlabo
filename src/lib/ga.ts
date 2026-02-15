// GA4 計測ヘルパー。
// - 本番のみ index.html 側で gtag を初期化（allowedHosts チェック）。
// - ステージでは VITE_GA_MEASUREMENT_ID を空にして無効化する運用。

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __GA_MEASUREMENT_ID__?: string;
  }
}

const getMeasurementId = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window.__GA_MEASUREMENT_ID__ || import.meta.env.VITE_GA_MEASUREMENT_ID;
};

const canTrack = (): boolean => {
  if (typeof window === 'undefined') return false;
  const id = getMeasurementId();
  return !!id && typeof window.gtag === 'function';
};

export const sendPageView = (path: string) => {
  if (!canTrack()) return;
  const id = getMeasurementId();
  if (!id) return;
  const gtagFn = window.gtag;
  if (!gtagFn) return; // gtag が未初期化の場合の型安全なガード
  gtagFn('config', id, {
    page_path: path,
  });
};

// SEO: 301 への安易な転換でパーマリンク評価を落とさないよう、確定した 404 を別イベントで計測する
export const send404Event = () => {
  if (!canTrack()) return;
  const gtagFn = window.gtag;
  if (!gtagFn) return;

  const pageLocation = typeof window !== 'undefined' ? window.location.href : undefined;
  const pagePath =
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : undefined;
  const referrer =
    typeof document !== 'undefined' && document.referrer ? document.referrer : undefined;

  gtagFn('event', 'page_404', {
    page_location: pageLocation,
    page_path: pagePath,
    ...(referrer ? { referrer } : {}),
  });
};

type RelatedPostClickEventParams = {
  currentPostSlug: string;
  currentPostId?: number;
  relatedPostId: number;
  relatedPostSlug?: string;
  relatedPostSource?: string;
  position: number;
};

export const sendRelatedPostClickEvent = ({
  currentPostSlug,
  currentPostId,
  relatedPostId,
  relatedPostSlug,
  relatedPostSource,
  position,
}: RelatedPostClickEventParams) => {
  if (!canTrack()) return;
  const gtagFn = window.gtag;
  if (!gtagFn) return;

  gtagFn('event', 'related_post_click', {
    current_post_slug: currentPostSlug,
    ...(currentPostId ? { current_post_id: currentPostId } : {}),
    related_post_id: relatedPostId,
    ...(relatedPostSlug ? { related_post_slug: relatedPostSlug } : {}),
    ...(relatedPostSource ? { related_post_source: relatedPostSource } : {}),
    position,
  });
};

export {}; // TypeScript module augment 確認用
