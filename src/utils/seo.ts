export type NoIndexOption = {
  force?: boolean;
};

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
