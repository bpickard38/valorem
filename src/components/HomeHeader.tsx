import Link from "next/link";
import CartButton from "@/components/CartButton";
import MobileNav from "@/components/MobileNav";
import type { NavItem } from "@/components/MobileNav";

/* Sticky light header shared by the home, /deity, /product, /faq and
 * /contact pages.
 *
 * Phone layout: hamburger + wordmark on the left, bag on the right, links
 * behind the hamburger. From sm up the links sit inline and the hamburger
 * disappears. One NAV_ITEMS list feeds both so they can't drift apart. */

/* Discovery leads: it is the cheapest way into the house and where the paid
 * traffic lands, so it should be the first thing offered to anyone who came
 * in some other way. */
const NAV_ITEMS: NavItem[] = [
  { href: "/discovery", label: "Discovery Set" },
  { href: "/deity#parthenon", label: "Collections" },
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
