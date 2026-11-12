import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import type { ResponsiveImage } from '../lib/responsiveImages';
import EventDetailPage from './EventDetailPage';

const mocks = vi.hoisted(() => ({ request: vi.fn(), lifecycle: vi.fn() }));
vi.mock('graphql-request', async (original) => ({
  ...(await original<typeof import('graphql-request')>()),
  request: mocks.request,
}));
vi.mock('../lib/urlLifecycle', () => ({ fetchUrlLifecycle: mocks.lifecycle }));
vi.mock('../components/Layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock('../components/Breadcrumb', () => ({ default: () => null }));
vi.mock('../components/seo/Seo', () => ({ default: () => null }));
vi.mock('../hooks/useFavorite', () => ({
  default: () => ({
    isFavorited: false,
    loading: false,
    processing: false,
    error: null,
    toggleFavorite: vi.fn(),
  }),
}));
vi.mock('../hooks/useSwipe', () => ({ default: () => ({ bind: {}, touchAction: 'pan-y' }) }));
vi.mock('../config/featureFlags', () => ({ getFeatureFlag: () => false }));
vi.mock('../lib/ga', () => ({ send404Event: vi.fn(), sendShareClickEvent: vi.fn() }));
vi.mock('./GonePage', () => ({ default: () => <div>410</div> }));
vi.mock('./NotFoundPage', () => ({ default: () => <div>404</div> }));

const image = (name: string): ResponsiveImage & { sourceUrl: string; altText: string } => ({
  sourceUrl: `/${name}.jpg`,
  altText: name,
  srcSet: `/${name}-300.jpg 300w, /${name}.jpg 1400w`,
  mediaDetails: { width: 1400, height: 2000 },
});
const createEvent = () => ({
  id: 'event-1',
  slug: 'test-event',
  title: '画像最適化イベント',
  content: '<p>イベント本文</p>',
  computedScheduleStatus: 'current',
  eventCpt: {
    mainImage: { node: image('poster') },
    summary: '<p>イベント紹介</p>',
    artists: { nodes: [{ __typename: 'Artist', title: '作家', slug: 'test-artist' }] },
  },
  eventDetailExt: { gallery: { nodes: [image('poster'), image('gallery')] } },
});
const artist = {
  id: 'artist-1',
  slug: 'test-artist',
  title: '作家',
  featuredImage: { node: image('featured-artist') },
  artistInformation: {
    name: '作家',
    profileImage: { node: image('profile') },
    thumbnails: { nodes: [image('artist-gallery')] },
    relatedBooks: [{ title: '絵本', coverImage: { node: image('book') } }],
  },
};
let event = createEvent();
beforeEach(() => {
  event = createEvent();
  mocks.request
    .mockReset()
    .mockImplementation((_endpoint, query: string) =>
      Promise.resolve(query.includes('GetArtistDetail') ? { artist } : { event }),
    );
  mocks.lifecycle.mockReset().mockResolvedValue({ status: 200 });
});
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/event/test-event']}>
      <Routes>
        <Route path="/event/:slug" element={<EventDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
const mainImages = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLImageElement>('img[fetchpriority="high"]'));

it('イベント画像の情報をギャラリー重複除去後も保持し、メインとサムネイルへ渡す', async () => {
  const { container } = renderPage();
  await screen.findByRole('heading', { name: event.title });
  expect(mainImages(container)).toHaveLength(2);
  for (const img of mainImages(container)) {
    expect(img).toHaveAttribute('src', '/poster.jpg');
    expect(img).toHaveAttribute('srcset', image('poster').srcSet);
    expect(img).toHaveAttribute(
      'sizes',
      expect.stringContaining('calc(810.6666666666666px * 0.7)'),
    );
    expect(img).not.toHaveAttribute('loading', 'lazy');
  }
  const thumb = screen
    .getAllByRole('button', { name: 'ギャラリー画像1を表示' })[0]
    .querySelector('img');
  expect(thumb).toHaveAttribute('srcset', image('poster').srcSet);
  expect(thumb).toHaveAttribute('sizes', 'max(80px, calc(80px * 0.7))');
  expect(thumb).toHaveAttribute('loading', 'lazy');
  expect(screen.queryByRole('button', { name: 'ギャラリー画像3を表示' })).not.toBeInTheDocument();
  expect(mocks.lifecycle).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(2));
});

it('ギャラリーを切り替えても画像候補・代替文・前後移動を維持する', async () => {
  const { container } = renderPage();
  await screen.findByRole('heading', { name: event.title });
  await screen.findAllByAltText('profile');
  fireEvent.click(screen.getAllByRole('button', { name: '次の画像へ' })[0]);
  expect(mainImages(container)[0]).toHaveAttribute('src', '/gallery.jpg');
  expect(mainImages(container)[0]).toHaveAttribute('srcset', image('gallery').srcSet);
  expect(mainImages(container)[0]).toHaveAttribute('alt', 'gallery');
  fireEvent.click(screen.getAllByRole('button', { name: '前の画像へ' })[0]);
  expect(mainImages(container)[0]).toHaveAttribute('src', '/poster.jpg');
});

it('作家写真・作品・書影に画像候補と遅延読み込みを適用する', async () => {
  renderPage();
  const profiles = await screen.findAllByAltText('profile');
  expect(profiles[0]).toHaveAttribute('srcset', image('profile').srcSet);
  expect(profiles[0]).toHaveAttribute('loading', 'lazy');
  const book = screen.getByAltText('book');
  expect(book).toHaveAttribute('srcset', image('book').srcSet);
  expect(book).toHaveAttribute('sizes', 'max(64px, calc(80px * 0.7))');
  expect(book).toHaveAttribute('loading', 'lazy');
  fireEvent.click(screen.getByRole('button', { name: '作家の画像 2 を表示' }));
  const galleryImages = screen.getAllByAltText('artist-gallery');
  expect(
    galleryImages.every((img) => img.getAttribute('srcset') === image('artist-gallery').srcSet),
  ).toBe(true);
});

it.each(['srcSet', 'mediaDetails'] as const)('%sがない場合は元の画像URLを使う', async (field) => {
  event.eventCpt.mainImage.node[field] = null;
  event.eventCpt.artists.nodes = [];
  const { container } = renderPage();
  await screen.findByRole('heading', { name: event.title });
  expect(mainImages(container)[0]).toHaveAttribute('src', '/poster.jpg');
  expect(mainImages(container)[0]).not.toHaveAttribute('srcset');
});

it.each([404, 410])('URL状態が%sの場合はイベント画像を取得しない', async (status) => {
  mocks.lifecycle.mockResolvedValue({ status });
  const { container } = renderPage();
  await screen.findByText(String(status));
  expect(mocks.request).not.toHaveBeenCalled();
  expect(mainImages(container)).toHaveLength(0);
});
