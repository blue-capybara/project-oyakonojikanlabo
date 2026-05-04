import { render, waitFor } from '@testing-library/react';
import WordPressContent from './WordPressContent';
import { UTM_EXPIRE_DAYS, UTM_EXPIRE_KEY } from '../../utils/utm';

const setStoredUtm = () => {
  window.localStorage.setItem('utm_source', 'line');
  window.localStorage.setItem('utm_medium', 'social');
  window.localStorage.setItem('utm_campaign', '20260428_kodomonotomo_01');
  window.localStorage.setItem('line_id', '01');
  window.localStorage.setItem(UTM_EXPIRE_KEY, String(Date.now() + UTM_EXPIRE_DAYS * 86_400_000));
};

const getShadowRoot = (container: HTMLElement) => {
  const host = container.querySelector<HTMLElement>('.post-content');
  if (!host?.shadowRoot) {
    throw new Error('Shadow DOM が作成されていません。');
  }
  return host.shadowRoot;
};

describe('WordPressContent', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setStoredUtm();
  });

  it('GraphQL由来の本文外部リンクに保存済みUTMを付与する', async () => {
    const { container } = render(
      <WordPressContent
        className="post-content"
        html={`
          <a href="https://shop.example.com/products/xxx?utm_source=old&variant=123">商品ページへ</a>
          <a href="/archive?foo=bar">内部リンク</a>
          <a href="mailto:info@example.com">メール</a>
        `}
      />,
    );

    await waitFor(() => {
      expect(getShadowRoot(container).querySelectorAll('a[href]')).toHaveLength(3);
    });

    const shadowRoot = getShadowRoot(container);
    const [external, internal, mail] = Array.from(
      shadowRoot.querySelectorAll<HTMLAnchorElement>('a[href]'),
    );
    const externalUrl = new URL(external.href);

    expect(externalUrl.searchParams.get('utm_source')).toBe('line');
    expect(externalUrl.searchParams.get('utm_medium')).toBe('social');
    expect(externalUrl.searchParams.get('utm_campaign')).toBe('20260428_kodomonotomo_01');
    expect(externalUrl.searchParams.get('line_id')).toBe('01');
    expect(externalUrl.searchParams.get('variant')).toBe('123');
    expect(internal.getAttribute('href')).toBe('/archive?foo=bar');
    expect(mail.getAttribute('href')).toBe('mailto:info@example.com');
  });

  it('Arkheリンクボックスの手動遷移にも保存済みUTMを付与する', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { container } = render(
      <WordPressContent
        className="post-content"
        html={`
          <div data-arkb-linkbox="1">
            <a data-arkb-link="1" href="https://shop.example.com/products/xxx" target="_blank">商品ページへ</a>
            <span>リンクボックス本文</span>
          </div>
        `}
      />,
    );

    await waitFor(() => {
      expect(getShadowRoot(container).querySelector('[data-arkb-linkbox="1"] span')).not.toBeNull();
    });

    getShadowRoot(container)
      .querySelector('[data-arkb-linkbox="1"] span')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('utm_campaign=20260428_kodomonotomo_01'),
      '_blank',
      'noopener,noreferrer',
    );
  });
});
