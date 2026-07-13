import { describe, expect, it } from 'vitest';
import { resolveUrlLifecycleFromGraphQL } from './urlLifecycle';

describe('resolveUrlLifecycleFromGraphQL', () => {
  it('記事クエリの extensions から公開状態を取得する', () => {
    expect(
      resolveUrlLifecycleFromGraphQL('/Sample-Post/?utm_source=line', {
        extensions: {
          status: 200,
          urlLifecycle: {
            path: '/sample-post',
            status: 200,
            reason: 'published',
            redirectTo: null,
          },
        },
      }),
    ).toEqual({
      path: '/sample-post',
      status: 200,
      reason: 'published',
      redirectTo: null,
    });
  });

  it('extensions のリダイレクト情報を保持する', () => {
    expect(
      resolveUrlLifecycleFromGraphQL('/old-post', {
        extensions: {
          status: 301,
          urlLifecycle: {
            path: '/old-post',
            status: 301,
            reason: 'slug_changed',
            redirectTo: '/new-post',
          },
        },
      }),
    ).toEqual({
      path: '/old-post',
      status: 301,
      reason: 'slug_changed',
      redirectTo: '/new-post',
    });
  });

  it('extensions がない場合は既存のコンテンツ存在判定へ委ねる', () => {
    expect(resolveUrlLifecycleFromGraphQL('/sample-post', {})).toBeNull();
  });

  it('従来の専用クエリの data も解釈できる', () => {
    expect(
      resolveUrlLifecycleFromGraphQL('/closed-post', {
        data: {
          urlLifecycle: {
            path: '/closed-post',
            status: 410,
            reason: 'gone',
            redirectTo: null,
          },
        },
      }),
    ).toEqual({
      path: '/closed-post',
      status: 410,
      reason: 'gone',
      redirectTo: null,
    });
  });
});
