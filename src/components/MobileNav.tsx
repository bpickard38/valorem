"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

/* Phone navigation: a hamburger beside the wordmark that expands the links
 * into a list under the header. Desktop keeps the links inline and never
 * renders this (the parent hides it from sm up).
 *
 * The panel is absolutely positioned against the <header>, so opening it
 * overlays the page instead of pushing the hero down — no layout shift. */
export default function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [seenPath, setSeenPath] = useState(pathname);

  /* Close on route change. Each link closes itself on click, but a browser
   * back/forward (or an edge-swipe on iOS) navigates without one, and this
   * component stays mounted across those — the menu would still be hanging
   * open on the page you land on.
   *
   * Adjusted during render rather than in an effect: React re-renders
   * immediately with the new state instead of painting the stale open menu
   * first and closing it a frame later. */
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        /* Full 44px target, pulled into the header's padding with negative
         * margins so the bar keeps its height. */
        className="-my-3 -ml-3 flex h-11 w-11 items-center justify-center text-charcoal/70 transition-colors hover:text-gold-deep sm:hidden"
      >
        {/* Three rules that fold into an X. Fixed 14px box so the bars pivot
         * around a stable centre. */}
        <span aria-hidden="true" className="relative block h-3.5 w-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`absolute left-0 block h-px w-full bg-current transition-all duration-300 ease-out ${
                i === 0
                  ? open
                    ? "top-1/2 rotate-45"
                    : "top-0 rotate-0"
                  : i === 1
                    ? `top-1/2 ${open ? "opacity-0" : "opacity-100"}`
                    : open
                      ? "top-1/2 -rotate-45"
                      : "top-full rotate-0"
              }`}
            />
          ))}
        </span>
      </button>

      {/* Tap-outside-to-close. z-30 keeps it below the z-40 header, so the
          header (and this button) stay tappable while it is up. */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 sm:hidden ${open ? "block" : "hidden"}`}
      />

      <div
        id="mobile-menu"
        /* Collapsed, the links still occupy the a11y tree and tab order —
         * zero height is not hidden. `inert` takes them out of both without
         * the `visibility: hidden` that would kill the open animation. */
        inert={!open}
        /* grid-rows 0fr → 1fr animates a list of unknown height without
         * hardcoding a max-height that would clip or lag. */
        className={`absolute inset-x-0 top-full z-40 grid overflow-hidden border-charcoal/10 bg-ivory/95 backdrop-blur-md transition-all duration-300 ease-out sm:hidden ${
          open
            ? "grid-rows-[1fr] border-b opacity-100"
            : "grid-rows-[0fr] border-b-0 opacity-0"
        }`}
      >
        <div className="min-h-0">
          <ul className="flex flex-col px-6 py-2">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-charcoal/5 py-4 text-[0.7rem] uppercase tracking-[0.25em] text-charcoal/70 transition-colors last:border-b-0 hover:text-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
