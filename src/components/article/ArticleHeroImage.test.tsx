import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ArticleHeroImage from './ArticleHeroImage';

describe('ArticleHeroImage', () => {
  it('アイキャッチへレスポンシブ画像属性と元画像サイズを設定する', () => {
    render(
      <ArticleHeroImage
        src="https://cms.example.com/hero.jpg"
        srcSet="https://cms.example.com/hero-300.jpg 300w, https://cms.example.com/hero.jpg 1200w"
        width={1200}
        height={675}
        alt="記事タイトル"
      />,
    );

    const image = screen.getByAltText('記事タイトル');
    expect(image).toHaveAttribute(
      'srcset',
      'https://cms.example.com/hero-300.jpg 300w, https://cms.example.com/hero.jpg 1200w',
    );
    expect(image).toHaveAttribute('sizes', '(min-width: 1280px) 1280px, 100vw');
    expect(image).toHaveAttribute('width', '1200');
    expect(image).toHaveAttribute('height', '675');
  });
});
