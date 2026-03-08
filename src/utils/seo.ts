export type NoIndexOption = {
  force?: boolean;
};

const SITE_ORIGIN = 'https://oyakonojikanlabo.jp';
const TRACKING_PARAM_KEYS = new Set([
  '_ga',
  '_gl',
  'fbclid',
  'gclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'msclkid',
  'twclid',
  'yclid',
]);

/**
 * ステージング判定
 * - VITE_APP_ENV または Vite の MODE が stg/staging の場合に true
 */
export const isStagingEnv = () => {
  const env = (import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE ?? '').toLowerCase();
  return env === 'stg' || env === 'stage' || env === 'staging';
};

/**
 * noindex を付与すべきか判定するユーティリティ
 * - ステージングなら常に true
 * - force オプションでページ単位の強制 noindex を可能にする
 */
export const shouldNoIndex = (option?: NoIndexOption) => {
  if (option?.force) return true;
  return isStagingEnv();
};

const isTrackingParam = (key: string) => {
  const normalizedKey = key.toLowerCase();
  return normalizedKey.startsWith('utm_') || TRACKING_PARAM_KEYS.has(normalizedKey);
};

/**
 * 末尾スラッシュや重複スラッシュを正規化する
 * - ルート "/" は維持
 * - それ以外は末尾スラッシュを除去
 */
export const normalizePathname = (pathname: string) => {
  const collapsed = pathname.replace(/\/{2,}/g, '/');
  if (collapsed === '/') return '/';
  return collapsed.replace(/\/+$/, '') || '/';
};

/**
 * canonical 用の絶対 URL を生成する
 * - ドメインは本番オリジンに固定
 * - 末尾スラッシュを除去
 * - tracking クエリ（utm_*, gclid 等）は除去
 * - hash は除去
 */
export const buildCanonicalUrl = (input?: string) => {
  if (!input) return undefined;

  try {
    const url = new URL(input, SITE_ORIGIN);
    const fixedOrigin = new URL(SITE_ORIGIN);

    url.protocol = fixedOrigin.protocol;
    url.host = fixedOrigin.host;
    url.pathname = normalizePathname(url.pathname);

    const filteredParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (!isTrackingParam(key)) {
        filteredParams.append(key, value);
      }
    });

    const query = filteredParams.toString();
    url.search = query ? `?${query}` : '';
    url.hash = '';

    return url.toString();
  } catch {
    return undefined;
  }
};
