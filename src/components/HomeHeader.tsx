import Link from "next/link";
import CartButton from "@/components/CartButton";

/* Sticky light header shared by the home, /deity, /product, /faq and
 * /contact pages. */

const navLink =
  "text-[0.65rem] uppercase tracking-[0.25em] text-charcoal/60 transition-colors hover:text-gold";

export default function HomeHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-ivory/85 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5"
      >
        {/* Plain anchor (not next/link) so clicking the wordmark always does a
         * full reload back to the top of the home page, from any route. */}
        <a
          href="/"
          className="font-serif text-sm uppercase tracking-[0.4em] text-charcoal transition-colors hover:text-gold-deep"
        >
          Valorem
        </a>

        {/* All four items cannot share a 375px bar without overflowing, so on
            a phone the header keeps what shops: Collections and the bag.
            FAQ and Contact stay one tap away in the footer of every page. */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/deity#parthenon" className={navLink}>
            Collections
          </Link>
          <Link href="/faq" className={`${navLink} hidden sm:inline`}>
            FAQ
          </Link>
          <Link href="/contact" className={`${navLink} hidden sm:inline`}>
            Contact
          </Link>
          <CartButton />
        </div>
      </nav>
    </header>
  );
}
