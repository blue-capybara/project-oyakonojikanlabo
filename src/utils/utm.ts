export const STANDARD_UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;
export const UTM_STORAGE_KEYS = [...STANDARD_UTM_KEYS, 'line_id'] as const;
export const UTM_EXPIRE_KEY = 'utm_expire';
export const UTM_EXPIRE_DAYS = 7;
export const LP_UTM_STORAGE_KEY = 'oyakonojikanlabo-lp-utm-attribution-v1';

export type StandardUtmKey = (typeof STANDARD_UTM_KEYS)[number];
export type UtmStorageKey = (typeof UTM_STORAGE_KEYS)[number];
export type StandardUtm = Partial<Record<StandardUtmKey, string>>;
export type StoredUtm = Partial<Record<UtmStorageKey, string>>;

interface StoredLpUtm {
  expiresAt: number;
  utm: StandardUtm;
}

const EXCLUDED_PROTOCOLS = new Set(['mailto:', 'tel:', 'javascript:']);
const DAY_IN_MS = 86_400_000;
const UTM_VALUE_MAX_LENGTH = 200;

const normalizeValue = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const withoutControlCharacters = Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127 ? ' ' : character;
  }).join('');
  const normalized = withoutControlCharacters.replace(/\s+/g, ' ').trim();
  return normalized ? Array.from(normalized).slice(0, UTM_VALUE_MAX_LENGTH).join('') : null;
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

const isSameOriginLpUrl = (url: URL): boolean => {
  if (!canUseWindow()) return false;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

  return url.origin === window.location.origin && url.pathname.startsWith('/lp/');
};

const readStandardUtmFromUrl = (url: URL): StandardUtm => {
  const utm: StandardUtm = {};

  STANDARD_UTM_KEYS.forEach((key) => {
    const value = normalizeValue(url.searchParams.get(key));
    if (value) {
      utm[key] = value;
    }
  });

  return utm;
};

const hasStandardUtm = (utm: StandardUtm): boolean => Object.keys(utm).length > 0;

const saveLpUtm = (utm: StandardUtm): boolean => {
  if (!canUseWindow() || !hasStandardUtm(utm)) return false;

  try {
    const storedLpUtm: StoredLpUtm = {
      expiresAt: Date.now() + UTM_EXPIRE_DAYS * DAY_IN_MS,
      utm,
    };
    window.localStorage.setItem(LP_UTM_STORAGE_KEY, JSON.stringify(storedLpUtm));
    return true;
  } catch {
    return false;
  }
};

const getStoredLpUtm = (): StandardUtm => {
  const storedValue = readLocalStorage(LP_UTM_STORAGE_KEY);
  if (!storedValue) return {};

  try {
    const parsed = JSON.parse(storedValue);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const storedLpUtm = parsed as Partial<StoredLpUtm>;
    if (
      typeof storedLpUtm.expiresAt !== 'number' ||
      !Number.isFinite(storedLpUtm.expiresAt) ||
      Date.now() > storedLpUtm.expiresAt
    ) {
      removeLocalStorageItem(LP_UTM_STORAGE_KEY);
      return {};
    }
    if (!storedLpUtm.utm || typeof storedLpUtm.utm !== 'object') {
      removeLocalStorageItem(LP_UTM_STORAGE_KEY);
      return {};
    }

    const storedUtm: StandardUtm = {};
    STANDARD_UTM_KEYS.forEach((key) => {
      const value = normalizeValue((storedLpUtm.utm as Record<string, unknown>)[key]);
      if (value) {
        storedUtm[key] = value;
      }
    });
    if (!hasStandardUtm(storedUtm)) {
      removeLocalStorageItem(LP_UTM_STORAGE_KEY);
    }
    return storedUtm;
  } catch {
    removeLocalStorageItem(LP_UTM_STORAGE_KEY);
    return {};
  }
};

const getLpUtmForPropagation = (): StandardUtm => {
  if (!canUseWindow()) return {};

  const currentUtm = readStandardUtmFromUrl(new URL(window.location.href));
  if (hasStandardUtm(currentUtm)) {
    saveLpUtm(currentUtm);
    return currentUtm;
  }

  return getStoredLpUtm();
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

export const captureLpUtmFromUrl = (sourceUrl?: string): boolean => {
  if (!canUseWindow()) return false;

  try {
    const url = new URL(sourceUrl ?? window.location.href, window.location.href);
    return saveLpUtm(readStandardUtmFromUrl(url));
  } catch {
    return false;
  }
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

export const addUtmToLinkUrl = (href: string): string => {
  const url = resolveUrl(href);
  if (!url) return href;

  if (!isSameOriginLpUrl(url)) {
    return addStoredUtmToExternalUrl(href);
  }

  // WordPress側で明示されたUTMは、そのリンク固有の計測値として優先する。
  if (hasStandardUtm(readStandardUtmFromUrl(url))) {
    return href;
  }

  const utm = getLpUtmForPropagation();
  if (!hasStandardUtm(utm)) return href;

  STANDARD_UTM_KEYS.forEach((key) => {
    const value = utm[key];
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

let linkHandlerCleanup: (() => void) | null = null;

export const installUtmLinkHandler = (): (() => void) => {
  if (typeof document === 'undefined') return () => undefined;
  if (linkHandlerCleanup) return linkHandlerCleanup;

  const handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest('a[href]');
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (anchor.dataset.utmPropagation === 'off') return;

    const rawHref = anchor.getAttribute('href');
    if (!rawHref) return;

    const decoratedHref = addUtmToLinkUrl(rawHref);
    if (decoratedHref !== rawHref) {
      anchor.href = decoratedHref;
    }
  };

  document.addEventListener('click', handleClick, true);

  linkHandlerCleanup = () => {
    document.removeEventListener('click', handleClick, true);
    linkHandlerCleanup = null;
  };

  return linkHandlerCleanup;
};

export const installUtmExternalLinkHandler = installUtmLinkHandler;
