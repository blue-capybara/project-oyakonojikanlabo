import {
  addStoredUtmToExternalUrl,
  getStoredUtm,
  installUtmExternalLinkHandler,
  saveUtmFromUrl,
  UTM_EXPIRE_DAYS,
  UTM_EXPIRE_KEY,
} from './utm';

const setStoredUtm = () => {
  window.localStorage.setItem('utm_source', 'line');
  window.localStorage.setItem('utm_medium', 'social');
  window.localStorage.setItem('utm_campaign', '20260428_kodomonotomo_01');
  window.localStorage.setItem('line_id', '01');
  window.localStorage.setItem(UTM_EXPIRE_KEY, String(Date.now() + UTM_EXPIRE_DAYS * 86_400_000));
};

describe('UTM utilities', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('初回アクセスのUTMとline_idをfirst touchとして保存する', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000);

    const saved = saveUtmFromUrl(
      '/?utm_source=line&utm_medium=social&utm_campaign=20260428_kodomonotomo_01&line_id=01',
    );

    expect(saved).toBe(true);
    expect(getStoredUtm()).toEqual({
      utm_source: 'line',
      utm_medium: 'social',
      utm_campaign: '20260428_kodomonotomo_01',
      line_id: '01',
    });
    expect(window.localStorage.getItem(UTM_EXPIRE_KEY)).toBe(
      String(1_000 + UTM_EXPIRE_DAYS * 86_400_000),
    );
  });

  it('有効期限内の保存済み値は上書きせず、期限も延長しない', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const existingExpire = 1_000 + UTM_EXPIRE_DAYS * 86_400_000;
    window.localStorage.setItem('utm_source', 'existing-source');
    window.localStorage.setItem(UTM_EXPIRE_KEY, String(existingExpire));

    const saved = saveUtmFromUrl('/?utm_source=line&utm_medium=social');

    expect(saved).toBe(true);
    expect(getStoredUtm()).toEqual({
      utm_source: 'existing-source',
      utm_medium: 'social',
    });
    expect(window.localStorage.getItem(UTM_EXPIRE_KEY)).toBe(String(existingExpire));
  });

  it('期限がない旧UTMデータは削除して、新しい流入を保存する', () => {
    window.localStorage.setItem('utm_source', 'old-line');

    saveUtmFromUrl('/?utm_source=line&utm_medium=social');

    expect(getStoredUtm()).toEqual({
      utm_source: 'line',
      utm_medium: 'social',
    });
  });

  it('空値や存在しない値は保存しない', () => {
    saveUtmFromUrl('/?utm_source=&utm_campaign=20260428_kodomonotomo_01');

    expect(window.localStorage.getItem('utm_source')).toBeNull();
    expect(window.localStorage.getItem('utm_medium')).toBeNull();
    expect(window.localStorage.getItem('utm_campaign')).toBe('20260428_kodomonotomo_01');
    expect(window.localStorage.getItem('line_id')).toBeNull();
  });

  it('期限切れUTMはUTM系キーだけ削除する', () => {
    vi.spyOn(Date, 'now').mockReturnValue(10_000);
    window.localStorage.setItem('utm_source', 'old-line');
    window.localStorage.setItem('utm_medium', 'social');
    window.localStorage.setItem(UTM_EXPIRE_KEY, '9999');
    window.localStorage.setItem('favorite_post', '123');

    expect(getStoredUtm()).toEqual({});
    expect(window.localStorage.getItem('utm_source')).toBeNull();
    expect(window.localStorage.getItem('utm_medium')).toBeNull();
    expect(window.localStorage.getItem(UTM_EXPIRE_KEY)).toBeNull();
    expect(window.localStorage.getItem('favorite_post')).toBe('123');
  });

  it('外部リンクへ保存済みUTMを付与し、既存クエリの同名パラメータは上書きする', () => {
    setStoredUtm();

    const result = addStoredUtmToExternalUrl(
      'https://shop.example.com/products/xxx?variant=123&utm_source=old#detail',
    );
    const url = new URL(result);

    expect(url.origin).toBe('https://shop.example.com');
    expect(url.pathname).toBe('/products/xxx');
    expect(url.hash).toBe('#detail');
    expect(url.searchParams.get('variant')).toBe('123');
    expect(url.searchParams.get('utm_source')).toBe('line');
    expect(url.searchParams.get('utm_medium')).toBe('social');
    expect(url.searchParams.get('utm_campaign')).toBe('20260428_kodomonotomo_01');
    expect(url.searchParams.get('line_id')).toBe('01');
  });

  it('内部リンク、特殊プロトコル、不正URLにはUTMを付与しない', () => {
    setStoredUtm();
    const internalAbsoluteUrl = `${window.location.origin}/event?foo=bar`;

    expect(addStoredUtmToExternalUrl('/event?foo=bar')).toBe('/event?foo=bar');
    expect(addStoredUtmToExternalUrl(internalAbsoluteUrl)).toBe(internalAbsoluteUrl);
    expect(addStoredUtmToExternalUrl('mailto:info@example.com')).toBe('mailto:info@example.com');
    expect(addStoredUtmToExternalUrl('tel:0612345678')).toBe('tel:0612345678');
    expect(addStoredUtmToExternalUrl('javascript:void(0)')).toBe('javascript:void(0)');
    expect(addStoredUtmToExternalUrl('https://[')).toBe('https://[');
  });

  it('既存のaタグもクリック直前に外部URLだけ補正する', () => {
    setStoredUtm();
    const cleanup = installUtmExternalLinkHandler();

    document.body.innerHTML = `
      <a id="external" href="https://shop.example.com/products/xxx"><span>商品ページへ</span></a>
      <a id="internal" href="/event"><span>イベント</span></a>
    `;
    document.querySelectorAll('a').forEach((anchor) => {
      anchor.addEventListener('click', (event) => event.preventDefault());
    });

    document
      .querySelector('#external span')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    document
      .querySelector('#internal span')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    const external = document.querySelector<HTMLAnchorElement>('#external');
    const internal = document.querySelector<HTMLAnchorElement>('#internal');

    expect(external?.href).toContain('utm_source=line');
    expect(external?.href).toContain('utm_campaign=20260428_kodomonotomo_01');
    expect(internal?.getAttribute('href')).toBe('/event');

    cleanup();
  });
});
