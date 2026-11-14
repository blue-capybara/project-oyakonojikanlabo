'use strict';

(function () {
  const config = window.SUNSUN_ANNOUNCEMENT;
  const dialog = document.getElementById('announcement-dialog');
  if (!config?.enabled || !dialog || location.hash || window.scrollY > 8) return;
  if (config.endsAt && Date.now() >= Date.parse(config.endsAt)) return;

  const storageKey = 'sunsunkidsvillage:announcement:' + location.pathname + ':' + config.campaignId;
  function wasShownRecently() {
    try {
      const lastShown = Number(localStorage.getItem(storageKey));
      return lastShown > 0 && Date.now() - lastShown < config.intervalHours * 60 * 60 * 1000;
    } catch {
      // 保存できない環境では、繰り返し表示を避けるため告知を出しません。
      return true;
    }
  }
  if (wasShownRecently()) return;

  const image = dialog.querySelector('img');
  const banner = dialog.querySelector('.announcement-banner');
  const pending = new AbortController();
  let cancelled = false;
  let timer;

  function cancelAutoShow() {
    cancelled = true;
    window.clearTimeout(timer);
    pending.abort();
  }

  // 閲覧や操作を始めた人には、この訪問中の自動表示を見送ります。
  // iframe内のカートを操作した場合も、親ウインドウのblurで表示を見送ります。
  ['pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll', 'hashchange', 'pagehide', 'blur'].forEach(function (event) {
    window.addEventListener(event, cancelAutoShow, { once: true, passive: true, signal: pending.signal });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAutoShow();
  }, { signal: pending.signal });

  dialog.querySelector('.announcement-close').addEventListener('click', function () {
    dialog.close();
  });
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });
  banner.addEventListener('click', function (event) {
    event.preventDefault();
    dialog.close();
    const lineup = document.getElementById('lineup');
    const heading = lineup.querySelector('h2');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    lineup.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start'
    });
    history.replaceState(null, '', '#lineup');
  });

  image.alt = config.imageAlt;
  image.src = config.imageUrl;
  const hero = document.querySelector('.hero-title');
  const heroReady = hero ? hero.decode().catch(function () {}) : Promise.resolve();

  // バナーが読み込めた場合だけ、ファーストビューの画像表示から少し待って開きます。
  Promise.all([image.decode(), heroReady]).then(function () {
    if (cancelled) return;
    timer = window.setTimeout(function () {
      const otherDialog = document.querySelector('.openbtn.active, .modal.is-active, .shopify-buy-frame--modal.is-block, .shopify-buy-frame--cart.is-active, dialog[open]');
      if (cancelled || !config.enabled || document.hidden || location.hash || window.scrollY > 8 || otherDialog || wasShownRecently()) {
        cancelAutoShow();
        return;
      }
      if (config.endsAt && Date.now() >= Date.parse(config.endsAt)) {
        cancelAutoShow();
        return;
      }
      pending.abort();
      try {
        dialog.showModal();
        localStorage.setItem(storageKey, String(Date.now()));
      } catch {
        if (dialog.open) dialog.close();
      }
    }, config.delayMs);
  }).catch(cancelAutoShow);
})();
