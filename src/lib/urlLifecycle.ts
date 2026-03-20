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

const normalizePath = (inputPath: string) => {
  if (!inputPath) return '';

  let path = inputPath.trim();
  if (!path) return '';

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  path = path.replace(/\/{2,}/g, '/');

  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  return path.toLowerCase();
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

    const extensions = (response.extensions ?? null) as UrlLifecycleGraphQLExtensions | null;
    const extensionLifecycle = extensions?.urlLifecycle ?? null;
    const dataLifecycle = response.data?.urlLifecycle ?? null;

    const status =
      normalizeStatus(extensions?.status) ??
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
  } catch (error) {
    console.warn('URLライフサイクル判定の取得に失敗しました。既存判定で続行します。', error);
    return null;
  }
};
