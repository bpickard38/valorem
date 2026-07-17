// Client-side Meta event tracking. Fires the browser pixel and the
// Conversions API relay (/api/events) with one shared event ID so Meta
// deduplicates the pair. Fire-and-forget: tracking must never block or
// break the shopping flow.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type MetaEventName =
  | "ViewContent"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase";

export function trackMetaEvent(
  eventName: MetaEventName,
  customData: Record<string, unknown> = {},
) {
  const eventId = `${eventName}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 11)}`;

  window.fbq?.("track", eventName, customData, { eventID: eventId });

  // keepalive lets the request finish even when the page immediately
  // navigates away (e.g. off to Shopify checkout).
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      eventName,
      eventId,
      url: window.location.href,
      customData,
    }),
  }).catch(() => {});
}
