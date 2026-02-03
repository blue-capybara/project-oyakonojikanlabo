// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const DOMAIN = Deno.env.get("SHOPIFY_STORE_DOMAIN")!;
const TOKEN = Deno.env.get("SHOPIFY_ADMIN_TOKEN")!;
const API_VERSION = Deno.env.get("SHOPIFY_API_VERSION") ?? "2025-01";
const ALLOWED_ORIGINS = (Deno.env.get("SYNC_ALLOWED_ORIGINS") ?? "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const NEWSLETTER_TAG = Deno.env.get("NEWSLETTER_TAG") ?? "newsletter-only";

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

const gql = async (query: string, variables?: Record<string, unknown>) => {
  const res = await fetch(`https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`Shopify GQL error: ${res.status} ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.data;
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

const M_EMAIL_CONSENT = /* GraphQL */ `
mutation($input: CustomerEmailMarketingConsentUpdateInput!) {
  customerEmailMarketingConsentUpdate(input: $input) {
    customer { id email }
    userErrors { field message }
  }
}`;

const M_TAGS_ADD = /* GraphQL */ `
mutation($id: ID!, $tags: [String!]!) {
  customerTagsAdd(id: $id, tags: $tags) {
    customer { id }
    userErrors { field message }
  }
}`;

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

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
    const body = await req.json(); // { email: string }
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ ok: false, error: "invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const marketingConsent = {
      consentUpdatedAt: new Date().toISOString(),
      marketingState: "SUBSCRIBED",
      marketingOptInLevel: "SINGLE_OPT_IN",
    };

    const found = await gql(Q_FIND, { q: `email:${JSON.stringify(email)}` });
    const node = found.customers.edges?.[0]?.node;

    if (node?.id) {
      const updated = await gql(M_EMAIL_CONSENT, {
        input: { customerId: node.id, emailMarketingConsent: marketingConsent },
      });
      const consentErrors = updated.customerEmailMarketingConsentUpdate?.userErrors;
      if (consentErrors?.length) {
        throw new Error(`userErrors: ${JSON.stringify(consentErrors)}`);
      }

      if (NEWSLETTER_TAG) {
        const tagResult = await gql(M_TAGS_ADD, { id: node.id, tags: [NEWSLETTER_TAG] });
        const tagErrors = tagResult.customerTagsAdd?.userErrors;
        if (tagErrors?.length) {
          throw new Error(`tagErrors: ${JSON.stringify(tagErrors)}`);
        }
      }

      return new Response(JSON.stringify({ ok: true, action: "updated", id: node.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const created = await gql(M_CREATE, {
      input: {
        email,
        tags: NEWSLETTER_TAG ? [NEWSLETTER_TAG] : undefined,
        emailMarketingConsent: marketingConsent,
      },
    });

    const c = created.customerCreate;
    if (!c?.customer) throw new Error(`userErrors: ${JSON.stringify(c?.userErrors)}`);

    return new Response(JSON.stringify({ ok: true, action: "created", id: c.customer.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
