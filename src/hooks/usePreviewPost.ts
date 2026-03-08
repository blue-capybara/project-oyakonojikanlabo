import { useEffect, useMemo, useState } from 'react';

export type PreviewPost = {
  id: number;
  title: string;
  content: string;
  status: string;
  // プレビューAPIが返すアイキャッチを素直に格納
  featuredImage?: { sourceUrl?: string | null } | null;
  // API生データでよく使われるキー（型として持っておく）
  featured_image_url?: string | null;
  featured_image?: { source_url?: string | null } | null;
  // APIのキー違いも吸収するための正規化フィールド
  featuredImageUrl?: string | null;
  featured_media?: number;
  slug?: string;
  excerpt?: string;
  modified?: string;
};

type State = {
  data: PreviewPost | null;
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: State = {
  data: null,
  loading: false,
  error: null,
};

/**
 * WordPress のプレビュー REST API から記事データを取得するフック。
 * Application Password による Basic 認証を環境変数から自動付与します。
 *
 * 必須環境変数:
 * - VITE_WP_PREVIEW_API_BASE (例: https://cms.oyakonojikanlabo.jp/wp-json/preview/v1)
 * - VITE_WP_PREVIEW_AUTH_USER
 * - VITE_WP_PREVIEW_AUTH_PASSWORD
 */
export const usePreviewPost = (postId: string | null) => {
  const [state, setState] = useState<State>(INITIAL_STATE);

  const previewApiBase = import.meta.env.VITE_WP_PREVIEW_API_BASE;
  const previewAuthUser = import.meta.env.VITE_WP_PREVIEW_AUTH_USER;
  const previewAuthPassword = import.meta.env.VITE_WP_PREVIEW_AUTH_PASSWORD;

  // 末尾のスラッシュを除去して安全に連結
  const sanitizedBase = useMemo(() => {
    if (!previewApiBase) return null;
    return previewApiBase.replace(/\/$/, '');
  }, [previewApiBase]);

  useEffect(() => {
    // postId がない場合は即座に終了（エラー表示はしない）
    if (!postId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    // 必須の環境変数がそろっているかを事前チェック
    if (!sanitizedBase || !previewAuthUser || !previewAuthPassword) {
      console.error(
        'プレビューAPIの環境変数が不足しています。VITE_WP_PREVIEW_API_BASE / VITE_WP_PREVIEW_AUTH_USER / VITE_WP_PREVIEW_AUTH_PASSWORD を確認してください。',
      );
      setState({
        data: null,
        loading: false,
        error: 'プレビューAPIの設定が不足しています。環境変数を確認してください。',
      });
      return;
    }

    const controller = new AbortController();
    const url = `${sanitizedBase}/post/${postId}`;
    const basicToken = btoa(`${previewAuthUser}:${previewAuthPassword}`);
    const baseForMedia = sanitizedBase; // narrow for closure

    const fetchPost = async () => {
      setState({ data: null, loading: true, error: null });
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          mode: 'cors',
          headers: {
            Authorization: `Basic ${basicToken}`,
            Accept: 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = (await res.json()) as any;

        // アイキャッチ候補を複数パターンから探索
        const pickFeatured = (payload: any): string | null =>
          payload?.featuredImage?.sourceUrl ??
          payload?.featured_image_url ??
          payload?.featured_image?.source_url ??
          payload?.featured_image ??
          payload?.featured_media_url ??
          payload?.post_thumbnail ??
          payload?.post_thumbnail_url ??
          payload?.thumbnail ??
          payload?._embedded?.['wp:featuredmedia']?.[0]?.source_url ??
          null;

        let normalizedFeaturedImageUrl = pickFeatured(json);

        // featured_media ID があり、まだ URL が無い場合は wp/v2/media を叩いて取得
        if (!normalizedFeaturedImageUrl && typeof json?.featured_media === 'number') {
          const mediaId = json.featured_media;
          try {
            const origin = new URL(baseForMedia!).origin;
            const mediaUrl = `${origin}/wp-json/wp/v2/media/${mediaId}`;
            const mediaRes = await fetch(mediaUrl, {
              signal: controller.signal,
              mode: 'cors',
              headers: {
                Authorization: `Basic ${basicToken}`,
                Accept: 'application/json',
              },
            });
            if (mediaRes.ok) {
              const mediaJson = await mediaRes.json();
              normalizedFeaturedImageUrl =
                mediaJson?.source_url ?? mediaJson?.media_details?.sizes?.full?.source_url ?? null;
            }
          } catch (mediaErr) {
            if (!controller.signal.aborted) {
              console.warn('featured_media の取得に失敗しました', mediaErr);
            }
          }
        }

        const normalized: PreviewPost = {
          ...json,
          featuredImageUrl: normalizedFeaturedImageUrl,
        };

        setState({ data: normalized, loading: false, error: null });
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'データ取得に失敗しました';
        setState({ data: null, loading: false, error: message });
      }
    };

    fetchPost();
    return () => controller.abort();
  }, [postId, sanitizedBase, previewAuthUser, previewAuthPassword]);

  return state;
};
