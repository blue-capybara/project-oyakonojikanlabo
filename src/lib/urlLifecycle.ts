import { gql, rawRequest } from 'graphql-request';

export type UrlLifecycleStatus = 200 | 301 | 404 | 410;

export interface UrlLifecycleResult {
  path: string;
  status: UrlLifecycleStatus;
  reason?: string;
  redirectTo?: string | null;
}

interface UrlLifecycleGraphQLResponse {
  urlLifecycle?: {
    path?: string | null;
    status?: number | null;
    reason?: string | null;
    redirectTo?: string | null;
  } | null;
}

interface UrlLifecycleGraphQLExtensions {
  status?: number | null;
  urlLifecycle?: {
    path?: string | null;
    status?: number | null;
    reason?: string | null;
    redirectTo?: string | null;
  } | null;
}

const GET_URL_LIFECYCLE = gql`
  query GetUrlLifecycle($path: String!) {
    urlLifecycle(path: $path) {
      path
      status
      reason
      redirectTo
    }
  }
`;

const normalizeSegment = (segment: string) => {
  if (!segment) return '';

  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
};

const normalizePath = (inputPath: string) => {
  if (!inputPath) return '';

  let pathname = inputPath.trim();
  if (!pathname) return '';

  try {
    pathname = new URL(inputPath, 'https://oyakonojikanlabo.jp').pathname;
  } catch {
    pathname = inputPath;
  }

  pathname = pathname.split('#')[0].split('?')[0].trim();
  if (!pathname) return '';

  pathname = pathname.replace(/\/{2,}/g, '/');

  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }

  const normalized = pathname
    .split('/')
    .map((segment, index) => (index === 0 ? '' : normalizeSegment(segment)))
    .join('/');

  const canonical = normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized;
  if (!canonical) {
    return '/';
  }

  return canonical.toLowerCase();
};

const normalizeStatus = (statusValue?: number | null): UrlLifecycleStatus | null => {
  switch (statusValue) {
    case 200:
    case 301:
    case 404:
    case 410:
      return statusValue;
    default:
      return null;
  }
};

interface UrlLifecycleGraphQLPayload {
  data?: UrlLifecycleGraphQLResponse | null;
  extensions?: UrlLifecycleGraphQLExtensions | null;
}

/**
 * GraphQL レスポンスに付与された URL ライフサイクル判定を正規化します。
 * 記事などの本体クエリにも同じ extensions が付くため、追加リクエストなしで再利用できます。
 */
export const resolveUrlLifecycleFromGraphQL = (
  inputPath: string,
  payload: UrlLifecycleGraphQLPayload,
): UrlLifecycleResult | null => {
  const path = normalizePath(inputPath);
  if (!path) return null;

  const extensionLifecycle = payload.extensions?.urlLifecycle ?? null;
  const dataLifecycle = payload.data?.urlLifecycle ?? null;

  const status =
    normalizeStatus(payload.extensions?.status) ??
    normalizeStatus(extensionLifecycle?.status) ??
    normalizeStatus(dataLifecycle?.status) ??
    null;

  if (!status) {
    return null;
  }

  const redirectTo = extensionLifecycle?.redirectTo ?? dataLifecycle?.redirectTo ?? null;
  const reason = extensionLifecycle?.reason ?? dataLifecycle?.reason ?? undefined;

  return {
    path,
    status,
    reason: reason ?? undefined,
    redirectTo,
  };
};

export const fetchUrlLifecycle = async (
  endpoint: string,
  inputPath: string,
): Promise<UrlLifecycleResult | null> => {
  const path = normalizePath(inputPath);
  if (!path) return null;

  try {
    const response = await rawRequest<UrlLifecycleGraphQLResponse, { path: string }>(
      endpoint,
      GET_URL_LIFECYCLE,
      { path },
    );

    return resolveUrlLifecycleFromGraphQL(path, {
      data: response.data,
      extensions: (response.extensions ?? null) as UrlLifecycleGraphQLExtensions | null,
    });
  } catch (error) {
    console.warn('URLライフサイクル判定の取得に失敗しました。既存判定で続行します。', error);
    return null;
  }
};
