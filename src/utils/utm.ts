export const UTM_STORAGE_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'line_id'] as const;
export const UTM_EXPIRE_KEY = 'utm_expire';
export const UTM_EXPIRE_DAYS = 7;

export type UtmStorageKey = (typeof UTM_STORAGE_KEYS)[number];
export type StoredUtm = Partial<Record<UtmStorageKey, string>>;

const EXCLUDED_PROTOCOLS = new Set(['mailto:', 'tel:', 'javascript:']);
const DAY_IN_MS = 86_400_000;

const normalizeValue = (value: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const canUseWindow = () => typeof window !== 'undefined';

const readLocalStorage = (key: string): string | null => {
  if (!canUseWindow()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const removeLocalStorageItem = (key: string) => {
  if (!canUseWindow()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // localStorage が利用できない環境では何もしない
  }
};

const removeStoredUtm = () => {
  UTM_STORAGE_KEYS.forEach(removeLocalStorageItem);
  removeLocalStorageItem(UTM_EXPIRE_KEY);
};

const hasStoredUtm = (): boolean => {
  return UTM_STORAGE_KEYS.some((key) => normalizeValue(readLocalStorage(key)));
};

const clearExpiredStoredUtm = (): boolean => {
  if (!canUseWindow()) return false;

  const expireValue = normalizeValue(readLocalStorage(UTM_EXPIRE_KEY));

  if (!hasStoredUtm()) {
    if (expireValue) {
      removeLocalStorageItem(UTM_EXPIRE_KEY);
    }
    return false;
  }

  // 期限がない既存データは旧仕様由来の可能性があるため、期限切れとして扱う
  if (!expireValue) {
    removeStoredUtm();
    return true;
  }

  const expireAt = Number(expireValue);
  if (!Number.isFinite(expireAt) || Date.now() > expireAt) {
    removeStoredUtm();
    return true;
  }

  return false;
};

const saveUtmExpire = () => {
  if (!canUseWindow()) return;

  try {
    window.localStorage.setItem(UTM_EXPIRE_KEY, String(Date.now() + UTM_EXPIRE_DAYS * DAY_IN_MS));
  } catch {
    // 期限保存に失敗しても遷移や描画は止めない
  }
};

const isExcludedHref = (href: string): boolean => {
  const protocol = href.match(/^([a-z][a-z\d+.-]*:)/i)?.[1]?.toLowerCase();
  return protocol ? EXCLUDED_PROTOCOLS.has(protocol) : false;
};

const resolveUrl = (href: string): URL | null => {
  if (!canUseWindow()) return null;

  const trimmedHref = href.trim();
  if (!trimmedHref || isExcludedHref(trimmedHref)) return null;

  try {
    return new URL(trimmedHref, window.location.href);
  } catch {
    return null;
  }
};

const isExternalHttpUrl = (url: URL): boolean => {
  if (!canUseWindow()) return false;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

  // 現在表示中のホストと同じリンクは React Router 側の内部遷移として扱う
  return url.hostname !== window.location.hostname;
};

export const getStoredUtm = (): StoredUtm => {
  if (!canUseWindow()) return {};
  clearExpiredStoredUtm();

  const storedUtm: StoredUtm = {};

  UTM_STORAGE_KEYS.forEach((key) => {
    const value = normalizeValue(readLocalStorage(key));
    if (value) {
      storedUtm[key] = value;
    }
  });

  return storedUtm;
};

export const saveUtmFromUrl = (sourceUrl?: string): boolean => {
  if (!canUseWindow()) return false;
  clearExpiredStoredUtm();

  let url: URL;
  try {
    url = new URL(sourceUrl ?? window.location.href, window.location.href);
  } catch {
    return false;
  }

  let saved = false;
  const hasExpire = Boolean(normalizeValue(readLocalStorage(UTM_EXPIRE_KEY)));

  UTM_STORAGE_KEYS.forEach((key) => {
    const incomingValue = normalizeValue(url.searchParams.get(key));
    if (!incomingValue) return;

    try {
      const currentValue = normalizeValue(window.localStorage.getItem(key));
      if (currentValue) return;

      window.localStorage.setItem(key, incomingValue);
      saved = true;
    } catch {
      // 保存に失敗しても遷移や描画は止めない
    }
  });

  if (saved && !hasExpire) {
    saveUtmExpire();
  }

  return saved;
};

export const addStoredUtmToExternalUrl = (href: string): string => {
  const url = resolveUrl(href);
  if (!url || !isExternalHttpUrl(url)) return href;

  const storedUtm = getStoredUtm();
  const entries = Object.entries(storedUtm) as Array<[UtmStorageKey, string]>;
  if (entries.length === 0) return href;

  entries.forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
};

let externalLinkHandlerCleanup: (() => void) | null = null;

export const installUtmExternalLinkHandler = (): (() => void) => {
  if (typeof document === 'undefined') return () => undefined;
  if (externalLinkHandlerCleanup) return externalLinkHandlerCleanup;

  const handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest('a[href]');
    if (!(anchor instanceof HTMLAnchorElement)) return;

    const rawHref = anchor.getAttribute('href');
    if (!rawHref) return;

    const decoratedHref = addStoredUtmToExternalUrl(rawHref);
    if (decoratedHref !== rawHref) {
      anchor.href = decoratedHref;
    }
  };

  document.addEventListener('click', handleClick, true);

  externalLinkHandlerCleanup = () => {
    document.removeEventListener('click', handleClick, true);
    externalLinkHandlerCleanup = null;
  };

  return externalLinkHandlerCleanup;
};
