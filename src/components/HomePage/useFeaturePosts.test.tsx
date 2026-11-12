import { act, renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { afterEach, expect, it, vi } from 'vitest';
import { visit } from 'graphql';
import { fetchStaticPostCache } from '../../lib/postCache';
import { featureClient, GET_FEATURES, useFeaturePosts } from './useFeaturePosts';

vi.mock('../../lib/postCache', () => ({ fetchStaticPostCache: vi.fn() }));

const posts = [
  {
    id: '1',
    slug: 'with-excerpt',
    title: '抜粋あり',
    date: '2026-01-01',
    excerpt: '<p>紹介文</p>',
  },
  { id: '2', slug: 'without-excerpt', title: '抜粋なし', date: '2026-01-01', excerpt: '' },
];
const mocks = [
  {
    request: { query: GET_FEATURES },
    result: {
      data: {
        features: {
          nodes: posts.map((post) => ({
            id: `feature-${post.id}`,
            __typename: 'Feature',
            featureSettings: {
              relatedPost: { nodes: [{ ...post, __typename: 'Post', featuredImage: null }] },
            },
          })),
        },
      },
    },
  },
];
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MockedProvider mocks={mocks}>{children}</MockedProvider>
);

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(fetchStaticPostCache).mockReset();
});

it('特集一覧のクエリは記事本文を要求しない', () => {
  const fields: string[] = [];
  visit(GET_FEATURES, {
    Field: (node) => {
      fields.push(node.name.value);
    },
  });
  expect(fields).not.toContain('content');
  expect(fields).toContain('excerpt');
});

it('本文の補完を待たずに一覧を表示し、抜粋が空の記事だけ静的JSONで補う', async () => {
  let finish!: (value: { content: string }) => void;
  vi.mocked(fetchStaticPostCache).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const query = vi.spyOn(featureClient, 'query');
  const { result } = renderHook(() => useFeaturePosts(), { wrapper });
  await waitFor(() => expect(result.current.featurePosts).toHaveLength(2));
  expect(result.current.loading).toBe(false);
  expect(fetchStaticPostCache).toHaveBeenCalledTimes(1);
  expect(fetchStaticPostCache).toHaveBeenCalledWith('without-excerpt', expect.any(AbortSignal));
  expect(result.current.featurePosts[0].post.excerpt).toBe('<p>紹介文</p>');
  await act(async () => {
    finish({ content: '<p>本文由来の紹介文</p>' });
  });
  await waitFor(() =>
    expect(result.current.featurePosts[1].post.content).toBe('<p>本文由来の紹介文</p>'),
  );
  expect(query).not.toHaveBeenCalled();
});

it('静的JSONがない記事だけCMSから本文を補う', async () => {
  vi.mocked(fetchStaticPostCache).mockResolvedValue(null);
  const query = vi
    .spyOn(featureClient, 'query')
    .mockResolvedValue({ data: { post: { content: '<p>CMSの紹介文</p>' } } });
  const { result } = renderHook(() => useFeaturePosts(), { wrapper });
  await waitFor(() =>
    expect(result.current.featurePosts[1]?.post.content).toBe('<p>CMSの紹介文</p>'),
  );
  expect(query).toHaveBeenCalledTimes(1);
  expect(query).toHaveBeenCalledWith(
    expect.objectContaining({ variables: { slug: 'without-excerpt' } }),
  );
});

it('紹介文の補完に失敗しても特集とリンクに必要なデータを残す', async () => {
  vi.mocked(fetchStaticPostCache).mockResolvedValue(null);
  vi.spyOn(featureClient, 'query').mockRejectedValue(new Error('通信エラー'));
  const { result } = renderHook(() => useFeaturePosts(), { wrapper });
  await waitFor(() => expect(featureClient.query).toHaveBeenCalledTimes(1));
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeUndefined();
  expect(result.current.featurePosts.map(({ post }) => post.slug)).toEqual([
    'with-excerpt',
    'without-excerpt',
  ]);
});

it('アンマウント後は補完処理を中断しCMSへ追加問い合わせしない', async () => {
  let finish!: (value: null) => void;
  vi.mocked(fetchStaticPostCache).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const query = vi.spyOn(featureClient, 'query');
  const { unmount } = renderHook(() => useFeaturePosts(), { wrapper });
  await waitFor(() => expect(fetchStaticPostCache).toHaveBeenCalledTimes(1));
  const signal = vi.mocked(fetchStaticPostCache).mock.calls[0][1];
  unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    finish(null);
  });
  expect(query).not.toHaveBeenCalled();
});
