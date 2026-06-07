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
    window.sessionStorage.clear();
    window.history.pushState({}, '', '/');
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

  it('GraphQL由来のLPリンクには現在の記事URLのUTM 5項目を優先して付与する', async () => {
    window.history.pushState(
      {},
      '',
      '/ehon-no-kutusita-taisyo-2026?utm_source=instagram&utm_medium=story&utm_campaign=ehon_socks_award_2026&utm_term=picture-book&utm_content=jun01',
    );
    const { container } = render(
      <WordPressContent
        className="post-content"
        html={`
          <a href="${window.location.origin}/lp/ehon-socks-award/?preview=1#vote">特設ページ</a>
          <a href="/archive">記事一覧</a>
          <a href="/lp/excluded/" data-utm-propagation="off">除外LP</a>
        `}
      />,
    );

    await waitFor(() => {
      expect(getShadowRoot(container).querySelectorAll('a[href]')).toHaveLength(3);
    });

    const [lp, internal, excluded] = Array.from(
      getShadowRoot(container).querySelectorAll<HTMLAnchorElement>('a[href]'),
    );
    const lpUrl = new URL(lp.href);

    expect(lpUrl.pathname).toBe('/lp/ehon-socks-award/');
    expect(lpUrl.searchParams.get('preview')).toBe('1');
    expect(lpUrl.searchParams.get('utm_source')).toBe('instagram');
    expect(lpUrl.searchParams.get('utm_medium')).toBe('story');
    expect(lpUrl.searchParams.get('utm_campaign')).toBe('ehon_socks_award_2026');
    expect(lpUrl.searchParams.get('utm_term')).toBe('picture-book');
    expect(lpUrl.searchParams.get('utm_content')).toBe('jun01');
    expect(lpUrl.searchParams.get('line_id')).toBeNull();
    expect(lpUrl.hash).toBe('#vote');
    expect(internal.getAttribute('href')).toBe('/archive');
    expect(excluded.getAttribute('href')).toBe('/lp/excluded/');
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

  it('ArkheリンクボックスからLPへ遷移する場合も現在URLのUTMを付与する', async () => {
    window.history.pushState(
      {},
      '',
      '/article?utm_source=instagram&utm_medium=story&utm_campaign=instagram_campaign',
    );
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { container } = render(
      <WordPressContent
        className="post-content"
        html={`
          <div data-arkb-linkbox="1">
            <a data-arkb-link="1" href="/lp/future-campaign/" target="_blank">キャンペーンへ</a>
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
      expect.stringContaining('utm_source=instagram'),
      '_blank',
      'noopener,noreferrer',
    );
  });
});
