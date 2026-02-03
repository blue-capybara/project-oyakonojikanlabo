// g-nav toggle（openbtn が存在すれば有効）
(function () {
  'use strict';

  function setupGNav() {
    var openBtn = document.querySelector('.openbtn');
    var circleBg = document.querySelector('.circle-bg');
    var gNav = document.getElementById('g-nav');
    if (!openBtn || !circleBg || !gNav) return;

    // matchMedia は「保険」としてのみ使う
    var mql = window.matchMedia('(max-width: 1500px)');

    if (!openBtn.hasAttribute('aria-controls')) {
      openBtn.setAttribute('aria-controls', 'g-nav');
    }
    if (!openBtn.hasAttribute('aria-expanded')) {
      openBtn.setAttribute('aria-expanded', 'false');
    }

    gNav.setAttribute('aria-hidden', 'true');
    gNav.setAttribute('inert', '');

    function isFocusableCandidate(element) {
      if (!element || typeof element.focus !== 'function') return false;
      if (!document.contains(element)) return false;
      if (element.closest('[aria-hidden="true"]') || element.closest('[inert]')) return false;
      if (element.hasAttribute('disabled')) return false;
      if (typeof element.getClientRects === 'function' && element.getClientRects().length === 0) return false;
      return true;
    }

    function focusElement(element) {
      if (isFocusableCandidate(element)) {
        element.focus();
        return true;
      }
      return false;
    }

    function focusFirstItem() {
      var firstLink = gNav.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      if (firstLink) {
        focusElement(firstLink);
      }
    }

    function setState(open) {
      openBtn.classList.toggle('active', open);
      circleBg.classList.toggle('circleactive', open);
      gNav.classList.toggle('panelactive', open);
      gNav.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) {
        gNav.removeAttribute('inert');
      } else {
        gNav.setAttribute('inert', '');
      }
      openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function openMenu() {
      setState(true);
      focusFirstItem();
    }

    function closeMenu() {
      if (gNav.contains(document.activeElement)) {
        focusElement(openBtn);
      }
      setState(false);
    }

    function toggleMenu() {
      // 幅によるガードはしない
      var willOpen = !openBtn.classList.contains('active');
      if (willOpen) {
        openMenu();
      } else {
        closeMenu();
      }
    }

    function handleMediaChange(e) {
      // 画面が広くなったら閉じるだけ（見た目崩れ防止）
      if (!e.matches) {
        closeMenu();
      }
    }

    // openbtn が存在する限り必ず有効
    openBtn.addEventListener('click', toggleMenu);

    // メニュー内リンククリックで閉じる
    var links = gNav.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', closeMenu);
    }

    // resize 保険
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleMediaChange);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(handleMediaChange);
    }

    window.gNavController = {
      open: openMenu,
      close: closeMenu,
      toggle: toggleMenu
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGNav, { once: true });
  } else {
    setupGNav();
  }
})();
