"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui";

/* CTA that un-hides a server-rendered block (by element id) and scrolls to it.
 * The target block carries the `hidden` attribute in the markup; this button
 * is its only opener, so plain DOM manipulation is safe here. */
export default function RevealButton({
  targetId,
  children,
}: {
  targetId: string;
  children: ReactNode;
}) {
  return (
    <Button
      variant="outline"
      onClick={() => {
        const el = document.getElementById(targetId);
        if (!el) return;
        el.hidden = false;
        requestAnimationFrame(() =>
          el.scrollIntoView({ behavior: "smooth", block: "start" }),
        );
      }}
    >
      {children}
    </Button>
  );
}
