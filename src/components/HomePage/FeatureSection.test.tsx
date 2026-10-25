import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import FeatureSection from './FeatureSection';

vi.mock('./useFeaturePosts', () => ({
  useFeaturePosts: () => ({ featurePosts: [], loading: false, error: null }),
}));
afterEach(() => {
  vi.restoreAllMocks();
});
const posts = [1, 2, 3, 4].map((id) => ({
  featureId: String(id),
  post: { id: String(id), slug: `article-${id}`, title: `通常特集${id}`, date: '2026-01-01' },
}));

it('連載と通常特集を最大4件で混在させ、通常特集の相対順を維持する', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({
        schemaVersion: 1,
        series: [
          {
            databaseId: 10,
            slug: 'family',
            title: '親子連載',
            date: '2026-02-01',
            showInFeatured: true,
          },
          {
            databaseId: 11,
            slug: 'hidden',
            title: '掲載しない連載',
            date: '2026-03-01',
            showInFeatured: false,
          },
        ],
      }),
      { headers: { 'content-type': 'application/json' } },
    ),
  );
  render(
    <MemoryRouter>
      <FeatureSection posts={posts} />
    </MemoryRouter>,
  );
  expect(await screen.findByRole('link', { name: /親子連載/ })).toHaveAttribute(
    'href',
    '/series/family',
  );
  const links = screen.getAllByRole('link');
  expect(links).toHaveLength(4);
  expect(links.map((link) => link.getAttribute('href'))).toEqual([
    '/series/family',
    '/article-1',
    '/article-2',
    '/article-3',
  ]);
  expect(screen.queryByText('掲載しない連載')).not.toBeInTheDocument();
});

it('連載JSONの取得失敗でも既存特集4件を表示する', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('検証用エラー'));
  render(
    <MemoryRouter>
      <FeatureSection posts={posts} />
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(4));
});
