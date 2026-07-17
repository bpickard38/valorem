"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/metaPixel";
import { CURRENCY, PRICE_AMOUNT } from "@/lib/site";

/** Fires a Meta ViewContent event once when a product page mounts. */
export default function TrackViewContent({
  contentId,
  contentName,
}: {
  contentId: string;
  contentName: string;
}) {
  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_ids: [contentId],
      content_name: contentName,
      content_type: "product",
      value: PRICE_AMOUNT,
      currency: CURRENCY,
    });
  }, [contentId, contentName]);

  return null;
}
