// Meta Conversions API relay — mirrors browser-pixel events server-side.
// The browser fires fbq() with an eventID; this route sends the same event
// with the same event_id so Meta deduplicates the pair. The actual send lives
// in src/lib/metaCapi.ts, shared with the orders/paid webhook.

import { sendMetaCapiEvent } from "@/lib/metaCapi";

const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Lead",
]);

function cookieValue(header: string | null, name: string): string | undefined {
  const match = header?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1];
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { eventName, eventId, url, customData } =
    body && typeof body === "object" ? body : ({} as Record<string, unknown>);

  if (typeof eventName !== "string" || !ALLOWED_EVENTS.has(eventName)) {
    return Response.json({ error: "Unknown event" }, { status: 400 });
  }
  if (typeof eventId !== "string" || !eventId) {
    return Response.json({ error: "Missing eventId" }, { status: 400 });
  }

  // Identity signals come from the request itself, not the client payload —
  // the browser can't spoof what the server observes directly.
  const cookieHeader = request.headers.get("cookie");
  const userData: Record<string, string> = {};
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent");
  const fbp = cookieValue(cookieHeader, "_fbp");
  const fbc = cookieValue(cookieHeader, "_fbc");
  if (ip) userData.client_ip_address = ip;
  if (userAgent) userData.client_user_agent = userAgent;
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const result = await sendMetaCapiEvent({
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: typeof url === "string" ? url : undefined,
    user_data: userData,
    custom_data:
      customData && typeof customData === "object" ? customData : undefined,
  });

  if (!result.ok) {
    const message =
      result.status === 503 ? "Not configured" : "Meta rejected the event";
    return Response.json({ error: message }, { status: result.status });
  }
  return Response.json({ ok: true });
}
