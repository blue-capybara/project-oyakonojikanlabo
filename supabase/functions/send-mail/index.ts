/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const RESEND_API_URL = "https://api.resend.com/emails"
const FROM_ADDRESS = "親子の時間研究所 <no-reply@oyakonojikanlabo.jp>"
const PICO_ADMIN_TO_DEFAULT = "pico-toyonaka@oyako-jikan.net"

// フロントの value と一致する問い合わせ種別ラベル
const INQUIRY_LABEL_MAP: Record<string, string> = {
  pico: "PICO豊中について",
  product: "商品のことを聞きたい",
  product_defect: "商品の不良について",
  wholesale: "卸売りについて",
  media: "取材、メディア関係のご相談",
  book_art_event: "絵本アート系イベントを掲載したい",
  other: "その他ご相談",
}

const getInquiryLabel = (type: string): string => INQUIRY_LABEL_MAP[type] ?? type

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const supabaseAdmin = SUPABASE_URL && SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null

// 宛先を環境変数で運用できるようにする
const getRecipientsFromEnv = (key: string): string[] =>
  (Deno.env.get(key) ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)

const resolveAdminRecipients = (inquiryType: string) => {
  const isPico = inquiryType === "pico"

  if (isPico) {
    // PICO専用の管理通知メール宛先です。運用で変更する場合は以下を調整してください。
    // 1) 環境変数: ADMIN_TO_PICO（未設定時は PICO_ADMIN_TO_DEFAULT を使用）
    // 2) 直接コード内の PICO_ADMIN_TO_DEFAULT を変更
    const picoTo = getRecipientsFromEnv("ADMIN_TO_PICO")
    return {
      to: picoTo.length ? picoTo : [PICO_ADMIN_TO_DEFAULT],
      // CC/BCC を使う場合は ADMIN_CC_PICO / ADMIN_BCC_PICO を設定してください。
      cc: getRecipientsFromEnv("ADMIN_CC_PICO"),
      bcc: getRecipientsFromEnv("ADMIN_BCC_PICO"),
    }
  }

  return {
    to: getRecipientsFromEnv("ADMIN_TO"),
    cc: getRecipientsFromEnv("ADMIN_CC"),
    bcc: getRecipientsFromEnv("ADMIN_BCC"),
  }
}

type ContactPayload = {
  requestId?: string
  name: string
  email: string
  phone: string
  inquiry_type: string
  message: string
  image_urls?: string[]
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return map[char]
  })

const buildImageLinks = (imageUrls: string[]) => {
  if (!imageUrls.length) return "<p>添付画像なし</p>"
  const items = imageUrls
    .map((url) => `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`)
    .join("")
  return `<ul>${items}</ul>`
}

const buildAdminHtml = (
  payload: ContactPayload & { image_urls: string[] },
  requestId: string,
  uploadBasePath: string,
) => `
  <p>新しいお問い合わせを受け付けました。</p>
  <p><strong>受付ID:</strong> ${requestId}</p>
  <p><strong>アップロードパス:</strong> ${uploadBasePath}</p>
  <p><strong>お名前:</strong> ${escapeHtml(payload.name)}</p>
  <p><strong>メールアドレス:</strong> ${escapeHtml(payload.email)}</p>
  <p><strong>電話番号:</strong> ${escapeHtml(payload.phone)}</p>
  <p><strong>お問い合わせ種別:</strong> ${escapeHtml(getInquiryLabel(payload.inquiry_type))}</p>
  <p><strong>メッセージ本文:</strong></p>
  <div style="padding:12px;border:1px solid #ddd;border-radius:8px;white-space:pre-wrap;">${escapeHtml(payload.message)}</div>
  <p><strong>添付画像URL:</strong></p>
  ${buildImageLinks(payload.image_urls)}
`

const buildUserHtml = (payload: ContactPayload & { image_urls: string[] }, requestId: string) => `
  <p>${escapeHtml(payload.name)} 様</p>
  <p>お問い合わせありがとうございます。受付IDは <strong>${requestId}</strong> です。</p>
  <p>以下の内容で受け付けました。数営業日以内に返信いたします。</p>
  <p><strong>お名前:</strong> ${escapeHtml(payload.name)}</p>
  <p><strong>お問い合わせ種別:</strong> ${escapeHtml(getInquiryLabel(payload.inquiry_type))}</p>
  <p><strong>ご入力内容:</strong></p>
  <div style="padding:12px;border:1px solid #ddd;border-radius:8px;white-space:pre-wrap;">${escapeHtml(payload.message)}</div>
  <p>※画像を添付いただいた場合も、正しく受信しています。</p>
  <p>引き続きよろしくお願いいたします。</p>
`

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders })
  }

  try {
    let payload: ContactPayload
    try {
      payload = (await req.json()) as ContactPayload
    } catch (_error) {
      return new Response(JSON.stringify({ error: "Bad Request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { requestId, name, email, phone, inquiry_type, message } = payload

    if (!requestId || !name || !email || !phone || !inquiry_type || !message) {
      return new Response(JSON.stringify({ error: "Bad Request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const today = new Date().toISOString().slice(0, 10)
    const uploadBasePath = `contact-attachments/${today}/${requestId}`
    const imageUrls = Array.isArray(payload.image_urls)
      ? payload.image_urls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
      : []
    const { to: adminTo, cc: adminCc, bcc: adminBcc } = resolveAdminRecipients(inquiry_type)

    if (!adminTo.length) {
      console.error("send-mail: ADMIN_TO is empty")
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const apiKey = Deno.env.get("RESEND_API_KEY")
    if (!apiKey || !supabaseAdmin) {
      console.error("send-mail: missing env")
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const inquiryLabel = getInquiryLabel(inquiry_type)
    const adminResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: adminTo,
        ...(adminCc.length ? { cc: adminCc } : {}),
        ...(adminBcc.length ? { bcc: adminBcc } : {}),
        subject: `【お問い合わせ】${inquiryLabel}（ID: ${requestId}）`,
        html: buildAdminHtml({ ...payload, image_urls: imageUrls }, requestId, uploadBasePath),
      }),
    })

    if (!adminResponse.ok) {
      console.error("send-mail: admin mail failed", adminResponse.status, await adminResponse.text())
      throw new Error("admin mail failed")
    }

    const userResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        subject: "【親子の時間研究所】お問い合わせを受け付けました",
        html: buildUserHtml({ ...payload, image_urls: imageUrls }, requestId),
      }),
    })

    if (!userResponse.ok) {
      console.error("send-mail: user mail failed", userResponse.status, await userResponse.text())
      throw new Error("user mail failed")
    }

    // メール送信成功を確認してから保存し、一貫性を担保する
    const { error: dbError } = await supabaseAdmin.from("contact_messages").insert({
      request_id: requestId,
      name,
      email,
      phone,
      inquiry_type,
      message,
      image_urls: imageUrls,
    })

    if (dbError) {
      console.error("send-mail: db insert failed", dbError.message)
      throw new Error("db insert failed")
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("send-mail: unexpected error", error)
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
