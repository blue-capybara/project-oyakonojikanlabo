import { GA4_B_LINKER_DOMAINS, ensureGa4BReady, getGa4BMeasurementId } from '../analytics/ga4b';

// GA4-B 計測ヘルパー。
// React SPA 側の PV / イベントは send_to を付与して GA4-B に統一する。

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const getMeasurementId = (): string | undefined => {
  return getGa4BMeasurementId();
};

type TrackerContext = {
  id: string;
  gtagFn: (...args: unknown[]) => void;
};

const resolveTracker = (): TrackerContext | null => {
  const id = getMeasurementId();
  const gtagFn = ensureGa4BReady(GA4_B_LINKER_DOMAINS);
  if (!id || !gtagFn) return null;
  return { id, gtagFn };
};

const canTrack = (tracker: TrackerContext | null): tracker is TrackerContext => tracker !== null;

const sendEvent = (eventName: string, params: Record<string, unknown>) => {
  const tracker = resolveTracker();
  if (!canTrack(tracker)) return;
  tracker.gtagFn('event', eventName, {
    send_to: tracker.id,
    ...params,
  });
};

export const sendPageView = (path: string) => {
  if (typeof window === 'undefined') return;
  sendEvent('page_view', {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  });
};

// SEO: 301 への安易な転換でパーマリンク評価を落とさないよう、確定した 404 を別イベントで計測する
export const send404Event = () => {
  if (typeof window === 'undefined') return;

  const pageLocation = window.location.href;
  const pagePath = `${window.location.pathname}${window.location.search}`;
  const referrer =
    typeof document !== 'undefined' && document.referrer ? document.referrer : undefined;

  sendEvent('page_404', {
    page_location: pageLocation,
    page_path: pagePath,
    ...(referrer ? { referrer } : {}),
  });
};

type RelatedPostClickEventParams = {
  currentPostSlug: string;
  currentPostId?: number;
  relatedPostId: number;
  relatedPostSlug?: string;
  relatedPostSource?: string;
  position: number;
};

export const sendRelatedPostClickEvent = ({
  currentPostSlug,
  currentPostId,
  relatedPostId,
  relatedPostSlug,
  relatedPostSource,
  position,
}: RelatedPostClickEventParams) => {
  sendEvent('related_post_click', {
    current_post_slug: currentPostSlug,
    ...(currentPostId ? { current_post_id: currentPostId } : {}),
    related_post_id: relatedPostId,
    ...(relatedPostSlug ? { related_post_slug: relatedPostSlug } : {}),
    ...(relatedPostSource ? { related_post_source: relatedPostSource } : {}),
    position,
  });
};

// --- ニュースレター登録 ---
type NewsletterSignupEventParams = {
  method: string;
};

export const sendNewsletterSignupEvent = ({ method }: NewsletterSignupEventParams) => {
  sendEvent('newsletter_signup', { method });
};

// --- SNS シェア ---
type ShareClickEventParams = {
  platform: 'x' | 'facebook' | 'line' | 'email';
  content_type: 'post' | 'event';
  content_slug: string;
};

export const sendShareClickEvent = ({
  platform,
  content_type,
  content_slug,
}: ShareClickEventParams) => {
  sendEvent('share_click', { platform, content_type, content_slug });
};

// --- お問い合わせ送信 ---
type ContactSubmitEventParams = {
  inquiry_type: string;
};

export const sendContactSubmitEvent = ({ inquiry_type }: ContactSubmitEventParams) => {
  sendEvent('contact_submit', { inquiry_type });
};

// --- 会員登録完了 ---
type SignupCompleteEventParams = {
  method: 'email' | 'google';
  store_consent: boolean;
};

export const sendSignupCompleteEvent = ({ method, store_consent }: SignupCompleteEventParams) => {
  sendEvent('signup_complete', { method, store_consent });
};

// --- ログイン完了 ---
type LoginCompleteEventParams = {
  method: 'email' | 'google';
};

export const sendLoginCompleteEvent = ({ method }: LoginCompleteEventParams) => {
  sendEvent('login_complete', { method });
};

// --- お気に入り追加・削除 ---
type FavoriteEventParams = {
  target_type: 'post' | 'event' | 'school';
  target_id: string;
};

export const sendFavoriteAddEvent = ({ target_type, target_id }: FavoriteEventParams) => {
  sendEvent('favorite_add', { target_type, target_id });
};

export const sendFavoriteRemoveEvent = ({ target_type, target_id }: FavoriteEventParams) => {
  sendEvent('favorite_remove', { target_type, target_id });
};

// --- イベント予約 ---
type EventReserveEventParams = {
  event_slug: string;
  event_title: string;
  quantity: number;
};

export const sendEventReserveEvent = ({
  event_slug,
  event_title,
  quantity,
}: EventReserveEventParams) => {
  sendEvent('event_reserve', { event_slug, event_title, quantity });
};

// --- 外部リンククリック ---
type OutboundClickEventParams = {
  url: string;
  link_text: string;
};

export const sendOutboundClickEvent = ({ url, link_text }: OutboundClickEventParams) => {
  sendEvent('outbound_click', { url, link_text });
};

export {}; // TypeScript module augment 確認用
