import Image from "next/image";
import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";
import { CONTACT_EMAIL, RETURN_WINDOW } from "@/lib/site";

/* Footer shared by the home, collection, product, /faq and /contact pages. */

const footerLink =
  "text-[0.65rem] uppercase tracking-[0.25em] text-charcoal/60 transition-colors hover:text-gold";

export default function HomeFooter() {
  return (
    <footer className="mx-auto mt-28 flex max-w-4xl flex-col items-center gap-7 border-t border-charcoal/10 pt-14">
      <Image
        src="/valorem-pegasus.png"
        alt="Valorem"
        width={572}
        height={589}
        className="h-auto w-14 opacity-80"
      />
      <p className="label-engraved font-serif text-charcoal/80">Valorem</p>
      <div className="flex items-center gap-6">
        <Link href="/collections" className={footerLink}>
          Collections
        </Link>
        <Link href="/faq" className={footerLink}>
          FAQ
        </Link>
        <Link href="/contact" className={footerLink}>
          Contact
        </Link>
        <Link href="/privacy" className={footerLink}>
          Privacy
        </Link>
      </div>
      <SocialLinks />
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="text-xs tracking-wide text-charcoal/55 transition-colors hover:text-gold-deep"
      >
        {CONTACT_EMAIL}
      </a>
      <p className="max-w-md text-center text-xs leading-relaxed text-charcoal/45">
        Returns accepted within {RETURN_WINDOW} of delivery.
      </p>
      <p className="text-xs tracking-[0.2em] text-charcoal/45">© 2026 VALOREM</p>
    </footer>
  );
}
