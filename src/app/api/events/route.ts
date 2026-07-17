// Meta Conversions API relay — mirrors browser-pixel events server-side.
// The browser fires fbq() with an eventID; this route sends the same event
// with the same event_id so Meta deduplicates the pair.

const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
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

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN;
  if (!pixelId || !accessToken) {
    return Response.json({ error: "Not configured" }, { status: 503 });
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

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: typeof url === "string" ? url : undefined,
        action_source: "website",
        user_data: userData,
        custom_data:
          customData && typeof customData === "object" ? customData : undefined,
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      console.error("meta conversions api error:", await res.text());
      return Response.json({ error: "Meta rejected the event" }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("meta conversions api failed:", error);
    return Response.json({ error: "Failed to send event" }, { status: 502 });
  }
}
