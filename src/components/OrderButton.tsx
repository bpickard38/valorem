"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";

/** Sends a scent straight to Shopify's hosted checkout. The label is the
 *  caller's — this component owns no copy but its own status text. */
export default function OrderButton({
  scent,
  children,
}: {
  scent: string;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function checkout() {
    setStatus("loading");
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
