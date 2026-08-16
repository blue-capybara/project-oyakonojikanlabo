const POST_CACHE_SCHEMA_VERSION = 1;
const EMBEDDED_POST_CACHE_ID = 'ojl-post-cache';

interface PostCacheEnvelope<T> {
  schemaVersion: number;
  slug: string;
  path: string;
  generatedAt: string;
  post: T;
}

const isPostCacheEnvelope = <T>(value: unknown): value is PostCacheEnvelope<T> => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<PostCacheEnvelope<T>>;
  return (
    candidate.schemaVersion === POST_CACHE_SCHEMA_VERSION &&
    typeof candidate.slug === 'string' &&
    typeof candidate.path === 'string' &&
    typeof candidate.generatedAt === 'string' &&
    candidate.post !== null &&
    typeof candidate.post === 'object'
  );
};

const normalizeSlug = (value: string) => value.trim().replace(/^\/+|\/+$/g, '');

export const readEmbeddedPostCache = <T>(slug: string): T | null => {
  if (typeof document === 'undefined') return null;

  const element = document.getElementById(EMBEDDED_POST_CACHE_ID);
  if (!element?.textContent) return null;

  try {
    const payload: unknown = JSON.parse(element.textContent);
    if (!isPostCacheEnvelope<T>(payload)) return null;
    if (normalizeSlug(payload.slug) !== normalizeSlug(slug)) return null;
    return payload.post;
  } catch {
    return null;
  }
};

export const fetchStaticPostCache = async <T>(
  slug: string,
  signal?: AbortSignal,
): Promise<T | null> => {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return null;

  try {
    const response = await fetch(`/post-cache/${encodeURIComponent(normalizedSlug)}.json`, {
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) return null;

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (!contentType.includes('application/json')) return null;

    const payload: unknown = await response.json();
    if (!isPostCacheEnvelope<T>(payload)) return null;
    if (normalizeSlug(payload.slug) !== normalizedSlug) return null;

    return payload.post;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    return null;
  }
};
