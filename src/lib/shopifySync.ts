import { supabase } from './supabaseClient';

type SyncPayload = {
  email: string;
  userId: string;
  consent?: boolean;
};

type SyncResponse =
  | {
      ok: true;
      action: 'created' | 'exists' | 'skipped';
      id?: string;
    }
  | {
      ok: false;
      error?: string;
    };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ShopifySyncError extends Error {
  public cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ShopifySyncError';
    this.cause = cause;
  }
}

export async function syncCustomerOnSignup(
  payload: SyncPayload,
  options: { maxAttempts?: number } = {},
): Promise<SyncResponse> {
  if (payload.consent !== true) {
    return { ok: true as const, action: 'skipped' as const };
  }

  const maxAttempts = options.maxAttempts ?? 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { data, error } = await supabase.functions.invoke<SyncResponse>('sync_to_shopify', {
        body: payload,
      });

      if (error) {
        throw error;
      }

      if (!data?.ok) {
        throw new Error(data?.error ?? 'Shopify sync returned an unexpected response.');
      }

      return data;
    } catch (err) {
      lastError = err;

      if (attempt === maxAttempts) {
        break;
      }

      const delay = 300 * 2 ** (attempt - 1);
      await wait(delay);
    }
  }

  throw new ShopifySyncError('Failed to sync customer to Shopify.', lastError);
}
