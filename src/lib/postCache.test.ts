import { fetchStaticPostCache, readEmbeddedPostCache } from './postCache';

interface TestPost {
  databaseId: number;
  title: string;
}

const createEnvelope = (slug: string, post: TestPost) => ({
  schemaVersion: 1,
  slug,
  path: `/${slug}`,
  generatedAt: '2026-08-16T00:00:00.000Z',
  post,
});

describe('postCache', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('HTMLへ埋め込まれた同一記事のデータを返す', () => {
    const element = document.createElement('script');
    element.id = 'ojl-post-cache';
    element.type = 'application/json';
    element.textContent = JSON.stringify(
      createEnvelope('sample-post', { databaseId: 10, title: 'サンプル記事' }),
    );
    document.body.appendChild(element);

    expect(readEmbeddedPostCache<TestPost>('sample-post')).toEqual({
      databaseId: 10,
      title: 'サンプル記事',
    });
    expect(readEmbeddedPostCache<TestPost>('another-post')).toBeNull();
  });

  it('同一オリジンの静的JSONを取得する', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify(createEnvelope('sample-post', { databaseId: 11, title: '静的記事' })),
        { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } },
      ),
    );

    await expect(fetchStaticPostCache<TestPost>('sample-post')).resolves.toEqual({
      databaseId: 11,
      title: '静的記事',
    });
    expect(fetch).toHaveBeenCalledWith('/post-cache/sample-post.json', {
      headers: { Accept: 'application/json' },
      signal: undefined,
    });
  });

  it('SPAフォールバックのHTMLはキャッシュとして扱わない', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<!doctype html><title>親子の時間研究所</title>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );

    await expect(fetchStaticPostCache<TestPost>('missing-post')).resolves.toBeNull();
  });
});
