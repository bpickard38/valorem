import Link from "next/link";

/* Sticky light header shared by the home, /faq, and /contact pages.
 * /deity keeps its own header (Nav.tsx). */

const navLink =
  "text-[0.65rem] uppercase tracking-[0.25em] text-charcoal/60 transition-colors hover:text-gold";

export default function HomeHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-ivory/85 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5"
      >
        <Link
          href="/"
          className="font-serif text-sm uppercase tracking-[0.4em] text-charcoal transition-colors hover:text-gold-deep"
        >
          Valorem
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/deity" className={navLink}>
            Collections
          </Link>
          <Link href="/faq" className={navLink}>
            FAQ
          </Link>
          <Link href="/contact" className={navLink}>
            Contact
          </Link>
        </div>
      </nav>
    </header>
  );
}
