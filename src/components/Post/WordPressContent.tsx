import React, { useEffect, useRef } from 'react';

interface WordPressContentProps {
  html: string;
  className?: string;
  customCss?: string | null;
  customJs?: string | null;
}

/**
 * WordPress本番サイトのスタイルをShadow DOM内に読み込み、
 * 取得したHTMLをアプリ全体のスタイルから切り離して表示するコンポーネント。
 * これによりヘッダーやフッターがWordPressのCSSで上書きされることを防ぎつつ、
 * 記事本文だけを本番と近い見た目で再現します。
 */
const WORDPRESS_STYLESHEETS: readonly string[] = [
  'https://cms.oyakonojikanlabo.jp/wp-includes/css/dist/block-library/style.min.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/css/front.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/accordion/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/blog-card/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/box-links/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/button/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/columns/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/container/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/faq/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/dl/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/icon/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/notice/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/section/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/section-heading/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/step/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/tab/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/timeline/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/toc/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/arkhe-blocks-pro/dist/gutenberg/blocks/slider/index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/accordion/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/alert/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/balloon/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/btn/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/categories-list/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/hero-header/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/information/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/items/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/media-text/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/panels/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/pricing-table/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/section/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/section-break-the-grid/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/section-with-bgimage/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/spider-contents-slider/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/spider-slider/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/spider-pickup-slider/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/step/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/blocks/tabs/style-index.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/packages/slick/slick.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/packages/slick/slick-theme.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/packages/spider/dist/css/spider.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/css/blocks.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/css/fallback.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-blocks/dist/css/nopro.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-editor/dist/css/app.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-editor/dist/css/front.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/snow-monkey-editor/dist/css/view.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/sheets-to-wp-table-live-sync-pro/assets/public/styles/frontend.min.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/sheets-to-wp-table-live-sync/assets/public/styles/frontend.min.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/sheets-to-wp-table-live-sync-pro/assets/public/styles/style-1.min.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/shopify-products/css/shopify-products.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/wp-user-avatar/assets/css/frontend.min.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/wp-user-avatar/assets/flatpickr/flatpickr.min.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/wp-user-avatar/assets/select2/select2.min.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/wordpress-popular-posts/assets/css/wpp.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/yyi-rinker/css/style.css?v=1.11.1',
  'https://cms.oyakonojikanlabo.jp/wp-content/themes/oyakonojikan/style.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/themes/oyakonojikan-child/assets/css/style.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/themes/oyakonojikan-child/assets/css/post.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/themes/oyakonojikan-child/assets/css/customize.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/themes/oyakonojikan-child/style.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/tablepress/css/default.min.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/master-slider/public/assets/css/masterslider.main.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/uploads/master-slider/custom.css',
  'https://cms.oyakonojikanlabo.jp/wp-content/plugins/va-social-buzz/assets/css/style.css',
];

const CMS_HOSTS = new Set(['cms.oyakonojikanlabo.jp']);
const PUBLIC_ORIGIN = 'https://cms.oyakonojikanlabo.jp';
const CMS_PATH_BLOCKLIST = ['/wp-admin', '/wp-json', '/wp-content', '/wp-includes'];

let accordionSequence = 0;

const shouldRewriteCmsLink = (url: URL) => {
  if (!CMS_HOSTS.has(url.hostname)) return false;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  return !CMS_PATH_BLOCKLIST.some((prefix) => url.pathname.startsWith(prefix));
};

const buildPublicUrl = (url: URL) =>
  new URL(`${url.pathname}${url.search}${url.hash}`, PUBLIC_ORIGIN).toString();

const rewriteCmsAnchors = (root: ParentNode) => {
  if (typeof window === 'undefined') return;

  root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    let url: URL;
    try {
      url = new URL(href, window.location.origin);
    } catch {
      return;
    }

    if (!shouldRewriteCmsLink(url)) return;
    anchor.setAttribute('href', buildPublicUrl(url));
  });
};

const WordPressContent: React.FC<WordPressContentProps> = ({ html, className, customCss, customJs }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const scriptElementsRef = useRef<HTMLScriptElement[]>([]);
  const customStyleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let shadow = host.shadowRoot;
    if (!shadow) {
      shadow = host.attachShadow({ mode: 'open' });
    }

    if (!shadow.querySelector('style[data-wp-base="true"]')) {
      const baseStyle = document.createElement('style');
      baseStyle.setAttribute('data-wp-base', 'true');
      baseStyle.textContent = `
        :host {
          display: block;
        }
        .wp-article-root {
          font-family: inherit;
          color: inherit;
        }
        .wp-article-root img,
        .wp-article-root iframe,
        .wp-article-root video,
        .wp-article-root canvas,
        .wp-article-root svg {
          max-width: 100%;
          height: auto;
        }
      `;
      shadow.appendChild(baseStyle);
    }

    WORDPRESS_STYLESHEETS.forEach((href) => {
      if (shadow!.querySelector(`link[data-wp-style="${href}"]`)) {
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-wp-style', href);
      link.onerror = () => {
        console.warn(`WordPressスタイルシートの読み込みに失敗しました: ${href}`);
      };
      shadow!.appendChild(link);
    });

    if (!shadow.querySelector('style[data-site-heading="true"]')) {
      const headingStyle = document.createElement('style');
      headingStyle.setAttribute('data-site-heading', 'true');
      headingStyle.textContent = `
        .wp-article-root {
          color: #2b2b2b;
          font-size: 1rem;
          line-height: 1.9;
          word-break: break-word;
          --ark-color--main: #598c58;
          --ark-color--border: rgba(92, 107, 129, 0.24);
          --arkb-shadow: 0 18px 50px -12px rgba(36, 48, 65, 0.18);
          --arkb-padding: clamp(1.5rem, 1.25rem + 0.8vw, 2rem);
          --ark-mt: clamp(2.5rem, 2rem + 1.5vw, 3.25rem);
          --ark-mt--inner: clamp(1.25rem, 1rem + 0.6vw, 1.75rem);
          --ark-mt--s: clamp(1.5rem, 1.2rem + 0.6vw, 1.9rem);
          --ark-thumb: clamp(7.5rem, 5rem + 8vw, 12rem);
          --ark-mediatext--lap: clamp(280px, 45vw, 480px);
          --ark-mediatext--space: clamp(1.5rem, 1.2rem + 0.8vw, 2.25rem);
          --arkb-list-icon_color: var(--ark-color--main);
          --arkb-list-padding: 1.5em;
          --arkb-li-padding--left: 1.75em;
          --arkb-marker-style: disc;
          --arkb-marker-txt-weight: 600;
          --arkb-the-lh: 1.8;
          --arkb-btn-radius: 999px;
          --arkb-btn-width: auto;
          --arkb-btn-color--default: var(--ark-color--main);
          --arkb-btn-color--bg: var(--ark-color--main);
          --arkb-btn-color--text: #fff;
        }
        .wp-article-root .ark-block-accordion {
          background: #f6f7f9;
          border-radius: 18px;
          padding: clamp(1rem, 0.9rem + 0.8vw, 1.8rem);
          margin: clamp(1.5rem, 1.2rem + 0.8vw, 2.4rem) 0;
          box-shadow: inset 0 0 0 1px rgba(92, 107, 129, 0.08);
        }
        .wp-article-root .ark-block-accordion + .ark-block-accordion {
          margin-top: clamp(1rem, 0.8rem + 0.6vw, 1.6rem);
        }
        .wp-article-root .ark-block-accordion__item {
          border-bottom: 1px solid rgba(92, 107, 129, 0.18);
          margin: 0;
        }
        .wp-article-root .ark-block-accordion__item:last-of-type {
          border-bottom: none;
        }
        .wp-article-root .ark-block-accordion__title {
          list-style: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          font-size: clamp(1rem, 0.96rem + 0.3vw, 1.2rem);
          font-weight: 600;
          padding: clamp(0.9rem, 0.8rem + 0.5vw, 1.25rem) 0;
          color: #253343;
        }
        .wp-article-root .ark-block-accordion__title::-webkit-details-marker {
          display: none;
        }
        .wp-article-root .ark-block-accordion__label {
          margin-right: 1rem;
        }
        .wp-article-root .ark-block-accordion__icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          border: 1px solid rgba(92, 107, 129, 0.24);
          font-size: 1.2rem;
          line-height: 1;
          color: #253343;
          font-weight: 600;
          background: #fff;
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .wp-article-root .ark-block-accordion__icon::before,
        .wp-article-root .ark-block-accordion__icon::after {
          display: none !important;
          content: none !important;
        }
        .wp-article-root .ark-block-accordion__title[aria-expanded="true"] .ark-block-accordion__icon {
          background: var(--ark-color--main);
          border-color: var(--ark-color--main);
          color: #fff;
        }
        .wp-article-root .ark-block-accordion__title:focus-visible {
          outline: 2px solid rgba(52, 120, 192, 0.5);
          outline-offset: 2px;
        }
        .wp-article-root .ark-block-accordion__body {
          display: none !important;
          padding: 0;
          margin: 0;
          overflow: hidden;
          height: 0 !important;
          opacity: 0 !important;
          visibility: hidden !important;
          transition: none !important;
        }
        .wp-article-root .ark-block-accordion__item[open] .ark-block-accordion__body {
          display: block !important;
          padding: clamp(1rem, 0.9rem + 0.5vw, 1.4rem) 0 clamp(1.6rem, 1.4rem + 0.6vw, 2rem);
          height: auto !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        .wp-article-root .ark-block-accordion__body table {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
        }
        .wp-article-root .ark-block-accordion__item.table-scroll .ark-block-accordion__body {
          overflow-x: auto;
        }
        .wp-article-root .ark-block-accordion__item.table-scroll table {
          min-width: 640px;
        }
        .wp-article-root > *:first-child {
          margin-top: 0;
        }
        .wp-article-root > *:last-child {
          margin-bottom: 0;
        }
        .wp-article-root p {
          margin: 0 0 1.6em;
        }
        .wp-article-root a {
          color: #3478c0;
          text-decoration: underline;
          text-underline-offset: 0.2em;
          transition: color 0.2s ease;
        }
        .wp-article-root a:hover {
          color: #1f5a95;
        }
        .wp-article-root strong {
          font-weight: 700;
        }
        .wp-article-root em {
          font-style: italic;
        }
        .wp-article-root ul,
        .wp-article-root ol {
          margin: 0 0 1.6em 1.4em;
        }
        .wp-article-root ul {
          list-style: disc;
        }
        .wp-article-root ol {
          list-style: decimal;
        }
        .wp-article-root li {
          margin-bottom: 0.4em;
        }
        .wp-article-root blockquote {
          margin: 2.5rem 0;
          padding: 1.5rem 1.75rem;
          border-left: 4px solid var(--ark-color--main);
          background: #f8f9fb;
          color: #1a2530;
        }
        .wp-article-root blockquote p {
          margin: 0;
        }
        .wp-article-root h2 {
          font-size: clamp(1.4rem, 1.44rem + 0.8vw, 2rem);
          font-weight: 700;
          margin: 3rem 0 1.75rem;
          padding: 0.25rem 0 0.75rem;
        }
        .wp-article-root h3 {
          font-size: clamp(1.2rem, 1.24rem + 0.48vw, 1.6rem);
          font-weight: 700;
          margin: 2.5rem 0 1.5rem;
          padding: 0.2rem 0 0.6rem;
        }
        .wp-article-root h4 {
          font-size: clamp(1rem, 1.04rem + 0.4vw, 1.36rem);
          font-weight: 600;
          margin: 2rem 0 1.25rem;
          padding: 0.2rem 0 0.5rem;
        }
        .wp-article-root h5 {
          font-size: clamp(0.88rem, 0.92rem + 0.32vw, 1.16rem);
          font-weight: 600;
          margin: 1.75rem 0 1rem;
          padding: 0.15rem 0 0.45rem;
        }
        .wp-article-root h6 {
          font-size: clamp(0.8rem, 0.84rem + 0.24vw, 1.04rem);
          font-weight: 600;
          margin: 1.5rem 0 0.85rem;
          padding: 0.1rem 0 0.35rem;
        }
        .wp-article-root .ark-block-button__link,
        .wp-article-root .wp-block-button__link {
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .wp-article-root .wp-block-button__link {
          border-radius: 999px;
          background-color: var(--ark-color--main);
          color: #fff;
          padding: 0.75em 1.75em;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .wp-article-root .wp-block-button__link:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(53, 120, 192, 0.25);
        }
        .wp-article-root table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
          font-size: 0.95rem;
        }
        .wp-article-root th,
        .wp-article-root td {
          border: 1px solid rgba(92, 107, 129, 0.18);
          padding: 0.75rem 1rem;
        }
        .wp-article-root th {
          background: #eef3f8;
          font-weight: 600;
          text-align: left;
        }
        .wp-article-root code {
          background: #f1f4f8;
          border-radius: 4px;
          font-size: 0.9em;
          padding: 0.1em 0.4em;
        }
        .wp-article-root pre {
          background: #121826;
          border-radius: 8px;
          color: #f8fafc;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 2rem 0;
          overflow-x: auto;
          padding: 1.5rem;
        }
        .wp-article-root figure {
          margin: 2.5rem 0;
        }
        .wp-article-root figcaption {
          margin-top: 0.75rem;
          font-size: 0.85rem;
          color: #607080;
          text-align: center;
        }
        .wp-article-root hr {
          border: none;
          border-top: 1px solid rgba(92, 107, 129, 0.18);
          margin: 3rem 0;
        }
      `;
      shadow.appendChild(headingStyle);
    }

    if (!contentRef.current) {
      const container = document.createElement('div');
      container.className = 'wp-article-root';
      shadow.appendChild(container);
      contentRef.current = container;
    }

    const cleanupScripts = () => {
      scriptElementsRef.current.forEach((node) => node.remove());
      scriptElementsRef.current = [];
    };
    const cleanupCustomStyle = () => {
      if (customStyleRef.current) {
        customStyleRef.current.remove();
        customStyleRef.current = null;
      }
    };

    const isExecutableScript = (script: HTMLScriptElement) => {
      const type = script.type?.trim().toLowerCase();
      return (
        !type ||
        type === 'text/javascript' ||
        type === 'application/javascript' ||
        type === 'module'
      );
    };

    const executeScripts = (scripts: HTMLScriptElement[], shadowRoot: ShadowRoot | null) => {
      const container = contentRef.current;
      if (!container || !shadowRoot) return;

      const hasDOMContentLoadedListener = scripts.some((script) =>
        (script.textContent || '').includes('DOMContentLoaded'),
      );

      scripts
        .filter(isExecutableScript)
        .forEach((original) => {
          const runnable = document.createElement('script');

          Array.from(original.attributes).forEach((attr) => {
            runnable.setAttribute(attr.name, attr.value);
          });

          // Shadow DOM内の要素へアクセスできるよう、currentScript経由でshadowRootを渡す
          (runnable as any).__shadowRoot = shadowRoot;

          if (original.src) {
            scriptElementsRef.current.push(runnable);
            container.appendChild(runnable);
            return;
          }

          if (original.textContent) {
            runnable.textContent = `
              (() => {
                const shadowRoot = (window.document.currentScript && (window.document.currentScript).__shadowRoot) || null;
                const realDocument = window.document;
                const host = shadowRoot ? shadowRoot.host : null;
                const currentScript = realDocument.currentScript;

                const document = shadowRoot
                  ? (() => {
                      const escapeId = (id) => {
                        if (window.CSS && CSS.escape) return CSS.escape(id);
                        return String(id).replace(/([^a-zA-Z0-9_-])/g, '\\\\$1');
                      };
                      return new Proxy(realDocument, {
                        get(target, prop) {
                          if (prop === 'querySelector' || prop === 'querySelectorAll') {
                            return shadowRoot[prop].bind(shadowRoot);
                          }
                          if (prop === 'getElementById') {
                            return (id) => shadowRoot.querySelector('#' + escapeId(id));
                          }
                          if (prop === 'addEventListener') return shadowRoot.addEventListener.bind(shadowRoot);
                          if (prop === 'removeEventListener') return shadowRoot.removeEventListener.bind(shadowRoot);
                          if (prop === 'dispatchEvent') return shadowRoot.dispatchEvent.bind(shadowRoot);
                          return target[prop];
                        },
                        has(target, prop) {
                          return prop in shadowRoot || prop in target;
                        },
                      });
                    })()
                  : realDocument;

                ${original.textContent}
              })();
            `;
          }

          scriptElementsRef.current.push(runnable);
          container.appendChild(runnable);
        });

      if (hasDOMContentLoadedListener) {
        // Shadow DOM内の疑似DOMContentLoadedを即時発火させ、記事内スクリプトの初期化を促す
        setTimeout(() => {
          shadowRoot.dispatchEvent(new Event('DOMContentLoaded'));
        }, 0);
      }
    };

    const detachCopyHandlers: Array<() => void> = [];

    const setupCopyButtons = () => {
      const container = contentRef.current;
      if (!container) return;

      detachCopyHandlers.forEach((fn) => fn());
      detachCopyHandlers.length = 0;

      const buttons = container.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('.copy-hashtag-btn');

      buttons.forEach((btn) => {
        const showMessage = () => {
          const message =
            btn.closest<HTMLElement>('[data-copy-wrapper]')?.querySelector<HTMLElement>('.copy-message') ||
            container.querySelector<HTMLElement>('.copy-message');

          if (!message) {
            alert('コピーしました！');
            return;
          }

          message.style.display = 'inline';
          setTimeout(() => {
            message.style.display = 'none';
          }, 2000);
        };

        const fallbackCopy = (text: string) => {
          const textarea = window.document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          window.document.body.appendChild(textarea);
          textarea.select();
          try {
            window.document.execCommand('copy');
            showMessage();
          } catch (e) {
            alert('コピーできませんでした。お手数ですが手動でコピーしてください。');
          }
          window.document.body.removeChild(textarea);
        };

        const handleClick = async (event: Event) => {
          event.preventDefault();
          const text = btn.getAttribute('data-copy') || '';
          if (!text) return;

          if (navigator.clipboard?.writeText) {
            try {
              await navigator.clipboard.writeText(text);
              showMessage();
              return;
            } catch (e) {
              // fall through
            }
          }

          fallbackCopy(text);
        };

        btn.addEventListener('click', handleClick);
        detachCopyHandlers.push(() => btn.removeEventListener('click', handleClick));
      });
    };

    if (contentRef.current) {
      const container = contentRef.current;

      if (!html) {
        container.innerHTML = '';
      } else {
        const template = document.createElement('template');
        template.innerHTML = html;

        const scripts = Array.from(template.content.querySelectorAll('script'));
        scripts.forEach((node) => node.remove());
        rewriteCmsAnchors(template.content);

        container.innerHTML = '';
        container.appendChild(template.content.cloneNode(true));
        executeScripts(scripts, shadow);

        // カスタムCSS
        cleanupCustomStyle();
        if (customCss) {
          const styleEl = document.createElement('style');
          styleEl.setAttribute('data-custom-css', 'true');
          styleEl.textContent = customCss;
          shadow.appendChild(styleEl);
          customStyleRef.current = styleEl;
        }

        // カスタムJS
        if (customJs) {
          const customScript = document.createElement('script');
          customScript.textContent = customJs;
          executeScripts([customScript], shadow);
        }
      }
    }

    const initializeAccordions = () => {
      const container = contentRef.current;
      if (!container) return;

      const accordionRoots = container.querySelectorAll<HTMLElement>('.ark-block-accordion');

      accordionRoots.forEach((root) => {
        if (root.dataset.codexAccordionReady === 'true') {
          return;
        }
        root.dataset.codexAccordionReady = 'true';

        const items = root.querySelectorAll<HTMLDetailsElement>('.ark-block-accordion__item');

        items.forEach((item) => {
          const summary = item.querySelector<HTMLElement>('.ark-block-accordion__title');
          const body = item.querySelector<HTMLElement>('.ark-block-accordion__body');
          let icon = item.querySelector<HTMLElement>('.ark-block-accordion__icon');

          if (!summary || !body) {
            return;
          }

          if (!icon) {
            icon = document.createElement('span');
            icon.className = 'ark-block-accordion__icon';
            summary.appendChild(icon);
          }

          const bodyId = `wp-accordion-body-${accordionSequence++}`;
          body.id = bodyId;
          summary.setAttribute('aria-controls', bodyId);

          const applyState = () => {
            const isOpen = item.hasAttribute('open');
            summary.setAttribute('aria-expanded', String(isOpen));
            if (icon) {
              icon.textContent = isOpen ? '−' : '+';
            }
          };

          item.addEventListener('toggle', applyState);
          applyState();
        });
      });
    };

    initializeAccordions();
    setupCopyButtons();
    const scrollToHash = (hash: string) => {
      const targetId = hash.replace(/^#/, '');
      if (!targetId) return false;

      const container = contentRef.current;
      const targetInShadow =
        container?.querySelector<HTMLElement>(`[id="${targetId}"]`) ||
        container?.querySelector<HTMLElement>(`[name="${targetId}"]`);

      if (targetInShadow) {
        targetInShadow.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }

      const targetInDocument = document.getElementById(targetId);
      if (targetInDocument) {
        targetInDocument.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }

      return false;
    };

    const handleAnchorClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const url = href.startsWith('#')
        ? new URL(`${window.location.pathname}${window.location.search}${href}`, window.location.origin)
        : new URL(href, window.location.href);

      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) {
        return;
      }

      if (!url.hash) {
        return;
      }

      event.preventDefault();
      const scrolled = scrollToHash(url.hash);
      if (scrolled) {
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      }
    };

    const handleHashChange = () => {
      if (window.location.hash) {
        scrollToHash(window.location.hash);
      }
    };

    const isInteractiveElement = (element: Element | null) =>
      !!element?.closest('a, button, input, select, textarea, label, summary');

    // Arkheのリンクボックス挙動をShadow DOM内で再現
    const handleLinkBoxActivate = (event: Event, viaKeyboard = false) => {
      const target = event.target as Element | null;
      if (!target || isInteractiveElement(target)) {
        return false;
      }

      const linkBox = target.closest<HTMLElement>('[data-arkb-linkbox="1"]');
      if (!linkBox) {
        return false;
      }

      const link = linkBox.querySelector<HTMLAnchorElement>('a[data-arkb-link="1"][href]');
      const href = link?.getAttribute('href');
      if (!href) {
        return false;
      }

      if (viaKeyboard) {
        event.preventDefault();
      }

      if (href.startsWith('#')) {
        const scrolled = scrollToHash(href);
        if (scrolled) {
          window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}${href}`);
        }
        return true;
      }

      const url = new URL(href, window.location.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.hash) {
        const scrolled = scrollToHash(url.hash);
        if (scrolled) {
          window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
        }
        return true;
      }

      if (link?.getAttribute('target') === '_blank') {
        window.open(url.toString(), '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url.toString();
      }
      return true;
    };

    const handleLinkBoxClick = (event: Event) => {
      const handled = handleLinkBoxActivate(event);
      if (handled) {
        event.preventDefault();
      }
    };

    const handleLinkBoxKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      const target = event.target as Element | null;
      if (isInteractiveElement(target)) {
        return;
      }
      const linkBox = target?.closest<HTMLElement>('[data-arkb-linkbox="1"]');
      if (!linkBox) {
        return;
      }
      const handled = handleLinkBoxActivate(event, true);
      if (handled && event.key === ' ') {
        event.preventDefault();
      }
    };

    contentRef.current?.addEventListener('click', handleAnchorClick);
    contentRef.current?.addEventListener('click', handleLinkBoxClick);
    contentRef.current?.addEventListener('keydown', handleLinkBoxKeyDown);
    window.addEventListener('hashchange', handleHashChange);

    if (window.location.hash) {
      setTimeout(() => {
        scrollToHash(window.location.hash);
      }, 0);
    }

    return () => {
      cleanupScripts();
      cleanupCustomStyle();
      contentRef.current?.removeEventListener('click', handleAnchorClick);
      contentRef.current?.removeEventListener('click', handleLinkBoxClick);
      contentRef.current?.removeEventListener('keydown', handleLinkBoxKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
      detachCopyHandlers.forEach((fn) => fn());
    };
  }, [html, customCss, customJs]);

  return <div ref={hostRef} className={className} />;
};

export default WordPressContent;
