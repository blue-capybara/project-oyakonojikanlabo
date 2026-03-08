// GA4-B（Shopify クロスドメイン用）ヘルパー
// 既存 GA4-A には触れず、send_to で GA4-B のみ送信する。

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA4_B_ID = import.meta.env.VITE_GA4_B_ID ?? '';

const DEFAULT_LINKER_DOMAINS = [
  'oyakonojikanlabo.jp',
  'www.oyakonojikanlabo.jp',
  'shop.oyakonojikanlabo.jp',
];

let initializedId: string | null = null;

const ensureGtag = () => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer!.push(args);
    };
  }
};

const hasGa4bScript = () =>
  typeof document !== 'undefined' && !!document.querySelector('script[data-ga4b="1"]');

const hasAnyGtagScript = () =>
  typeof document !== 'undefined' &&
  !!document.querySelector('script[src*="googletagmanager.com/gtag/js"]');

const loadGtagScriptIfNeeded = () => {
  if (typeof document === 'undefined') return;
  if (!GA4_B_ID) return;
  if (hasGa4bScript() || hasAnyGtagScript()) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_B_ID}`;
  script.setAttribute('data-ga4b', '1');
  document.head.appendChild(script);
};

export const initGa4B = (domains?: string[]) => {
  if (!GA4_B_ID || typeof window === 'undefined') return;
  if (initializedId === GA4_B_ID) return;

  loadGtagScriptIfNeeded();
  ensureGtag();

  const resolvedDomains = domains ?? DEFAULT_LINKER_DOMAINS;

  window.gtag!('js', new Date());
  window.gtag!('config', GA4_B_ID, {
    send_page_view: false,
    linker: { domains: resolvedDomains },
  });

  initializedId = GA4_B_ID;
};

type PageViewParams = {
  path: string;
  title?: string;
  referrer?: string;
  location?: string;
};

export const sendGa4BPageView = ({ path, title, referrer, location }: PageViewParams) => {
  if (!GA4_B_ID || typeof window === 'undefined') return;

  ensureGtag();
  const gtagFn = window.gtag;
  if (!gtagFn) return;

  const pageLocation = location || `${window.location.origin}${path}`;
  const params: Record<string, unknown> = {
    send_to: GA4_B_ID,
    page_path: path,
    page_location: pageLocation,
    page_title: title || document.title,
  };

  if (referrer) {
    params.page_referrer = referrer;
  }

  gtagFn('event', 'page_view', params);
};

export const getGa4BMeasurementId = (): string | undefined => {
  if (!GA4_B_ID) return undefined;
  return GA4_B_ID;
};

export const ensureGa4BReady = (domains?: string[]) => {
  if (!GA4_B_ID || typeof window === 'undefined') return undefined;
  initGa4B(domains);
  ensureGtag();
  return window.gtag;
};

export const GA4_B_LINKER_DOMAINS = DEFAULT_LINKER_DOMAINS;
