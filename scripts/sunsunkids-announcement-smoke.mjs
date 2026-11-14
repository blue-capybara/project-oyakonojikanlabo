// 静的サーバーを起動してから実行します。購入処理は行いません。
// node scripts/sunsunkids-announcement-smoke.mjs [テストページのURL]
import assert from 'node:assert/strict';
import { chromium } from 'playwright-chromium';

const url = process.argv[2] || 'http://127.0.0.1:8765/lp/sunsunkidsvillage/index-test.html';
const bannerUrl = 'https://oyakonojikanlabo.jp/lp/sunsunkidsvillage/images/product-image-1.webp';
const storageKey = 'sunsunkidsvillage:announcement:' + new URL(url).pathname + ':new-product-20261102';
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : { channel: 'chrome' });

async function createPage({ width = 390, config = {}, hash = '', reducedMotion = 'no-preference', failImage = false, blockStorage = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion });
  const page = await context.newPage();
  page.on('dialog', dialog => dialog.accept('sunsun2025'));
  page.on('pageerror', error => { throw error; });
  // 告知の確認に不要なShopify通信を止め、HTML内の設定は各確認に合わせます。
  await page.route('**/buy-button-storefront.min.js', route => route.abort());
  await page.route('**/js/announcement.js?*', async route => {
    const response = await route.fetch();
    const body = `Object.assign(window.SUNSUN_ANNOUNCEMENT, ${JSON.stringify(config)});\n${await response.text()}`;
    await route.fulfill({ response, body });
  });
  if (failImage) await page.route(bannerUrl, route => route.abort());
  if (blockStorage) await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('保存できません', 'SecurityError'); } });
  });
  await page.goto(url + hash, { waitUntil: 'domcontentloaded' });
  return { context, page, dialog: page.locator('#announcement-dialog') };
}

async function assertNotShown(page, dialog) {
  await page.waitForTimeout(700);
  assert.equal(await dialog.isVisible(), false, '自動表示しないこと');
}

try {
  const desktop = await createPage({ width: 1600 });
  const { page, dialog } = desktop;
  await dialog.waitFor({ state: 'visible', timeout: 12000 });
  await dialog.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(animation => animation.finished)));
  assert.equal(await dialog.locator('img').getAttribute('src'), bannerUrl);
  assert.equal(await dialog.locator('.announcement-close').evaluate(el => el.getBoundingClientRect().width), 60);
  assert.equal(await page.evaluate(() => document.activeElement.className), 'announcement-close');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.className), 'announcement-banner');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.activeElement.className), 'announcement-close');
  assert.equal(await dialog.locator('.announcement-card').evaluate(el => getComputedStyle(el).transform), 'matrix(1, 0, 0, 1, 0, 0)');
  await page.screenshot({ path: '/tmp/sunsun-announcement-1600.png', timeout: 15000 });
  assert.ok(Number(await page.evaluate(key => localStorage.getItem(key), storageKey)) > 0);
  await dialog.locator('.announcement-close').click();
  await dialog.waitFor({ state: 'hidden' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  assert.equal(await dialog.isVisible(), false, '再読み込みしても24時間以内は表示しないこと');
  await page.evaluate(key => localStorage.setItem(key, String(Date.now() - 25 * 60 * 60 * 1000)), storageKey);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await dialog.waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await page.evaluate(key => localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await dialog.waitFor({ state: 'visible' });
  await dialog.locator('.announcement-banner').click();
  await dialog.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => Math.abs(document.getElementById('lineup').getBoundingClientRect().top) < 3);
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('#lineup h2')), true);
  assert.equal(new URL(page.url()).hash, '#lineup');
  await desktop.context.close();
  console.log('PC：初回表示・60pxの閉じるボタン・揺れの停止・キーボード操作・24時間制御・LINE UPへの移動を確認');

  const mobile = await createPage({ config: { delayMs: 100 }, reducedMotion: 'reduce' });
  await mobile.dialog.waitFor({ state: 'visible' });
  const closeBox = await mobile.dialog.locator('.announcement-close').boundingBox();
  const imageBox = await mobile.dialog.locator('img').boundingBox();
  assert.ok(closeBox.x >= 0 && closeBox.x + closeBox.width <= 390 && closeBox.y >= 0);
  assert.ok(imageBox.height <= 700 && imageBox.x >= 16 && imageBox.x + imageBox.width <= 374);
  assert.equal(await mobile.dialog.locator('.announcement-card').evaluate(el => getComputedStyle(el).animationName), 'none');
  await mobile.page.screenshot({ path: '/tmp/sunsun-announcement-390.png', timeout: 15000 });
  await mobile.page.mouse.click(5, 5);
  await mobile.dialog.waitFor({ state: 'hidden' });
  await mobile.context.close();
  console.log('スマートフォン：画像と閉じるボタンの収まり・背景タップ・動きを減らす設定を確認');

  for (const options of [
    { config: { enabled: false, delayMs: 100 } },
    { config: { delayMs: 100, endsAt: '2020-01-01T00:00:00+09:00' } },
    { config: { delayMs: 100 }, hash: '#lineup' },
    { config: { delayMs: 100 }, failImage: true },
    { config: { delayMs: 100 }, blockStorage: true }
  ]) {
    const test = await createPage(options);
    await assertNotShown(test.page, test.dialog);
    await test.context.close();
  }
  console.log('オフ設定・告知終了後・アンカー直アクセス・画像取得失敗・保存できない環境では表示しないことを確認');

  for (const action of ['scroll', 'menu', 'iframe']) {
    const test = await createPage({ config: { delayMs: 500 } });
    if (action === 'scroll') {
      await test.page.mouse.wheel(0, 200);
    } else if (action === 'menu') {
      await test.page.locator('.openbtn').click();
    } else {
      await test.page.evaluate(() => {
        const frame = document.createElement('iframe');
        frame.id = 'interaction-frame';
        frame.srcdoc = '<button>カート操作の確認</button>';
        frame.style.cssText = 'position:fixed;top:0;left:0;width:180px;height:60px;z-index:3000';
        document.body.appendChild(frame);
      });
      await test.page.frameLocator('#interaction-frame').getByRole('button').click();
    }
    await assertNotShown(test.page, test.dialog);
    assert.equal(await test.page.evaluate(key => localStorage.getItem(key), storageKey), null);
    await test.context.close();
  }
  console.log('スクロール・メニュー・iframe内の操作を始めた場合は自動表示せず、表示済みの記録も残さないことを確認');
} finally {
  await browser.close();
}
