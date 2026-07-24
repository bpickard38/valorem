// Shopify orders/paid webhook → Meta Conversions API "Purchase".
//
// This is the single, deduped source of truth for Purchase. Because checkout
// is hosted on Shopify, the purchase completes where this app has no browser
// code — so we take it server-side off the webhook instead. event_id is the
// Shopify order id, so if Shopify redelivers the webhook (it retries for up to
// 48h) Meta collapses the duplicates into one Purchase. Firing server-side
// also means ad blockers can never drop it.
//
// Signing: webhooks registered through the Admin API are signed with the app's
// client secret; webhooks added manually under Settings → Notifications are
// signed with the secret shown on that page. Set SHOPIFY_WEBHOOK_SECRET to
// override; otherwise we fall back to SHOPIFY_CLIENT_SECRET.

import crypto from "node:crypto";
import { hashPii, sendMetaCapiEvent } from "@/lib/metaCapi";

export const dynamic = "force-dynamic";

type ShopifyAddress = {
  first_name?: string;
  last_name?: string;
  city?: string;
  province_code?: string;
  zip?: string;
  country_code?: string;
  phone?: string;
};

type ShopifyOrderWebhook = {
  id?: number | string;
  name?: string;
  email?: string;
  phone?: string;
  currency?: string;
  total_price?: string;
  current_total_price?: string;
  processed_at?: string;
  created_at?: string;
  order_status_url?: string;
  customer?: { id?: number | string } & ShopifyAddress & { email?: string };
  shipping_address?: ShopifyAddress;
  billing_address?: ShopifyAddress;
  line_items?: Array<{ product_id?: number | string; quantity?: number }>;
};

function verifyHmac(
  rawBody: string,
  hmacHeader: string | null,
  secret: string,
): boolean {
  if (!hmacHeader) return false;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");
  const expected = Buffer.from(digest);
  const received = Buffer.from(hmacHeader);
  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

export async function POST(request: Request) {
  const secret =
    process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_CLIENT_SECRET;
  if (!secret) {
    console.error("orders webhook: no signing secret configured");
    return new Response("Not configured", { status: 503 });
  }

  // Read the raw body BEFORE parsing — HMAC is computed over the exact bytes.
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  if (!verifyHmac(rawBody, hmac, secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let order: ShopifyOrderWebhook;
  try {
    order = JSON.parse(rawBody) as ShopifyOrderWebhook;
  } catch {
    // Garbage past a valid signature — nothing to retry.
    return new Response("Bad payload", { status: 200 });
  }

  if (order.id == null) {
    return new Response("Missing order id", { status: 200 });
  }

  const addr = order.shipping_address ?? order.billing_address ?? {};
  const customer = order.customer ?? {};

  const digits = (v?: string) => (v ? v.replace(/[^0-9]/g, "") : undefined);

  const userData: Record<string, unknown> = {};
  const put = (key: string, hashed: string | undefined) => {
    if (hashed) userData[key] = hashed;
  };
  put("em", hashPii(order.email ?? customer.email));
  put("ph", hashPii(digits(order.phone ?? customer.phone ?? addr.phone)));
  put("fn", hashPii(addr.first_name ?? customer.first_name));
  put("ln", hashPii(addr.last_name ?? customer.last_name));
  put("ct", hashPii(addr.city));
  put("st", hashPii(addr.province_code));
  put("zp", hashPii(addr.zip));
  put("country", hashPii(addr.country_code));
  if (customer.id != null) {
    put("external_id", hashPii(String(customer.id)));
  }

  const lineItems = Array.isArray(order.line_items) ? order.line_items : [];
  const customData: Record<string, unknown> = {
    currency: order.currency,
    value: Number(order.total_price ?? order.current_total_price ?? 0),
    content_type: "product",
    content_ids: lineItems
      .map((li) => (li.product_id == null ? "" : String(li.product_id)))
      .filter(Boolean),
    contents: lineItems.map((li) => ({
      id: li.product_id == null ? "" : String(li.product_id),
      quantity: Number(li.quantity) || 1,
    })),
    num_items: lineItems.reduce((n, li) => n + (Number(li.quantity) || 0), 0),
    order_id: order.name,
  };

  const parsedTime = Date.parse(order.processed_at ?? order.created_at ?? "");
  const eventTime = Number.isNaN(parsedTime)
    ? Math.floor(Date.now() / 1000)
    : Math.floor(parsedTime / 1000);

  const result = await sendMetaCapiEvent({
    event_name: "Purchase",
    event_time: eventTime,
    event_id: String(order.id),
    event_source_url: order.order_status_url,
    user_data: userData,
    custom_data: customData,
  });

  // On a downstream Meta failure, return non-2xx so Shopify retries — the
  // order-id event_id makes redelivery safe (Meta dedupes it).
  if (!result.ok) {
    return new Response("Downstream error", { status: 502 });
  }
  return new Response("ok", { status: 200 });
}
