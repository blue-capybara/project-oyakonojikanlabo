import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import PostDetailPage from './PostDetailPage';

const mocks = vi.hoisted(() => ({
  rawRequest: vi.fn(),
  readEmbeddedPostCache: vi.fn(),
  fetchStaticPostCache: vi.fn(),
}));

vi.mock('graphql-request', () => ({
  gql: (parts: TemplateStringsArray) => parts.join(''),
  rawRequest: mocks.rawRequest,
}));

vi.mock('../lib/postCache', () => ({
  readEmbeddedPostCache: mocks.readEmbeddedPostCache,
  fetchStaticPostCache: mocks.fetchStaticPostCache,
}));

vi.mock('../components/Layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../components/Breadcrumb', () => ({ default: () => null }));
vi.mock('../components/Post/WordPressContent', () => ({
  default: ({ html }: { html: string }) => <div data-testid="article-body">{html}</div>,
}));
vi.mock('../components/article/ArticleHeroImage', () => ({ default: () => null }));
vi.mock('../components/article/ArticleTitleBlock', () => ({
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('../components/article/ArticleBodyContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../components/seo/Seo', () => ({ default: () => null }));
vi.mock('./GonePage', () => ({ default: () => <div>410</div> }));
vi.mock('./NotFoundPage', () => ({ default: () => <div>404</div> }));
vi.mock('../hooks/useFavorite', () => ({
  default: () => ({
    isFavorited: false,
    loading: false,
    processing: false,
    error: null,
    toggleFavorite: vi.fn(),
  }),
}));
vi.mock('../config/featureFlags', () => ({ getFeatureFlag: () => false }));
vi.mock('../lib/ga', () => ({
  send404Event: vi.fn(),
  sendRelatedPostClickEvent: vi.fn(),
  sendShareClickEvent: vi.fn(),
}));
vi.mock('../lib/urlLifecycle', () => ({ resolveUrlLifecycleFromGraphQL: () => undefined }));
vi.mock('../lib/frontendPerformance', () => ({
  measureFrontendOperation: (_name: string, operation: () => Promise<unknown>) => operation(),
}));

const post = {
  databaseId: 123,
  title: '静的キャッシュの記事',
  date: '2026-08-16T00:00:00',
  content: '<p>初期表示する記事本文</p>',
  excerpt: '<p>記事の説明</p>',
  customCss: null,
  customJs: null,
  featuredImage: null,
  tags: { nodes: [] },
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/sample-post']}>
      <Routes>
        <Route path="/:slug" element={<PostDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('PostDetailPageの記事取得優先順位', () => {
  beforeEach(() => {
    mocks.rawRequest.mockReset();
    mocks.readEmbeddedPostCache.mockReset();
    mocks.fetchStaticPostCache.mockReset();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('埋め込みキャッシュがあれば静的JSONとGraphQLを呼ばない', async () => {
    mocks.readEmbeddedPostCache.mockReturnValue(post);

    renderPage();

    expect(await screen.findByTestId('article-body')).toHaveTextContent('初期表示する記事本文');
    expect(mocks.fetchStaticPostCache).not.toHaveBeenCalled();
    expect(mocks.rawRequest).not.toHaveBeenCalled();
  });

  it('SPA遷移では静的JSONを優先し、成功時はGraphQLを呼ばない', async () => {
    mocks.readEmbeddedPostCache.mockReturnValue(null);
    mocks.fetchStaticPostCache.mockResolvedValue(post);

    renderPage();

    expect(await screen.findByTestId('article-body')).toHaveTextContent('初期表示する記事本文');
    expect(mocks.fetchStaticPostCache).toHaveBeenCalledWith('sample-post', expect.any(AbortSignal));
    expect(mocks.rawRequest).not.toHaveBeenCalled();
  });

  it('静的キャッシュを利用できない場合だけGraphQLへフォールバックする', async () => {
    mocks.readEmbeddedPostCache.mockReturnValue(null);
    mocks.fetchStaticPostCache.mockResolvedValue(null);
    mocks.rawRequest.mockResolvedValue({ data: { post }, extensions: {} });

    renderPage();

    expect(await screen.findByTestId('article-body')).toHaveTextContent('初期表示する記事本文');
    await waitFor(() => expect(mocks.rawRequest).toHaveBeenCalledTimes(1));
  });
});
