// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ORIGINS = (Deno.env.get("ADMIN_RESERVATIONS_ALLOWED_ORIGINS") ?? "*")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const ALLOWED_EMAILS = (Deno.env.get("ADMIN_RESERVATIONS_ALLOWED_EMAILS") ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const ALLOWED_ROLE = (Deno.env.get("ADMIN_RESERVATIONS_ALLOWED_ROLE") ?? "").trim();

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type ReservationRecord = {
  id: string;
  reservation_code: string;
  user_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  event_slug?: string | null;
  event_title?: string | null;
  event_date?: string | null;
  time_slot?: string | null;
  quantity?: number | null;
  status?: string | null;
  phone?: string | null;
  special_requests?: string | null;
  event_location?: string | null;
  event_region?: string | null;
  created_at?: string | null;
};

type RequestPayload = {
  eventSlug?: string;
  limit?: number;
};

const buildCorsHeaders = (origin: string | null) => {
  if (!ALLOWED_ORIGINS.length) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };
  }

  const allowOrigin = ALLOWED_ORIGINS.includes("*")
    ? "*"
    : origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
};

const isAuthorizedUser = (user: any) => {
  if (!user) return false;

  const email = (user.email ?? "").toLowerCase();
  if (ALLOWED_EMAILS.length && !ALLOWED_EMAILS.includes(email)) {
    return false;
  }

  if (ALLOWED_ROLE) {
    const appRoles: string[] = Array.isArray(user.app_metadata?.roles) ? user.app_metadata.roles : [];
    const userRole = typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null;

    if (!appRoles.includes(ALLOWED_ROLE) && userRole !== ALLOWED_ROLE) {
      return false;
    }
  }

  return true;
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: "missing_token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !isAuthorizedUser(user)) {
    return new Response(JSON.stringify({ ok: false, error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: RequestPayload = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      payload = (await req.json()) as RequestPayload;
    }
  } catch (_error) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { eventSlug, limit } = payload;
  const effectiveLimit = Math.min(Math.max(limit ?? 200, 1), 1000);

  let query = supabaseAdmin
    .from("reservations")
    .select(
      "id, reservation_code, user_id, customer_name, customer_email, event_slug, event_title, event_date, time_slot, quantity, status, phone, special_requests, event_location, event_region, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(effectiveLimit);

  if (eventSlug) {
    query = query.eq("event_slug", eventSlug);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      reservations: await enrichWithUserProfiles((data ?? []) as ReservationRecord[]),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});

async function enrichWithUserProfiles(rows: ReservationRecord[]) {
  if (!rows.length) return rows;

  const targetIds = Array.from(
    new Set(
      rows
        .filter((row) => (!row.customer_name || !row.customer_email) && row.user_id)
        .map((row) => row.user_id!) ?? [],
    ),
  );

  if (!targetIds.length) return rows;

  const cache = new Map<
    string,
    {
      name: string | null;
      email: string | null;
    }
  >();

  await Promise.all(
    targetIds.map(async (userId) => {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (error || !data?.user) {
          return;
        }

        const metadata: Record<string, unknown> = data.user.user_metadata ?? {};
        const metadataName =
          typeof metadata.name === "string"
            ? metadata.name.trim()
            : [
                typeof metadata.family_name === "string" ? metadata.family_name.trim() : "",
                typeof metadata.given_name === "string" ? metadata.given_name.trim() : "",
              ]
                .filter(Boolean)
                .join(" ")
                .trim();

        cache.set(userId, {
          name: metadataName || null,
          email: data.user.email ?? null,
        });
      } catch (_) {
        // 念のため supabase 側で失敗しても処理を継続
      }
    }),
  );

  if (!cache.size) return rows;

  return rows.map((row) => {
    if ((!row.customer_name || !row.customer_email) && row.user_id && cache.has(row.user_id)) {
      const fallback = cache.get(row.user_id)!;
      return {
        ...row,
        customer_name: row.customer_name ?? fallback.name ?? null,
        customer_email: row.customer_email ?? fallback.email ?? null,
      };
    }
    return row;
  });
}
