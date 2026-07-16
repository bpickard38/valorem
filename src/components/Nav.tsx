import Link from "next/link";
import { PRICE } from "@/lib/site";

/* Static header — sits at the very top of the page and scrolls away with it. */
export default function Nav() {
  return (
    <div className="absolute inset-x-0 top-0 z-40 border-b border-charcoal/10 bg-ivory/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <a
          href="#hero"
          className="font-serif text-sm uppercase tracking-[0.4em] text-charcoal"
        >
          Valorem
        </a>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-[0.65rem] uppercase tracking-[0.25em] text-charcoal/60 transition-colors hover:text-gold"
          >
            ← The House
          </Link>
          <a
            href="#pantheon"
            className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-gold-deep transition-colors hover:text-charcoal"
          >
            Order — {PRICE}
          </a>
        </div>
      </nav>
    </div>
  );
}
