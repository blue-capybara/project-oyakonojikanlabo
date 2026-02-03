// swiper-thumb-marquee.js
// 役割: 写真グリッドの横流れマルチスライダー(.js-thumb-marquee)を初期化
(function () {
  'use strict';

  function initThumbMarquee() {
    var thumbSwiperEl = document.querySelector('.js-thumb-marquee');
    if (!thumbSwiperEl || typeof Swiper === 'undefined') return;

    new Swiper(thumbSwiperEl, {
      loop: true,
      slidesPerView: 'auto',
      spaceBetween: 10,
      speed: 11000,
      allowTouchMove: false,
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
        reverseDirection: true
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThumbMarquee, { once: true });
  } else {
    initThumbMarquee();
  }
})();
