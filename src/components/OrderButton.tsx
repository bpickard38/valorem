"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { trackMetaEvent } from "@/lib/metaPixel";
import { CURRENCY, PRICE_AMOUNT } from "@/lib/site";

/** Shared checkout flow — sends a scent straight to Shopify's hosted checkout. */
function useCheckout(scent: string) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  // Back from Shopify restores this page from the bfcache with the frozen
  // "loading" state — the button would sit on "One moment", disabled, forever.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setStatus("idle");
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function checkout() {
    if (status === "loading") return;
    setStatus("loading");
    trackMetaEvent("InitiateCheckout", {
      content_ids: [scent],
      content_type: "product",
      value: PRICE_AMOUNT,
      currency: CURRENCY,
    });
    // If Back from Shopify comes home as a fresh load (no bfcache), the whole
    // experience resets to frame one and the tins vanish. Leave a note so the
    // film jumps straight back to the finale. Home page only — the product
    // pages keep their own scroll.
    if (window.location.pathname === "/") {
      sessionStorage.setItem("return-to-finale", "1");
    }
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scent }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error);
      window.location.assign(data.url);
    } catch {
      setStatus("error");
    }
  }

  return { status, checkout };
}

/** The label is the caller's — this component owns no copy but its own
 *  status text. */
export default function OrderButton({
  scent,
  children,
}: {
  scent: string;
  children: ReactNode;
}) {
  const { status, checkout } = useCheckout(scent);

  return (
    <>
      <Button type="button" onClick={checkout} disabled={status === "loading"}>
        {status === "loading" ? "One moment" : children}
      </Button>
      {status === "error" && (
        <p className="mt-3 text-xs tracking-wide text-charcoal/70">
          Checkout is unavailable right now. Try again shortly.
        </p>
      )}
    </>
  );
}

/** Makes an entire region — image, copy, whitespace — click through to a
 *  scent's checkout. Renders its own order button; a single click anywhere
 *  in the zone (the button included, via bubbling) starts checkout once. */
export function CheckoutZone({
  scent,
  buttonLabel,
  note,
  children,
  className = "",
}: {
  scent: string;
  buttonLabel: ReactNode;
  note?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { status, checkout } = useCheckout(scent);

  return (
    <div className={`cursor-pointer ${className}`} onClick={checkout}>
      {children}
      <div className="mt-8 text-center">
        <Button type="button" disabled={status === "loading"}>
          {status === "loading" ? "One moment" : buttonLabel}
        </Button>
        {status === "error" && (
          <p className="mt-3 text-xs tracking-wide text-charcoal/70">
            Checkout is unavailable right now. Try again shortly.
          </p>
        )}
        {note ? (
          <p className="mt-3 text-xs tracking-wide text-charcoal/50">{note}</p>
        ) : null}
      </div>
    </div>
  );
}
