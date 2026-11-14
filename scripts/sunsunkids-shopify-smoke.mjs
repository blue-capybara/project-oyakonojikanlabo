// 静的サーバーを起動してから実行します。決済画面への移動は遮断し、注文は作成しません。
// node scripts/sunsunkids-shopify-smoke.mjs [テストページのURL]
import assert from 'node:assert/strict';
import { chromium } from 'playwright-chromium';

// 商品の確認はLINE UPへの直接アクセスにし、ファーストビューの告知を表示させません。
const targetUrl = new URL(process.argv[2] || 'http://127.0.0.1:8765/lp/sunsunkidsvillage/index-test.html');
if (!targetUrl.hash) targetUrl.hash = 'lineup';
const url = targetUrl.href;
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : { channel: 'chrome' });

try {
  for (const width of [1600, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    page.on('dialog', dialog => dialog.accept('sunsun2025'));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#shopify-lineup-status').hidden);
    const products = page.frame({ name: 'frame-productSet-459148525820' });
    await products.locator('.shopify-buy__product').first().waitFor();
    const count = await products.locator('.shopify-buy__product').count();
    assert.ok(count >= 2, '複数の商品を取得できること');
    await products.waitForFunction(() => [...document.querySelectorAll('.shopify-buy__product__variant-img')]
      .every(img => img.complete && img.naturalWidth > 0));
    const columns = await products.locator('.shopify-buy__collection-products')
      .evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert.equal(columns, width === 1600 ? 2 : 1, '画面幅に合う列数であること');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '横にはみ出さないこと');
    await page.locator('#lineup').evaluate(el => el.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: `/tmp/sunsun-test-${width}.png`, timeout: 15000 });

    await products.getByRole('button', { name: '詳しく見る' }).first().click();
    await page.locator('.shopify-buy-frame--modal.is-active').waitFor();
    let modal = page.frame({ name: 'frame-modal' });
    await modal.getByRole('button', { name: 'カートに入れる' }).waitFor();
    await modal.locator('.shopify-buy__quantity').fill('2');
    await modal.locator('.shopify-buy__quantity').press('Tab');
    await modal.waitForFunction(() => {
      const img = document.querySelector('[data-element="product.img"]');
      return img?.complete && img.naturalWidth > 0 && img.getBoundingClientRect().height > 100;
    });
    await page.screenshot({ path: `/tmp/sunsun-modal-${width}.png`, timeout: 15000 });
    await modal.getByRole('button', { name: 'カートに入れる' }).click();
    await page.locator('.shopify-buy-frame--cart.is-active').waitFor();
    const cart = page.frame({ name: 'frame-cart' });
    await cart.waitForFunction(() => document.querySelector('.shopify-buy__cart-item__quantity-input')?.value === '2');
    await cart.getByRole('button', { name: '数量を1個増やす' }).click();
    await cart.waitForFunction(() => document.querySelector('.shopify-buy__cart-item__quantity-input')?.value === '3');
    await cart.getByRole('button', { name: '数量を1個減らす' }).click();
    await cart.waitForFunction(() => document.querySelector('.shopify-buy__cart-item__quantity-input')?.value === '2');
    await page.screenshot({ path: `/tmp/sunsun-cart-${width}.png`, timeout: 15000 });
    const toggle = page.locator('.shopify-buy-frame--toggle.is-sticky');
    assert.equal(await toggle.isVisible(), false, 'カートを開いている間は丸いボタンを隠すこと');
    await cart.getByRole('button', { name: 'カートを閉じる' }).click();
    await page.locator('.shopify-buy-frame--cart').evaluate(el => {
      el.getBoundingClientRect();
      return Promise.all(el.getAnimations().map(animation => animation.finished));
    });
    await toggle.waitFor({ state: 'visible' });
    const toggleFrame = page.frame({ name: 'frame-toggle' });
    const circle = toggleFrame.locator('.shopify-buy__cart-toggle');
    const circleStyle = await circle.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height, background: getComputedStyle(el).backgroundColor };
    });
    assert.equal(circleStyle.width, width === 1600 ? 84 : 76);
    assert.equal(circleStyle.width, circleStyle.height, '正円であること');
    assert.equal(circleStyle.background, 'rgb(255, 255, 255)', '白い背景であること');
    assert.equal(await toggleFrame.locator('.shopify-buy__cart-toggle__count').textContent(), '2');
    const frameBox = await toggle.boundingBox();
    const circleBox = await circle.boundingBox();
    assert.ok(Math.abs(width - circleBox.x - circleBox.width - (width === 1600 ? 24 : 16)) < 1, '右端の余白が正しいこと');
    assert.ok(Math.abs(1000 - circleBox.y - circleBox.height - (width === 1600 ? 24 : 104)) < 1, '下端の余白が正しいこと');
    assert.ok(frameBox && circleBox, 'カートボタンが表示されていること');
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/sunsun-round-cart-${width}.png`, timeout: 15000 });

    // 丸いボタンからカートが開き、閉じたあとに再び表示されることを確認します。
    await circle.click();
    await page.locator('.shopify-buy-frame--cart.is-active').waitFor();
    assert.equal(await toggle.isVisible(), false);
    await cart.getByRole('button', { name: 'カートを閉じる' }).click();
    await toggle.waitFor({ state: 'visible' });
    if (width === 1600) {
      await page.setViewportSize({ width: 1200, height: 1000 });
      await circle.waitFor();
      assert.equal((await circle.boundingBox()).width, 76, '狭いPCでもメニューと同じサイズになること');
    }
    const menu = page.locator('.openbtn');
    await menu.click();
    assert.equal(await toggle.isVisible(), false, 'メニュー表示中は丸いボタンを隠すこと');
    await page.keyboard.press('Escape');
    await toggle.waitFor({ state: 'visible' });
    if (width === 1600) await page.setViewportSize({ width, height: 1000 });

    await products.getByRole('button', { name: '詳しく見る' }).nth(1).click();
    await page.locator('.shopify-buy-frame--modal.is-active').waitFor();
    assert.equal(await toggle.isVisible(), false, '商品詳細の表示中は丸いボタンを隠すこと');
    modal = page.frame({ name: 'frame-modal' });
    await modal.getByRole('button', { name: 'カートに入れる' }).click();
    await cart.waitForFunction(() => document.querySelectorAll('.shopify-buy__cart-item').length === 2);

    // 遷移先だけ確認し、Shopifyの決済画面は開きません。
    let checkoutUrl;
    await page.route('**/*', async route => {
      const request = route.request();
      if (request.isNavigationRequest() && request.frame() === page.mainFrame() && new URL(request.url()).origin !== new URL(url).origin) {
        checkoutUrl = request.url();
        await route.fulfill({ contentType: 'text/html', body: '<p>購入手続きへの遷移を確認しました。</p>' });
      } else {
        await route.continue();
      }
    });
    await cart.getByRole('button', { name: '購入手続きへ進む' }).click();
    await page.waitForURL(target => target.origin !== new URL(url).origin);
    assert.match(new URL(checkoutUrl).pathname, /\/(cart\/c|checkouts)\//);
    assert.deepEqual(errors, [], 'JavaScriptの実行例外がないこと');
    console.log(`${width}px: ${count}商品・${columns}列・詳細・複数商品追加・数量変更・購入手続きへの遷移を確認`);
    await context.close();
  }

  const page = await browser.newPage();
  page.on('dialog', dialog => dialog.accept('sunsun2025'));
  await page.route('**/buy-button-storefront.min.js', route => route.abort());
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#shopify-lineup-status').textContent.includes('商品を読み込めませんでした'));
  assert.equal(await page.locator('.lineup-cta-button').isVisible(), true);
  console.log('読み込み失敗時の案内とWeb Storeへの導線を確認');
} finally {
  await browser.close();
}
