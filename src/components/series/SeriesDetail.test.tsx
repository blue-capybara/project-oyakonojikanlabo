import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, expect, it, vi } from 'vitest';
import SeriesDetail from './SeriesDetail';
import SeriesArticleNavigation from './SeriesArticleNavigation';
import type { SeriesData, SeriesNavigationData } from '../../lib/series';

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
        navigation={{
          episodeNumber: 1,
          series: { ...series, episodes: undefined, upcomingEpisodes: [] },
          previous: null,
          next: null,
        }}
        footer
      />,
    );
    expect(screen.getByRole('heading', { name: series.title })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /第1回/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/次の回/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /連載の紹介/ })).toHaveAttribute(
      'href',
      '/series/parent-time',
    );
  });
});

describe('記事の連載ナビゲーション', () => {
  it('目次は前後以外の公開回と予定日も表示し、現在と予告にはリンクを付けない', () => {
    const { container } = render(
      <SeriesArticleNavigation
        footer
        currentPost={{ title: '現在の記事' }}
        navigation={{
          episodeNumber: 2,
          series: {
            ...series,
            upcomingEpisodes: [{ episodeNumber: 4, scheduledAt: '2026-11-01T15:00:00Z' }],
          },
        }}
      />,
      { wrapper },
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('link', { name: /第1回/ })).toHaveAttribute('href', '/first');
    expect(screen.getByRole('link', { name: /第3回/ })).toHaveAttribute('href', '/third');
    expect(container.querySelector('[aria-current="page"]')).toHaveTextContent('現在の記事');
    expect(container.querySelector('[aria-current="page"]')?.closest('a')).toBeNull();
    expect(screen.getByText('11月2日').closest('a')).toBeNull();
  });
  const navigation: SeriesNavigationData = {
    episodeNumber: 3,
    series: { ...series, episodes: undefined, upcomingEpisodes: [] },
    previous: { ...series.episodes[0], episodeNumber: 2, title: '前の記事', path: '/previous' },
    next: { ...series.episodes[0], episodeNumber: 4, title: '次の記事', path: '/next' },
  };

  it('冒頭では所属ラベル・連載へのリンク・現在の回番号だけを表示する', () => {
    render(<SeriesArticleNavigation navigation={navigation} />, { wrapper });
    expect(screen.getByRole('navigation', { name: 'この記事の連載' })).toBeInTheDocument();
    expect(screen.getByText('連載')).toBeInTheDocument();
    expect(screen.getByText('第3回')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: series.title })).toHaveAttribute(
      'href',
      '/series/parent-time',
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('末尾は連載名と公開済みの全回・公開予定を表示する', () => {
    render(
      <SeriesArticleNavigation
        navigation={navigation}
        currentPost={{ title: '現在の記事' }}
        footer
      />,
      { wrapper },
    );
    expect(screen.getByRole('heading', { name: series.title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: series.title })).toBeInTheDocument();
    expect(screen.getByText('この記事')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /第2回\s+前の記事/ })).toHaveAttribute(
      'href',
      '/previous',
    );
    expect(screen.getByRole('link', { name: /第4回\s+次の記事/ })).toHaveAttribute('href', '/next');
    expect(screen.getByRole('link', { name: '連載の紹介を見る' })).toHaveAttribute(
      'href',
      '/series/parent-time',
    );
  });

  it('公開済みの前の回しかなければ、次の回の情報は表示しない', () => {
    render(<SeriesArticleNavigation navigation={{ ...navigation, next: null }} footer />, {
      wrapper,
    });
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByText(/次の回/)).not.toBeInTheDocument();
    expect(screen.queryByText('次の記事')).not.toBeInTheDocument();
  });

  it('前後の公開済み記事がない場合、末尾のリンクは連載詳細への1件だけにする', () => {
    render(
      <SeriesArticleNavigation navigation={{ ...navigation, previous: null, next: null }} footer />,
      { wrapper },
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByText(/前の回|次の回/)).not.toBeInTheDocument();
  });

  it('プレビューでは署名付きの連載リンクを冒頭・末尾とも維持する', () => {
    const previewPath = '/preview?p=1&series_preview=1#token=local-fixture';
    const previewNavigation = { ...navigation, series: { ...series, previewPath } };
    render(
      <>
        <SeriesArticleNavigation navigation={previewNavigation} />
        <SeriesArticleNavigation navigation={previewNavigation} footer />
      </>,
      { wrapper },
    );
    expect(screen.getByRole('link', { name: series.title })).toHaveAttribute('href', previewPath);
    expect(screen.getByRole('link', { name: '連載の紹介を見る' })).toHaveAttribute(
      'href',
      previewPath,
    );
    expect(screen.getAllByText('第3回')).toHaveLength(1);
  });
});
