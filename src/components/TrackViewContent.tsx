"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/metaPixel";
import { CURRENCY, PRICE_AMOUNT } from "@/lib/site";

/** Fires a Meta ViewContent event once when a product page mounts.
 *
 * `value` defaults to the stick price; pages for anything priced differently
 * (the discovery sets) must pass their own so the optimiser is not told every
 * view is worth $70. */
export default function TrackViewContent({
  contentId,
  contentName,
  value = PRICE_AMOUNT,
}: {
  contentId: string;
  contentName: string;
  value?: number;
}) {
  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_ids: [contentId],
      content_name: contentName,
      content_type: "product",
      value,
      currency: CURRENCY,
    });
  }, [contentId, contentName, value]);

  return null;
}
