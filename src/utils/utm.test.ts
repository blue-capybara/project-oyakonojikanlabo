import {
  addUtmToLinkUrl,
  addStoredUtmToExternalUrl,
  captureLpUtmFromUrl,
  getStoredUtm,
  installUtmLinkHandler,
  LP_UTM_STORAGE_KEY,
  saveUtmFromUrl,
  UTM_EXPIRE_DAYS,
  UTM_EXPIRE_KEY,
} from './utm';

const setStoredUtm = () => {
  window.localStorage.setItem('utm_source', 'line');
  window.localStorage.setItem('utm_medium', 'social');
  window.localStorage.setItem('utm_campaign', '20260428_kodomonotomo_01');
  window.localStorage.setItem('utm_term', 'picture-book');
  window.localStorage.setItem('utm_content', 'line-menu');
  window.localStorage.setItem('line_id', '01');
  window.localStorage.setItem(UTM_EXPIRE_KEY, String(Date.now() + UTM_EXPIRE_DAYS * 86_400_000));
};

describe('UTM utilities', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.pushState({}, '', '/');
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('初回アクセスのUTM 5項目とline_idをfirst touchとして保存する', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000);

    const saved = saveUtmFromUrl(
      '/?utm_source=line&utm_medium=social&utm_campaign=20260428_kodomonotomo_01&utm_term=picture-book&utm_content=line-menu&line_id=01',
    );

    expect(saved).toBe(true);
    expect(getStoredUtm()).toEqual({
      utm_source: 'line',
      utm_medium: 'social',
      utm_campaign: '20260428_kodomonotomo_01',
      utm_term: 'picture-book',
      utm_content: 'line-menu',
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
    expect(url.searchParams.get('utm_term')).toBe('picture-book');
    expect(url.searchParams.get('utm_content')).toBe('line-menu');
    expect(url.searchParams.get('line_id')).toBe('01');
  });

  it('LPリンクでは7日間保存済みのLINEより現在URLのInstagram UTM一式を優先する', () => {
    setStoredUtm();
    captureLpUtmFromUrl(
      '/article?utm_source=line&utm_medium=social&utm_campaign=line_campaign&utm_content=line-menu',
    );
    window.history.pushState(
      {},
      '',
      '/article?utm_source=instagram&utm_medium=story&utm_campaign=instagram_campaign&utm_term=socks&utm_content=jun01',
    );

    const result = addUtmToLinkUrl(`${window.location.origin}/lp/ehon-socks-award/?preview=1#vote`);
    const url = new URL(result);

    expect(url.pathname).toBe('/lp/ehon-socks-award/');
    expect(url.searchParams.get('preview')).toBe('1');
    expect(url.searchParams.get('utm_source')).toBe('instagram');
    expect(url.searchParams.get('utm_medium')).toBe('story');
    expect(url.searchParams.get('utm_campaign')).toBe('instagram_campaign');
    expect(url.searchParams.get('utm_term')).toBe('socks');
    expect(url.searchParams.get('utm_content')).toBe('jun01');
    expect(url.searchParams.get('line_id')).toBeNull();
    expect(url.hash).toBe('#vote');
  });

  it('現在URLにUTMがない場合は7日以内に最後に取得したUTM一式をLPへ付与する', () => {
    captureLpUtmFromUrl(
      '/article?utm_source=line&utm_medium=social&utm_campaign=line_campaign&utm_content=line-menu',
    );
    window.history.pushState({}, '', '/archive');

    const result = addUtmToLinkUrl('/lp/future-campaign/');
    const url = new URL(result);

    expect(url.searchParams.get('utm_source')).toBe('line');
    expect(url.searchParams.get('utm_medium')).toBe('social');
    expect(url.searchParams.get('utm_campaign')).toBe('line_campaign');
    expect(url.searchParams.get('utm_content')).toBe('line-menu');
  });

  it('新しいUTM付き流入は項目を混在させず、LP用の一式を入れ替える', () => {
    captureLpUtmFromUrl(
      '/article?utm_source=line&utm_medium=social&utm_campaign=line_campaign&utm_content=line-menu',
    );
    captureLpUtmFromUrl('/article?utm_source=instagram&utm_medium=story');
    window.history.pushState({}, '', '/archive');

    const result = addUtmToLinkUrl('/lp/future-campaign/');
    const url = new URL(result);

    expect(url.searchParams.get('utm_source')).toBe('instagram');
    expect(url.searchParams.get('utm_medium')).toBe('story');
    expect(url.searchParams.get('utm_campaign')).toBeNull();
    expect(url.searchParams.get('utm_content')).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(LP_UTM_STORAGE_KEY) ?? '{}')).toMatchObject({
      utm: {
        utm_source: 'instagram',
        utm_medium: 'story',
      },
    });
  });

  it('LP用の保存UTMは7日を過ぎると付与しない', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000);
    captureLpUtmFromUrl('/article?utm_source=line&utm_medium=social&utm_campaign=line_campaign');
    window.history.pushState({}, '', '/archive');
    nowSpy.mockReturnValue(1_000 + UTM_EXPIRE_DAYS * 86_400_000 + 1);

    expect(addUtmToLinkUrl('/lp/future-campaign/')).toBe('/lp/future-campaign/');
    expect(window.localStorage.getItem(LP_UTM_STORAGE_KEY)).toBeNull();
  });

  it('LPリンクに明示済みのUTMがある場合は自動上書きしない', () => {
    window.history.pushState(
      {},
      '',
      '/article?utm_source=instagram&utm_medium=story&utm_campaign=instagram_campaign',
    );
    const href = '/lp/future-campaign/?utm_source=editor&utm_campaign=fixed';

    expect(addUtmToLinkUrl(href)).toBe(href);
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
    expect(addUtmToLinkUrl('/archive?foo=bar')).toBe('/archive?foo=bar');
  });

  it('既存のaタグもクリック直前に外部URLとLP URLを補正する', () => {
    setStoredUtm();
    captureLpUtmFromUrl(
      '/article?utm_source=instagram&utm_medium=story&utm_campaign=instagram_campaign',
    );
    const cleanup = installUtmLinkHandler();

    document.body.innerHTML = `
      <a id="external" href="https://shop.example.com/products/xxx"><span>商品ページへ</span></a>
      <a id="lp" href="/lp/future-campaign/"><span>キャンペーン</span></a>
      <a id="excluded" href="/lp/excluded/" data-utm-propagation="off"><span>除外LP</span></a>
      <a id="internal" href="/event"><span>イベント</span></a>
    `;
    document.querySelectorAll('a').forEach((anchor) => {
      anchor.addEventListener('click', (event) => event.preventDefault());
    });

    document
      .querySelector('#external span')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    document
      .querySelector('#lp span')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    document
      .querySelector('#excluded span')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    document
      .querySelector('#internal span')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    const external = document.querySelector<HTMLAnchorElement>('#external');
    const lp = document.querySelector<HTMLAnchorElement>('#lp');
    const excluded = document.querySelector<HTMLAnchorElement>('#excluded');
    const internal = document.querySelector<HTMLAnchorElement>('#internal');

    expect(external?.href).toContain('utm_source=line');
    expect(external?.href).toContain('utm_campaign=20260428_kodomonotomo_01');
    expect(lp?.href).toContain('utm_source=instagram');
    expect(lp?.href).toContain('utm_campaign=instagram_campaign');
    expect(excluded?.getAttribute('href')).toBe('/lp/excluded/');
    expect(internal?.getAttribute('href')).toBe('/event');

    cleanup();
  });
});
