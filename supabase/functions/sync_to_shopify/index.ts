// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const DOMAIN = Deno.env.get("SHOPIFY_STORE_DOMAIN")!;
const TOKEN = Deno.env.get("SHOPIFY_ADMIN_TOKEN")!;
const API_VERSION = Deno.env.get("SHOPIFY_API_VERSION") ?? "2025-01";
const ALLOWED_ORIGINS = (Deno.env.get("SYNC_ALLOWED_ORIGINS") ?? "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const buildCorsHeaders = (origin: string | null) => {
  const allowOrigin = ALLOWED_ORIGINS.includes("*")
    ? "*"
    : origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0] ?? "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};

const GQL = async (query: string, variables?: Record<string, unknown>) => {
  const r = await fetch(`https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error(`Shopify GQL error: ${r.status} ${JSON.stringify(j.errors ?? j)}`);
  return j.data;
};

const Q_FIND = /* GraphQL */ `
query($q: String!) {
  customers(first: 1, query: $q) {
    edges { node { id email } }
  }
}`;
const M_CREATE = /* GraphQL */ `
mutation($input: CustomerInput!) {
  customerCreate(input: $input) {
    customer { id email }
    userErrors { field message }
  }
}`;

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }

  try {
    const body = await req.json(); // { email: string; userId: string; consent?: boolean }
    const { email, userId, consent } = body ?? {};
    if (!email || !userId) {
      return new Response(JSON.stringify({ ok: false, error: "missing email/userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (consent !== true) {
      return new Response(JSON.stringify({ ok: true, action: "skipped" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 既存顧客チェック
    const found = await GQL(Q_FIND, { q: `email:${JSON.stringify(email)}` });
    const node = found.customers.edges?.[0]?.node;

    if (node) {
      // 既存ならOK（必要ならここでメタフィールドに supabase_user_id を追記）
      return new Response(JSON.stringify({ ok: true, action: "exists", id: node.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 新規作成（必要最低限）
    const input = {
      email,
      // 任意：メタフィールドに Supabase User ID を持たせたい場合
      // metafields: [{ namespace: "ext", key: "supabase_user_id", type: "single_line_text_field", value: userId }],
      emailMarketingConsent: {
        marketingState: "NOT_SUBSCRIBED", // 初期値は未購読。UIで切り替え時に別Mutationで更新
        marketingOptInLevel: "SINGLE_OPT_IN",
        consentUpdatedAt: new Date().toISOString(),
      },
    };
    const created = await GQL(M_CREATE, { input });
    const c = created.customerCreate;
    if (!c?.customer) throw new Error(`userErrors: ${JSON.stringify(c?.userErrors)}`);

    return new Response(JSON.stringify({ ok: true, action: "created", id: c.customer.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
