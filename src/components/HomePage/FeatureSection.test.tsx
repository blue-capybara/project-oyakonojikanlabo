import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import FeatureSection from './FeatureSection';

const items = [0, 1, 2, 3, 4].map((id) => ({
  featureId: String(id),
  post: { id: String(id), slug: `article-${id}`, title: `特集${id}`, date: '2026-01-01' },
  path: id === 0 ? '/series/family' : `/article-${id}`,
  series: id === 0,
}));

it('共通の表示対象から最大4件を順に表示し、連載詳細へリンクする', () => {
  render(
    <MemoryRouter>
      <FeatureSection items={items} />
    </MemoryRouter>,
  );
  expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
    '/series/family',
    '/article-1',
    '/article-2',
    '/article-3',
  ]);
  expect(screen.getByText('連載')).toBeInTheDocument();
});

it('通常特集の取得エラーがあっても取得済みの連載は表示する', () => {
  render(
    <MemoryRouter>
      <FeatureSection items={items.slice(0, 1)} error />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link')).toHaveAttribute('href', '/series/family');
  expect(screen.queryByText(/取得に失敗/)).not.toBeInTheDocument();
});
