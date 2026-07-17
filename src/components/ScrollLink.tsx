"use client";

import type { ComponentProps } from "react";
import { ButtonLink } from "@/components/ui";

/* A ButtonLink that scrolls to a same-page anchor WITHOUT putting the #hash
 * in the address bar — so a later reload starts from the top of the page
 * instead of jumping back to the section. */
export default function ScrollLink({
  href,
  onClick,
  ...props
}: ComponentProps<typeof ButtonLink>) {
  return (
    <ButtonLink
      href={href}
      onClick={(e) => {
        const id = typeof href === "string" ? href.split("#")[1] : undefined;
        const target = id ? document.getElementById(id) : null;
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth" });
        }
        onClick?.(e);
      }}
      {...props}
    />
  );
}
