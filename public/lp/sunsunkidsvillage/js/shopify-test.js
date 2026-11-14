'use strict';

// 商品情報と購入処理はShopify標準の購入ボタンに任せます。
(function () {
  const container = document.getElementById('collection-component-1793587456028');
  const status = document.getElementById('shopify-lineup-status');
  if (!container || !status) return;
  const loadingTimeout = window.setTimeout(showError, 20000);

  // 商品の表示順が変わっても、商品ハンドルに対応するタイトル画像を使います。
  const titleImages = {
    '4560453162220': 'product-txt-1.webp',
    '4560453162237': 'product-txt-2.webp',
    '4560453162244': 'product-txt-3.webp',
    '4560453162251': 'product-txt-4.webp'
  };

  const buttonStyles = {
    'background-color': '#ffd400',
    color: '#3b2a1c',
    'font-family': '"Noto Sans JP", sans-serif',
    'font-weight': 'bold',
    'font-size': '15px',
    'border-radius': '999px',
    padding: '15px 24px',
    'box-shadow': '0 4px 0 rgba(59, 42, 28, 0.22)',
    ':hover': { 'background-color': '#f4bd00', color: '#3b2a1c' },
    ':focus': { 'background-color': '#f4bd00', color: '#3b2a1c' }
  };
  const productText = {
    outOfStock: '売り切れ',
    unavailable: '選択できません',
    regularPriceAccessibilityLabel: '通常価格',
    salePriceAccessibilityLabel: '販売価格',
    unitPriceAccessibilityLabel: '単価',
    unitPriceAccessibilitySeparator: 'あたり'
  };

  function showError() {
    window.clearTimeout(loadingTimeout);
    container.setAttribute('aria-busy', 'false');
    status.hidden = false;
    status.textContent = '商品を読み込めませんでした。時間をおいて再読み込みするか、下のWeb Storeをご利用ください。';
  }

  async function init() {
    const client = window.ShopifyBuy.buildClient({
      domain: 'oyakonojikan.myshopify.com',
      storefrontAccessToken: '40f438fe4de2e200b7c915ff31226dec'
    });
    const ui = await window.ShopifyBuy.UI.onReady(client);
    ui.createComponent('collection', {
      id: '459148525820',
      node: container,
      moneyFormat: '%C2%A5%7B%7Bamount_no_decimals%7D%7D',
      options: {
        product: {
          buttonDestination: 'modal',
          width: '100%',
          contents: { options: false },
          events: {
            beforeRender: function (component) {
              const image = Object.hasOwn(titleImages, component.model.handle) ? titleImages[component.model.handle] : null;
              component.config.product.viewData = {
                titleImageUrl: image ? new URL('images/' + image, document.baseURI).href : null
              };
            }
          },
          classes: { titleImage: 'shopify-buy__product-title-image' },
          // バリエーション画像ではなく、商品に登録した先頭画像を表示します。
          templates: {
            img: '{{#data.images.0.src}}<div class="{{data.classes.product.imgWrapper}}" data-element="product.imgWrapper"><img class="{{data.classes.product.img}}" data-element="product.img" src="{{data.images.0.src}}" alt="{{data.title}}"></div>{{/data.images.0.src}}',
            title: '<h3 class="{{data.classes.product.title}}" data-element="product.title">{{#data.titleImageUrl}}<img class="{{data.classes.product.titleImage}}" src="{{data.titleImageUrl}}" alt="{{data.title}}">{{/data.titleImageUrl}}{{^data.titleImageUrl}}{{data.title}}{{/data.titleImageUrl}}</h3>'
          },
          googleFonts: ['Noto Sans JP'],
          styles: {
            product: {
              width: '100%',
              'min-width': '0',
              'max-width': 'none',
              'margin-left': '0',
              'margin-bottom': '0',
              'font-family': '"Noto Sans JP", sans-serif',
              '@media (min-width: 601px)': {
                width: '100%', 'max-width': 'none', 'margin-left': '0', 'margin-bottom': '0'
              }
            },
            imgWrapper: {
              position: 'relative',
              height: 'auto',
              'aspect-ratio': '3 / 4',
              'padding-top': '0',
              border: '6px solid #fff',
              'box-shadow': '0 8px 16px rgba(0, 0, 0, 0.12)',
              'background-color': '#fff',
              'margin-bottom': '16px'
            },
            img: { position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', 'object-fit': 'contain' },
            title: { color: '#2c1d12', 'font-size': '17px', 'font-weight': 'bold', 'line-height': '1.6' },
            titleImage: { display: 'block', width: '100%', height: 'auto', margin: '0 auto' },
            prices: { color: '#2c1d12', 'font-size': '18px', 'font-weight': 'bold' },
            price: { color: '#2c1d12', 'font-size': '18px', 'font-weight': 'bold' },
            button: buttonStyles
          },
          text: { ...productText, button: '詳しく見る' }
        },
        productSet: {
          events: {
            afterRender: function (component) {
              window.clearTimeout(loadingTimeout);
              container.setAttribute('aria-busy', 'false');
              status.hidden = Boolean(component.model.products.length);
              if (!status.hidden) status.textContent = '現在、表示できる商品がありません。';
            }
          },
          styles: {
            products: {
              display: 'grid',
              'grid-template-columns': 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: '36px 29px',
              'margin-left': '0'
            },
            product: { width: '100%', 'margin-left': '0', 'margin-bottom': '0', float: 'none' },
            paginationButton: buttonStyles
          },
          text: { nextPageButton: 'もっと見る', iframeAccessibilityLabel: '商品ラインナップ' }
        },
        modalProduct: {
          contents: { img: false, imgWithCarousel: true, button: false, buttonWithQuantity: true, description: true },
          // 商品詳細は読みやすいように、通常の商品名テキストを表示します。
          templates: { title: '<h2 class="{{data.classes.product.title}}" data-element="product.title">{{data.title}}</h2>' },
          googleFonts: ['Noto Sans JP'],
          styles: {
            imgWrapper: { height: 'auto', 'aspect-ratio': 'auto', border: 'none', 'box-shadow': 'none', 'margin-bottom': '0' },
            img: { position: 'static', width: '100%', height: 'auto' },
            product: {
              'font-family': '"Noto Sans JP", sans-serif',
              '@media (min-width: 601px)': { 'max-width': '100%', 'margin-left': '0', 'margin-bottom': '0' }
            },
            title: { color: '#3b2a1c', 'font-size': '23px', 'font-weight': 'bold', 'line-height': '1.5' },
            price: { color: '#3b2a1c', 'font-size': '18px', 'font-weight': 'bold' },
            description: { 'font-size': '14px', 'line-height': '1.8' },
            button: buttonStyles,
            quantityInput: { 'font-size': '15px', 'padding-top': '15px', 'padding-bottom': '15px' }
          },
          text: { ...productText, button: 'カートに入れる' }
        },
        modal: {
          styles: { modal: { 'background-color': '#fffddf' } },
          templates: {
            contents: '<button class="{{data.classes.modal.close}}" data-element="modal.close" aria-label="商品詳細を閉じる"><span aria-hidden="true">&times;</span></button>'
          },
          text: { iframeAccessibilityLabel: '商品詳細' }
        },
        cart: {
          popup: false,
          styles: {
            cart: { 'background-color': '#fffddf' },
            footer: { 'background-color': '#fffddf' },
            button: buttonStyles
          },
          text: {
            title: '買い物かご', total: '小計', empty: 'カートは空です',
            notice: '送料・割引は購入手続きで確認できます。',
            button: '購入手続きへ進む', closeAccessibilityLabel: 'カートを閉じる'
          }
        },
        lineItem: {
          text: {
            quantityInputAccessibilityLabel: '数量',
            quantityDecrementAccessibilityLabel: '数量を1個減らす',
            quantityIncrementAccessibilityLabel: '数量を1個増やす'
          }
        },
        toggle: {
          contents: { title: true },
          order: ['icon', 'title', 'count'],
          styles: {
            toggle: {
              position: 'relative',
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              'justify-content': 'center',
              gap: '4px',
              // iframeの幅に合わせ、PCは84px、メニュー表示時は76pxの円にします。
              width: 'calc(100vw - 28px)',
              height: 'calc(100vw - 28px)',
              'min-width': '0',
              margin: '14px',
              padding: '0',
              border: '2px solid #168137',
              'border-radius': '50%',
              'background-color': '#fff',
              color: '#168137',
              'box-shadow': '0 4px 8px rgba(0, 0, 0, 0.18)',
              ':hover': { 'background-color': '#effaf2' },
              ':focus': { 'background-color': '#effaf2' }
            },
            count: {
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              'min-width': '24px',
              height: '24px',
              margin: '0',
              padding: '0 4px',
              border: '2px solid #fff',
              'border-radius': '999px',
              'background-color': '#d31420',
              color: '#fff',
              'font-size': '12px',
              'font-weight': 'bold',
              'line-height': '20px'
            },
            title: { color: '#168137', 'font-size': '12px', 'font-weight': 'bold', 'line-height': '1', margin: '0' },
            icon: { width: '28px', height: '28px', display: 'block', margin: '0' },
            iconPath: { fill: '#168137' }
          },
          text: { title: 'カート', iframeAccessibilityLabel: 'カートを開く' }
        }
      }
    });
  }

  async function load() {
    try {
      if (!window.ShopifyBuy || !window.ShopifyBuy.UI) {
        await new Promise(function (resolve, reject) {
          const script = document.createElement('script');
          script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      await init();
    } catch (error) {
      showError();
      console.error('Shopifyの商品表示に失敗しました。', error);
    }
  }

  load();
})();
