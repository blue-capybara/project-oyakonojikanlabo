import { useCallback, useEffect, useRef, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { getFeatureFlag } from '../config/featureFlags';
import { sendFavoriteAddEvent, sendFavoriteRemoveEvent } from '../lib/ga';

export type FavoriteTargetType = 'post' | 'event' | 'school';

export type ToggleFavoriteResult =
  | { success: true }
  | { success: false; reason: 'auth-required' | 'missing-target' | 'error' };

interface UseFavoriteOptions {
  targetType: FavoriteTargetType;
  targetId?: string | null;
}

interface UseFavoriteState {
  isFavorited: boolean;
  loading: boolean;
  processing: boolean;
  error: string | null;
  needsAuth: boolean;
  toggleFavorite: () => Promise<ToggleFavoriteResult>;
  refresh: () => Promise<void>;
}

const friendlyError = 'お気に入り状態の取得に失敗しました。時間をおいて再度お試しください。';
const friendlyToggleError = 'お気に入りの更新に失敗しました。時間をおいて再度お試しください。';

// 会員機能が無効な通常閲覧では Supabase SDK を初期バンドルへ含めない。
const loadSupabase = async () => (await import('../lib/supabaseClient')).supabase;

const isAuthSessionMissingError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as { name?: string; message?: string };
  return err.name === 'AuthSessionMissingError' || err.message?.includes('Auth session missing');
};

export const useFavorite = ({ targetType, targetId }: UseFavoriteOptions): UseFavoriteState => {
  const membershipEnabled = getFeatureFlag('showMembershipFeatures');
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const latestTargetId = useRef<string | null | undefined>(targetId);

  const sanitizedTargetId =
    typeof targetId === 'string' && targetId.trim().length > 0
      ? targetId.trim()
      : (targetId ?? null);

  const refresh = useCallback(async () => {
    latestTargetId.current = sanitizedTargetId;

    if (!membershipEnabled) {
      setIsFavorited(false);
      setLoading(false);
      setNeedsAuth(false);
      setError(null);
      return;
    }

    if (!sanitizedTargetId) {
      setIsFavorited(false);
      setLoading(false);
      setNeedsAuth(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = await loadSupabase();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        if (isAuthSessionMissingError(authError)) {
          setIsFavorited(false);
          setNeedsAuth(false);
          return;
        }

        throw authError;
      }

      if (!user) {
        setIsFavorited(false);
        setNeedsAuth(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', sanitizedTargetId)
        .maybeSingle();

      if (fetchError && (fetchError as PostgrestError).code !== 'PGRST116') {
        throw fetchError;
      }

      setIsFavorited(Boolean(data));
      setNeedsAuth(false);
    } catch (err) {
      if (isAuthSessionMissingError(err)) {
        setIsFavorited(false);
        setNeedsAuth(false);
        setError(null);
        return;
      }

      console.error('Failed to fetch favorite state:', err);
      setError(friendlyError);
      setIsFavorited(false);
    } finally {
      setLoading(false);
    }
  }, [membershipEnabled, sanitizedTargetId, targetType]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const run = async () => {
      if (!isMounted) return;
      await refresh();
    };

    run();

    if (!membershipEnabled) {
      setLoading(false);
      setProcessing(false);
      setNeedsAuth(false);
      setError(null);
      return () => {
        isMounted = false;
      };
    }

    void loadSupabase()
      .then((supabase) => {
        if (!isMounted) return;

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
          if (!isMounted) return;
          void refresh();
        });
        unsubscribe = () => subscription.unsubscribe();
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to subscribe to auth state changes:', err);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [membershipEnabled, refresh]);

  const toggleFavorite = useCallback(async (): Promise<ToggleFavoriteResult> => {
    if (!membershipEnabled) {
      return { success: false, reason: 'error' };
    }

    if (processing) {
      return { success: false, reason: 'error' };
    }

    const currentTargetId = latestTargetId.current ?? sanitizedTargetId;

    if (!currentTargetId) {
      setError('お気に入り対象が見つかりませんでした。');
      return { success: false, reason: 'missing-target' };
    }

    setProcessing(true);
    setError(null);
    setNeedsAuth(false);

    try {
      const supabase = await loadSupabase();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        if (isAuthSessionMissingError(authError)) {
          setNeedsAuth(true);
          return { success: false, reason: 'auth-required' };
        }

        throw authError;
      }

      if (!user) {
        setNeedsAuth(true);
        return { success: false, reason: 'auth-required' };
      }

      if (isFavorited) {
        const { error: deleteError } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('target_type', targetType)
          .eq('target_id', currentTargetId);

        if (deleteError) {
          throw deleteError;
        }

        setIsFavorited(false);
        sendFavoriteRemoveEvent({ target_type: targetType, target_id: currentTargetId });
        return { success: true };
      }

      const { error: insertError } = await supabase.from('favorites').insert({
        user_id: user.id,
        target_type: targetType,
        target_id: currentTargetId,
      });

      if (insertError) {
        const pgError = insertError as PostgrestError;

        // Gracefully handle unique constraint violations
        if (pgError.code === '23505') {
          setIsFavorited(true);
          sendFavoriteAddEvent({ target_type: targetType, target_id: currentTargetId });
          return { success: true };
        }

        throw insertError;
      }

      setIsFavorited(true);
      sendFavoriteAddEvent({ target_type: targetType, target_id: currentTargetId });
      return { success: true };
    } catch (err) {
      if (isAuthSessionMissingError(err)) {
        setNeedsAuth(true);
        return { success: false, reason: 'auth-required' };
      }

      console.error('Failed to toggle favorite:', err);
      setError(friendlyToggleError);
      return { success: false, reason: 'error' };
    } finally {
      setProcessing(false);
    }
  }, [isFavorited, membershipEnabled, processing, sanitizedTargetId, targetType]);

  return {
    isFavorited,
    loading,
    processing,
    error,
    needsAuth,
    toggleFavorite,
    refresh,
  };
};

export default useFavorite;
