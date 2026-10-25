import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, expect, it, vi } from 'vitest';
import SeriesDetail from './SeriesDetail';
import SeriesArticleNavigation from './SeriesArticleNavigation';
import type { SeriesData } from '../../lib/series';

vi.mock('../Post/WordPressContent', () => ({
  default: ({ html }: { html: string }) => <div>{html}</div>,
}));

const series: SeriesData = {
  databaseId: 1,
  slug: 'parent-time',
  title: '親子の連載',
  content: '連載の紹介文',
  date: '2026-01-01',
  seriesStatus: 'ongoing',
  totalEpisodes: 3,
  publishedCount: 2,
  showInFeatured: true,
  episodes: [
    {
      databaseId: 3,
      episodeNumber: 3,
      title: '第3回の記事',
      path: '/third',
      publishedAt: '2026-01-01',
    },
    {
      databaseId: 2,
      episodeNumber: 1,
      title: '第1回の記事',
      path: '/first',
      publishedAt: '2026-02-01',
    },
  ],
  upcomingEpisodes: [{ episodeNumber: 2, scheduledAt: '2026-12-01' }],
};
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <MemoryRouter>{children}</MemoryRouter>
  </HelmetProvider>
);

describe('連載の読者向けUI', () => {
  it('公開日によらず回番号順で表示し、予定・総回数・第1回への導線を表示する', () => {
    render(<SeriesDetail series={series} />, { wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('親子の連載');
    expect(screen.getAllByRole('heading', { level: 3 }).map((item) => item.textContent)).toEqual([
      '第1回の記事',
      '第3回の記事',
    ]);
    expect(screen.getByText('全3回')).toBeInTheDocument();
    expect(screen.getByText('2回公開')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /第1回から読む/ })).toHaveAttribute('href', '/first');
    expect(screen.getByText(/公開予定/).closest('a')).toBeNull();
  });

  it('総回数未定・公開記事ゼロでも紹介を表示し、第1回リンクは出さない', () => {
    render(
      <SeriesDetail
        series={{
          ...series,
          totalEpisodes: null,
          episodes: [],
          publishedCount: 0,
          upcomingEpisodes: [],
        }}
      />,
      { wrapper },
    );
    expect(screen.queryByText(/全.*回/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /第1回から読む/ })).not.toBeInTheDocument();
    expect(screen.getByText('記事の公開を準備しています。')).toBeInTheDocument();
  });

  it('所属なしではUIを追加せず、次回が未公開なら次回リンクを出さない', () => {
    const { rerender, container } = render(<SeriesArticleNavigation />, { wrapper });
    expect(container).toBeEmptyDOMElement();
    rerender(
      <SeriesArticleNavigation
        navigation={{ episodeNumber: 1, series, previous: null, next: null }}
        footer
      />,
    );
    expect(screen.getByRole('navigation')).toHaveTextContent('第1回');
    expect(screen.queryByText(/次の回/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /連載の紹介/ })).toHaveAttribute(
      'href',
      '/series/parent-time',
    );
  });
});
