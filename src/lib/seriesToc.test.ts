import { describe, expect, it } from 'vitest';
import {
  seriesTocRows,
  hasSeriesNavigationSlot,
  replaceSeriesNavigationSlots,
  formatSeriesScheduledDate,
} from './seriesToc.mjs';
import type { SeriesNavigationData } from './series';

describe('連載目次の公開データと配置', () => {
  const navigation: SeriesNavigationData = {
    episodeNumber: 2,
    series: {
      databaseId: 10,
      slug: 'sample',
      title: '連載',
      episodes: [
        {
          databaseId: 3,
          episodeNumber: 3,
          title: '未公開の正式タイトル',
          path: '/secret',
          publishedAt: '',
          preview: true,
        },
        { databaseId: 2, episodeNumber: 2, title: '現在', path: '/second', publishedAt: '' },
        { databaseId: 1, episodeNumber: 1, title: '最初', path: '/first', publishedAt: '' },
      ],
      upcomingEpisodes: [{ episodeNumber: 3, scheduledAt: '2026-11-01T15:00:00Z' }],
    },
  };
  it('公開済み回・現在の回・許可済み予告を番号順にまとめ、未公開タイトルやURLは渡さない', () => {
    const rows = seriesTocRows(navigation, { title: '現在の本文タイトル' });
    expect(rows.map((row) => row.episodeNumber)).toEqual([1, 2, 3]);
    expect(rows[1]).toMatchObject({ current: true, path: null, title: '現在の本文タイトル' });
    expect(rows[2]).toEqual({
      type: 'upcoming',
      episodeNumber: 3,
      scheduledAt: '2026-11-01T15:00:00Z',
    });
    expect(JSON.stringify(rows)).not.toMatch(/未公開の正式タイトル|\/secret/);
    expect(formatSeriesScheduledDate('2026-11-01T15:00:00Z')).toBe('11月2日');
  });
  it('公開済みの回と予告が重なれば公開済みを優先し、未所属は空にする', () => {
    const rows = seriesTocRows({
      ...navigation,
      series: {
        ...navigation.series,
        upcomingEpisodes: [{ episodeNumber: 1, scheduledAt: '2026-11-02' }],
      },
    });
    expect(rows[0].type).toBe('episode');
    expect(seriesTocRows(null)).toEqual([]);
  });
  it('配置枠があれば最初の一つだけ置き換え、前後のLINE・商品HTMLを保つ', () => {
    const marker = '<div data-ojl-series-navigation></div>';
    const html =
      '<p>本文</p>' +
      marker +
      '<a href="https://line.me/example">LINE</a>' +
      marker +
      '<div class="shop">店舗</div>';
    expect(hasSeriesNavigationSlot(html)).toBe(true);
    expect(replaceSeriesNavigationSlots(html, '<nav>目次</nav>')).toBe(
      '<p>本文</p><nav>目次</nav><a href="https://line.me/example">LINE</a><div class="shop">店舗</div>',
    );
    expect(hasSeriesNavigationSlot('&lt;div data-ojl-series-navigation&gt;&lt;/div&gt;')).toBe(
      false,
    );
    expect(hasSeriesNavigationSlot('<!-- ' + marker + ' -->')).toBe(false);
    expect(hasSeriesNavigationSlot('<script>const example="' + marker + '"</script>')).toBe(false);
    expect(hasSeriesNavigationSlot('<div data-ojl-series-navigation-other></div>')).toBe(false);
    expect(replaceSeriesNavigationSlots(html, '')).not.toContain('data-ojl-series-navigation');
  });
});
