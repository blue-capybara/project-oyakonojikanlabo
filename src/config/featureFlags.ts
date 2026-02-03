const toBoolean = (value: string | boolean | undefined, fallback: boolean) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'on', 'yes'].includes(normalized);
  }
  return fallback;
};

export const featureFlags = {
  showCollaborationSignup: toBoolean(import.meta.env.VITE_FEATURE_SHOW_COLLAB_SIGNUP, false),
  showPicoServiceSections: toBoolean(import.meta.env.VITE_FEATURE_SHOW_PICO_SERVICES, false),
  showMembershipFeatures: toBoolean(import.meta.env.VITE_FEATURE_SHOW_MEMBERSHIP, false),
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

export const getFeatureFlag = (key: FeatureFlagKey) => featureFlags[key];
