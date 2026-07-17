import Link from "next/link";
import { PRICE } from "@/lib/site";

/* Sticky light header for the marketing home page.
 * /deity keeps its own absolute header (Nav.tsx) — do not merge them. */

const anchorLink =
  "text-[0.65rem] uppercase tracking-[0.25em] text-charcoal/60 transition-colors hover:text-gold";

export default function HomeHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-ivory/85 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5"
      >
        <a
          href="#top"
          className="font-serif text-sm uppercase tracking-[0.4em] text-charcoal transition-colors hover:text-gold-deep"
        >
          Valorem
        </a>

        <div className="hidden items-center gap-6 md:flex">
          <a href="#why-solid" className={anchorLink}>
            Why Solid
          </a>
          <a href="#how-it-works" className={anchorLink}>
            How It Works
          </a>
          <a href="#collection" className={anchorLink}>
            Collection
          </a>
          <a href="#house" className={anchorLink}>
            The House
          </a>
          <a href="#faq" className={anchorLink}>
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/deity" className={`hidden sm:inline ${anchorLink}`}>
            The Pantheon
          </Link>
          <a
            href="#collection"
            className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-gold-deep transition-colors hover:text-charcoal"
          >
            Shop — {PRICE}
          </a>
        </div>
      </nav>
    </header>
  );
}
