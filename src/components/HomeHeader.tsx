import Link from "next/link";
import CartButton from "@/components/CartButton";
import MobileNav from "@/components/MobileNav";
import type { NavItem } from "@/components/MobileNav";

/* Sticky light header shared by the home, /collections, /product, /faq and
 * /contact pages.
 *
 * Phone layout: hamburger + wordmark on the left, bag on the right, links
 * behind the hamburger. From sm up the links sit inline and the hamburger
 * disappears. One NAV_ITEMS list feeds both so they can't drift apart. */

/* Collections leads. The Discovery Set used to sit above it as the cheap way
 * in; that route was retired on 2026-07-25 and the cheap way in is now the
 * 5 ml size on each product page, which is behind this same link.
 *
 * "Find Your Scent" points at the quiz, which lives in a section of the home
 * page rather than on a route of its own — hence the /#quiz href, which works
 * from every other page too. It sits second because it is the lower-commitment
 * of the two shopping entrances: someone who already knows what they want taps
 * Collections, and someone who does not has somewhere to go that is not a
 * six-product grid. */
const NAV_ITEMS: NavItem[] = [
  { href: "/collections", label: "Collections" },
  { href: "/#quiz", label: "Find Your Scent" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const navLink =
  "text-[0.65rem] uppercase tracking-[0.25em] text-charcoal/60 transition-colors hover:text-gold";

export default function HomeHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-ivory/85 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5"
      >
        <div className="flex items-center gap-3">
          <MobileNav items={NAV_ITEMS} />
          {/* Plain anchor (not next/link) so clicking the wordmark always does
           * a full reload back to the top of the home page, from any route. */}
          <a
            href="/"
            className="font-serif text-sm uppercase tracking-[0.4em] text-charcoal transition-colors hover:text-gold-deep"
          >
            Valorem
          </a>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={navLink}>
                {item.label}
              </Link>
            ))}
          </div>
          <CartButton />
        </div>
      </nav>
    </header>
  );
}
