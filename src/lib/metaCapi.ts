// Server-side Meta Conversions API sender, used by the browser-event relay
// (/api/events) to mirror the pixel's browsing events (ViewContent, AddToCart,
// Lead) server-side with a shared event_id. Returns a result object instead of
// throwing — tracking must never take down the caller. (Purchase is NOT sent
// from here; the native Shopify Facebook channel owns it — see CartDrawer.)

import crypto from "node:crypto";

const GRAPH_VERSION = "v23.0";

export type MetaCapiEvent = {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  action_source?: string;
  user_data: Record<string, unknown>;
  custom_data?: Record<string, unknown>;
};

export type MetaCapiResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export function metaConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_META_PIXEL_ID &&
      process.env.META_CONVERSIONS_API_TOKEN,
  );
}

/** SHA-256 hex of a normalized string, or undefined for empty input. Meta
 *  requires PII (email, phone, name, address) be lowercased, trimmed, and
 *  hashed before it leaves your server. IP, user-agent, _fbp and _fbc are the
 *  exception — those are sent raw. */
export function hashPii(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export async function sendMetaCapiEvent(
  event: MetaCapiEvent,
): Promise<MetaCapiResult> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN;
  if (!pixelId || !accessToken) {
    return { ok: false, status: 503, error: "Not configured" };
  }

  // When META_TEST_EVENT_CODE is set, events route to Events Manager's Test
  // Events tab instead of live data — for verifying a new integration without
  // polluting real metrics. REMOVE it from the environment once verified, or
  // all real events stop counting toward live optimization.
  const testEventCode = process.env.META_TEST_EVENT_CODE;

  const payload = {
    data: [{ action_source: "website", ...event }],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("meta conversions api error:", text);
      return { ok: false, status: 502, error: text };
    }
    return { ok: true };
  } catch (error) {
    console.error("meta conversions api failed:", error);
    return { ok: false, status: 502, error: String(error) };
  }
}
