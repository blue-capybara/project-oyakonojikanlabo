'use strict';

// ScrollTrigger を先に登録（依存が軽いのでここで実行）
if (window.gsap && window.ScrollTrigger) {
  window.gsap.registerPlugin(window.ScrollTrigger);
}

// モーダル共通制御（フォーカス管理・aria-expanded・スクロール制御）
let shopModalController = null;
let youtubeModalController = null;

function updateBodyScroll() {
  const hasOpenModal = document.querySelector('.modal.is-active');
  document.body.style.overflow = hasOpenModal ? 'hidden' : '';
}

function setupModal(options) {
  const modal = options.modal;
  const overlay = options.overlay;
  const closeBtn = options.closeBtn;
  const triggers = options.triggers ? Array.from(options.triggers) : [];
  const getOpenData = options.getOpenData;
  const onOpen = options.onOpen;
  const onClose = options.onClose;
  const focusTarget = options.focusTarget;
  const fallbackFocus = options.fallbackFocus;

  if (!modal || !overlay || !closeBtn) return null;

  triggers.forEach(function (trigger) {
    if (!trigger.hasAttribute('aria-expanded')) {
      trigger.setAttribute('aria-expanded', 'false');
    }
    if (modal.id && !trigger.hasAttribute('aria-controls')) {
      trigger.setAttribute('aria-controls', modal.id);
    }
    if (!trigger.hasAttribute('aria-haspopup')) {
      trigger.setAttribute('aria-haspopup', 'dialog');
    }
  });

  let lastFocusedElement = null;
  let lastTrigger = null;

  function setExpanded(isExpanded, currentTrigger) {
    triggers.forEach(function (trigger) {
      if (isExpanded && trigger === currentTrigger) {
        trigger.setAttribute('aria-expanded', 'true');
      } else {
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

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

  function openModal(trigger, data) {
    lastFocusedElement = document.activeElement;
    lastTrigger = trigger || null;

    if (typeof onOpen === 'function') {
      onOpen(data);
    }

    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    setExpanded(true, trigger);
    updateBodyScroll();

    focusElement(focusTarget || closeBtn);
  }

  function closeModal() {
    if (!modal.classList.contains('is-active')) return;

    // aria-hidden を付与する前にフォーカスを戻す
    if (!focusElement(lastFocusedElement)) {
      if (!focusElement(lastTrigger)) {
        if (typeof fallbackFocus === 'function') {
          focusElement(fallbackFocus());
        }
      }
    }

    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    setExpanded(false);

    if (typeof onClose === 'function') {
      onClose();
    }

    updateBodyScroll();
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      const data = getOpenData ? getOpenData(trigger) : null;
      if (getOpenData && !data) return;
      openModal(trigger, data);
    });
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  const modalContent = modal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }

  return {
    open: openModal,
    close: closeModal
  };
}

// 左右のキャラクターのアニメーション（画面外から出たり入ったりする）
(function () {
  'use strict';

  // GSAPの読み込みを待つ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCharAnimation);
  } else {
    // GSAPが既に読み込まれている場合は少し待つ
    setTimeout(initCharAnimation, 100);
  }

  function initCharAnimation() {
    if (!window.gsap) {
      // GSAPがまだ読み込まれていない場合は再試行
      setTimeout(initCharAnimation, 100);
      return;
    }

    const charLeft = document.getElementById('char-left');
    const charRight = document.getElementById('char-right');

    if (!charLeft || !charRight) return;

    // 動き始めだけズラして、途中は重なって動いてOKにする
    const tlLeft = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
    tlLeft
      // 左側のキャラクター：左側から画面外に出たり入ったり
      .to(charLeft, {
        x: -60, // 左に60px移動（画面外へ）
        duration: 2,
        ease: 'power2.inOut'
      })
      .to(charLeft, {
        x: 0, // 元の位置に戻る
        duration: 2,
        ease: 'power2.inOut'
      });

    // 右側は初回のみ開始を遅らせて、左右同時スタートを回避
    const tlRight = gsap.timeline({ repeat: -1, repeatDelay: 0.5, delay: 1.2 });
    tlRight
      // 右側のキャラクター：右側から画面外に出たり入ったり
      .to(charRight, {
        x: 60, // 右に60px移動（画面外へ）
        duration: 2,
        ease: 'power2.inOut'
      })
      .to(charRight, {
        x: 0, // 元の位置に戻る
        duration: 2,
        ease: 'power2.inOut'
      });
  }
})();

// Escキーでメニューを閉じる（PC向け）
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    const openBtn = document.querySelector('.openbtn');
    const nav = document.getElementById('g-nav');
    const circleBg = document.querySelector('.circle-bg');

    if (window.gNavController && typeof window.gNavController.close === 'function') {
      window.gNavController.close();
    } else if (openBtn && openBtn.classList.contains('active')) {
      openBtn.classList.remove('active');
      nav.classList.remove('panelactive');
      circleBg.classList.remove('circleactive');
      if (nav) {
        nav.setAttribute('aria-hidden', 'true');
        nav.setAttribute('inert', '');
      }
      if (openBtn) {
        openBtn.setAttribute('aria-expanded', 'false');
      }
    }

    // モーダルが開いている場合は閉じる（共通処理）
    if (shopModalController && typeof shopModalController.close === 'function') {
      shopModalController.close();
    }
    if (youtubeModalController && typeof youtubeModalController.close === 'function') {
      youtubeModalController.close();
    }
  }
});

// 取扱店舗モーダルウィンドウの開閉制御
(function () {
  'use strict';

  const shopModal = document.getElementById('shop-modal');
  const modalOverlay = shopModal ? shopModal.querySelector('.modal-overlay') : null;
  const modalClose = shopModal ? shopModal.querySelector('.modal-close') : null;
  const shopLinks = document.querySelectorAll('a[href="#shop"]');

  if (!shopModal || !modalOverlay || !modalClose) return;

  shopModalController = setupModal({
    modal: shopModal,
    overlay: modalOverlay,
    closeBtn: modalClose,
    triggers: shopLinks,
    fallbackFocus: function () {
      return document.querySelector('.openbtn');
    }
  });
})();

// YouTube動画モーダルウィンドウの開閉制御
(function () {
  'use strict';

  const youtubeModal = document.getElementById('youtube-modal');
  const youtubeIframe = document.getElementById('youtube-iframe');
  const modalOverlay = youtubeModal ? youtubeModal.querySelector('.modal-overlay') : null;
  const modalClose = youtubeModal ? youtubeModal.querySelector('.modal-close') : null;
  const youtubeLinks = document.querySelectorAll('a.youtube-link');

  if (!youtubeModal || !youtubeIframe || !modalOverlay || !modalClose) return;

  youtubeModalController = setupModal({
    modal: youtubeModal,
    overlay: modalOverlay,
    closeBtn: modalClose,
    triggers: youtubeLinks,
    getOpenData: function (trigger) {
      return trigger.getAttribute('data-video-id');
    },
    onOpen: function (videoId) {
      const embedUrl = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
      youtubeIframe.setAttribute('src', embedUrl);
    },
    onClose: function () {
      youtubeIframe.setAttribute('src', '');
    },
    fallbackFocus: function () {
      return document.querySelector('.openbtn');
    }
  });
})();

// トップに戻るボタンの制御
(function () {
  'use strict';

  const gototopBtn = document.getElementById('gototop');
  if (!gototopBtn) return;

  const scrollThreshold = 100; // 100pxスクロールしたら表示

  // スクロール位置をチェックしてボタンの表示/非表示を制御
  function handleScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollY > scrollThreshold) {
      gototopBtn.classList.add('is-visible');
    } else {
      gototopBtn.classList.remove('is-visible');
    }
  }

  // トップに戻る機能
  function scrollToTop(e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // イベントリスナーの登録
  gototopBtn.addEventListener('click', scrollToTop);
  window.addEventListener('scroll', handleScroll, { passive: true });

  // 初期状態を設定
  handleScroll();
})();
