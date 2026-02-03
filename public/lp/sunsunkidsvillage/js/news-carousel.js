// news-carousel.js
// 役割: WPGraphQLからNEWSを取得 → DOM生成 → Swiper初期化を一連で実行
// ポイント: 非同期描画完了後にのみSwiperを初期化し、枚数に応じてloop/autoplayを安全に切替える
(function () {
  'use strict';

  var GRAPHQL_ENDPOINT = 'https://cms.oyakonojikanlabo.jp/graphql';
  var FRONT_ORIGIN = 'https://oyakonojikanlabo.jp';
  var WRAPPER_SELECTOR = '#ajaxField';          // NEWSカードを挿入する .swiper-wrapper
  var CONTAINER_SELECTOR = '.js-news-swiper';   // NEWS用 Swiper コンテナ
  var MIN_LOOP_SLIDES = 6;                      // loop/autoplay を有効にする最小枚数（不足分は複製で補完）
  var BASE_SPACE = 20;

  // -----------------------
  // 日付表示を yy.mm.dd に整形
  // -----------------------
  function formatDate(dateString) {
    if (!dateString) return '';
    var d = new Date(dateString);
    var yy = String(d.getFullYear()).slice(2);
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return yy + '.' + mm + '.' + dd;
  }

  // -----------------------
  // NEWSカードDOM生成
  // -----------------------
  function buildSlide(post) {
    var title = post.title || '';
    var link = post.uri
      ? (post.uri.indexOf('http') === 0 ? post.uri : FRONT_ORIGIN + post.uri)
      : '#';
    var image = (post.featuredImage && post.featuredImage.node && post.featuredImage.node.sourceUrl) || '/images/no-image.png';
    var alt = (post.featuredImage && post.featuredImage.node && post.featuredImage.node.altText) || title;
    var dateIso = post.date || '';
    var dateLabel = formatDate(post.date);

    var slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.innerHTML =
      '<article class="news-card">' +
      '  <a href="' + link + '">' +
      '    <img src="' + image + '" alt="' + alt + '">' +
      '  </a>' +
      '  <p>' +
      '    <time datetime="' + dateIso + '">' + dateLabel + '</time><br>' +
      '    <a href="' + link + '">' + title + '</a>' +
      '  </p>' +
      '</article>';
    return slide;
  }

  // -----------------------
  // GraphQLでNEWS取得
  // -----------------------
  function fetchNews() {
    var query = [
      'query GetTaggedPosts {',
      '  posts(',
      '    first: 6',
      '    where: {',
      '      tag: "sunsunkids-village"',
      '      orderby: { field: DATE, order: DESC }',
      '    }',
      '  ) {',
      '    nodes {',
      '      title',
      '      uri',
      '      date',
      '      featuredImage {',
      '        node {',
      '          sourceUrl',
      '          altText',
      '        }',
      '      }',
      '    }',
      '  }',
      '}'
    ].join('\n');

    return fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query })
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        var posts = json && json.data && json.data.posts && json.data.posts.nodes;
        return Array.isArray(posts) ? posts : [];
      })
      .catch(function (err) {
        console.error('NEWS取得に失敗しました', err);
        return [];
      });
  }

  // -----------------------
  // DOMに描画
  // -----------------------
  function renderNews(posts) {
    var wrapper = document.querySelector(WRAPPER_SELECTOR);
    if (!wrapper) {
      console.warn(WRAPPER_SELECTOR + ' が見つかりません');
      return 0;
    }

    wrapper.innerHTML = '';
    posts.forEach(function (post) {
      wrapper.appendChild(buildSlide(post));
    });
    return posts.length;
  }

  // -----------------------
  // ループ用に不足分スライドを複製
  // -----------------------
  function ensureLoopSlides(min) {
    var wrapper = document.querySelector(WRAPPER_SELECTOR);
    if (!wrapper) return 0;

    var count = wrapper.children.length;
    if (!count || count >= min) return count;

    var i = 0;
    while (wrapper.children.length < min) {
      var clone = wrapper.children[i % count].cloneNode(true);
      wrapper.appendChild(clone);
      i++;
    }
    return wrapper.children.length;
  }

  // -----------------------
  // Swiper初期化（枚数依存でloop制御）
  // -----------------------
  function initNewsSwiper(count) {
    var container = document.querySelector(CONTAINER_SELECTOR);
    if (!container || typeof Swiper === 'undefined' || !count) return;

    var canLoop = count >= MIN_LOOP_SLIDES;
    var slidesPerView = canLoop ? 2 : 1;

    new Swiper(container, {
      loop: canLoop,
      centeredSlides: true,
      speed: 1500,
      slidesPerView: slidesPerView,
      spaceBetween: BASE_SPACE,
      autoplay: canLoop ? { delay: 5000, disableOnInteraction: false } : false,
      pagination: {
        el: container.querySelector('.swiper-pagination'),
        clickable: true
      },
      breakpoints: {
        960: {
          slidesPerView: slidesPerView,
          spaceBetween: 32
        }
      }
    });
  }

  // -----------------------
  // 初期化ファサード
  // -----------------------
  function init() {
    fetchNews()
      .then(function (posts) {
        var count = renderNews(posts);
        count = ensureLoopSlides(MIN_LOOP_SLIDES);
        initNewsSwiper(count);
      });
  }

  // DOM準備後に一度だけ実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
