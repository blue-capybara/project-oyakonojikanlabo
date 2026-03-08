import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { sendLoginCompleteEvent, sendSignupCompleteEvent } from '../lib/ga';

const TRACKED_AUTH_KEY_PREFIX = 'ojl:ga4b:google-auth';
const RECENT_SIGNIN_THRESHOLD_MS = 10 * 60 * 1000;
const SIGNUP_DIFF_THRESHOLD_MS = 60 * 1000;

const toTimestamp = (value?: string | null): number | null => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const isGoogleUser = (user: User): boolean => {
  const provider = user.app_metadata?.provider;
  if (provider === 'google') return true;

  const providers = user.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes('google');
};

const getStoreConsent = (user: User): boolean => {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const value = metadata.store_consent;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

const hasRecentSignIn = (user: User): boolean => {
  const lastSignInAt = toTimestamp(user.last_sign_in_at);
  if (lastSignInAt === null) return false;
  return Date.now() - lastSignInAt <= RECENT_SIGNIN_THRESHOLD_MS;
};

const isSignupAtCurrentSignIn = (user: User): boolean => {
  const createdAt = toTimestamp(user.created_at);
  const lastSignInAt = toTimestamp(user.last_sign_in_at);
  if (createdAt === null || lastSignInAt === null) return false;
  return Math.abs(lastSignInAt - createdAt) <= SIGNUP_DIFF_THRESHOLD_MS;
};

const buildTrackKey = (user: User): string | null => {
  if (!user.last_sign_in_at) return null;
  return `${TRACKED_AUTH_KEY_PREFIX}:${user.id}:${user.last_sign_in_at}`;
};

const isTracked = (key: string): boolean => {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(key) === '1';
};

const markTracked = (key: string) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(key, '1');
};

const trackGoogleAuthConversion = (user: User | null | undefined) => {
  if (!user || !isGoogleUser(user) || !hasRecentSignIn(user)) return;

  const trackKey = buildTrackKey(user);
  if (!trackKey || isTracked(trackKey)) return;

  if (isSignupAtCurrentSignIn(user)) {
    sendSignupCompleteEvent({ method: 'google', store_consent: getStoreConsent(user) });
  } else {
    sendLoginCompleteEvent({ method: 'google' });
  }

  markTracked(trackKey);
};

const AuthConversionTracker = () => {
  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      trackGoogleAuthConversion(session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') return;
      trackGoogleAuthConversion(session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
};

export default AuthConversionTracker;
