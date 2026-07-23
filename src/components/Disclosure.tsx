import type { ReactNode } from "react";

/*
 * Expanding section — "Fragrance Notes", "Inspiration".
 *
 * Native <details> rather than a client component, matching the accordion on
 * /discovery: this keeps the product page a server component with no
 * hydration, and open/close still works with JS disabled, is keyboard
 * operable, and announces its own expanded state to a screen reader without
 * any aria wiring.
 *
 * The plus is drawn from two rules so it inherits the palette and needs no
 * icon set; `.marker-plus` (globals.css) rotates it into a close mark when the
 * <details> opens.
 */
export default function Disclosure({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-charcoal/12 first:border-t"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span className="label-engraved text-charcoal transition-colors group-hover:text-gold-deep">
          {title}
        </span>
        <span
          aria-hidden="true"
          className="marker-plus relative h-3 w-3 shrink-0"
        >
          <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-gold" />
          <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-gold" />
        </span>
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}
