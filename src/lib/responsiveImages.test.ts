import { describe, expect, it } from 'vitest';
import { coverImageSize } from './responsiveImages';

describe('coverImageSize', () => {
  it('横長写真を正方形に切り抜く場合も、必要な元画像幅を指定する', () => {
    expect(coverImageSize({ mediaDetails: { width: 1200, height: 675 } }, 358, 358)).toBe(
      `max(358px, calc(358px * ${1200 / 675}))`,
    );
  });

  it('縦長画像や寸法不明の画像も表示枠の幅を確保する', () => {
    expect(coverImageSize({ mediaDetails: { width: 600, height: 900 } }, 112, 80)).toBe(
      `max(112px, calc(80px * ${600 / 900}))`,
    );
    expect(coverImageSize(null, 56, 56)).toBe('max(56px, calc(56px * 1))');
  });

  it('レスポンシブな表示枠にも対応する', () => {
    expect(coverImageSize(undefined, 'calc(100vw - 32px)', 192)).toBe(
      'max(calc(100vw - 32px), calc(192px * 1))',
    );
  });
});
