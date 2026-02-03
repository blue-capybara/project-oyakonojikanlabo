// swiper-base.js
// 役割: DOM常設の汎用スライダー(.js-swiper)を初期化
(function () {
  'use strict';

  function initBaseSwiper() {
    var baseSwiperEl = document.querySelector('.js-swiper');
    if (!baseSwiperEl || typeof Swiper === 'undefined') return;

    var paginationEl = baseSwiperEl.querySelector('.swiper-pagination');
    var nextEl = baseSwiperEl.querySelector('.swiper-button-next');
    var prevEl = baseSwiperEl.querySelector('.swiper-button-prev');

    var options = {
      loop: true,
      speed: 1500,
      slidesPerView: 1,
      spaceBetween: 16,
      centeredSlides: true
    };

    if (paginationEl) {
      options.pagination = {
        el: paginationEl,
        clickable: true
      };
    }

    if (nextEl && prevEl) {
      options.navigation = {
        nextEl: nextEl,
        prevEl: prevEl
      };
    }

    new Swiper(baseSwiperEl, options);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBaseSwiper, { once: true });
  } else {
    initBaseSwiper();
  }
})();
