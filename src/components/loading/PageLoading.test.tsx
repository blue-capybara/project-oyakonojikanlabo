import { cleanup, render, screen } from '@testing-library/react';
import PageLoading from './PageLoading';

describe('PageLoading', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.__OKJL_PERFORMANCE_METRICS__ = [];
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('読み込み状態を支援技術にも伝える', () => {
    render(<PageLoading />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('ページを読み込んでいます…');
  });

  it('表示後に取り除かれたとき、Suspenseローダーの表示時間を記録する', () => {
    const { unmount } = render(<PageLoading />);
    unmount();

    expect(window.__OKJL_PERFORMANCE_METRICS__).toContainEqual(
      expect.objectContaining({ name: 'suspense_loader_visible' }),
    );
  });
});
