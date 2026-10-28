import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import HomePage from './HomePage';

vi.mock('../components/HomePage/useFeaturePosts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../components/HomePage/useFeaturePosts')>()),
  useFeaturePosts: () => ({ featurePosts: posts, loading: false, error: null }),
}));
vi.mock('../components/Layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock('../components/seo/Seo', () => ({ default: () => null }));
vi.mock('../components/HomePage/ArticlesSection', () => ({ default: () => null }));
vi.mock('../components/HomePage/EventsSection', () => ({ default: () => null }));
vi.mock('../components/HomePage/ShoppingSection', () => ({ default: () => null }));
vi.mock('../components/HomePage/PicoBanner', () => ({ default: () => null }));
vi.mock('../components/HomePage/PicoEvents', () => ({ default: () => null }));
vi.mock('../components/HomePage/CollaborationBanner', () => ({ default: () => null }));

const posts = [1, 2, 3, 4, 5, 6].map((id) => ({
  featureId: String(id),
  post: { id: String(id), slug: `article-${id}`, title: `通常特集${id}`, date: '2026-01-01' },
}));
const series = {
  databaseId: 76018,
  slug: 'toyotakazuhiko',
  title: 'とよたかずひこさんインタビュー',
  date: '2026-10-27',
  excerpt: '<p>絵本づくりと「絵本のくつした」誕生の物語</p>',
  featuredImage: { node: { sourceUrl: '/series-image.jpg' } },
  showInFeatured: true,
};
const renderHome = () => {
  const result = render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
  return {
    hero: within(result.container.querySelector('section')!),
    features: within(screen.getByRole('heading', { name: '注目の特集' }).closest('section')!),
  };
};

afterEach(() => vi.restoreAllMocks());

it('掲載連載を両枠の先頭に表示し、画像・紹介文・全リンク・カルーセルを連載に対応させる', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({
        schemaVersion: 1,
        series: [
          { ...series, databaseId: 20, slug: 'older', title: '過去の連載', date: '2026-01-01' },
          {
            ...series,
            databaseId: 21,
            slug: 'hidden',
            title: '掲載しない連載',
            showInFeatured: false,
          },
          series,
        ],
      }),
      { headers: { 'content-type': 'application/json' } },
    ),
  );
  const { hero, features } = renderHome();
  expect(await hero.findByRole('heading', { name: series.title })).toBeInTheDocument();
  expect(hero.getByText('連載')).toBeInTheDocument();
  expect(hero.getByText('絵本づくりと「絵本のくつした」誕生の物語')).toBeInTheDocument();
  expect(hero.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
    '/series/toyotakazuhiko',
    '/series/toyotakazuhiko',
    '/series/toyotakazuhiko',
  ]);
  expect(hero.getByRole('link', { name: '連載を読む' })).toBeInTheDocument();
  expect(hero.getAllByAltText(series.title)[0]).toHaveAttribute('src', '/series-image.jpg');
  expect(hero.getAllByRole('button', { name: /^特集サムネイル/ })).toHaveLength(5);
  expect(features.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
    '/series/toyotakazuhiko',
    '/series/older',
    '/article-1',
    '/article-2',
  ]);
  expect(screen.queryByText('掲載しない連載')).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);

  fireEvent.click(hero.getByRole('button', { name: '次へ' }));
  expect(hero.getByRole('heading', { name: '過去の連載' })).toBeInTheDocument();
  fireEvent.click(hero.getByRole('button', { name: '前へ' }));
  expect(hero.getByRole('heading', { name: series.title })).toBeInTheDocument();
  fireEvent.click(hero.getByRole('button', { name: '特集サムネイル 5' }));
  expect(hero.getByRole('link', { name: '記事を読む' })).toHaveAttribute('href', '/article-3');
  fireEvent.click(hero.getByRole('button', { name: '次へ' }));
  expect(hero.getByRole('heading', { name: series.title })).toBeInTheDocument();
});

it('連載JSONの取得失敗でも通常特集をヒーロー5件・特集枠4件で表示する', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('検証用エラー'));
  const { hero, features } = renderHome();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(hero.getByRole('link', { name: '記事を読む' })).toHaveAttribute('href', '/article-1');
  expect(hero.getAllByRole('button', { name: /^特集サムネイル/ })).toHaveLength(5);
  expect(features.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
    '/article-1',
    '/article-2',
    '/article-3',
    '/article-4',
  ]);
  fireEvent.click(hero.getByRole('button', { name: '前へ' }));
  expect(hero.getByRole('link', { name: '記事を読む' })).toHaveAttribute('href', '/article-5');
});
