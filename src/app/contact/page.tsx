import type { Metadata } from "next";
import FadeIn from "@/components/FadeIn";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import SocialLinks from "@/components/SocialLinks";
import { ButtonLink, SectionHeader } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact — VALOREM Solid Fragrance",
  description: `Questions, orders, anything — write to ${CONTACT_EMAIL}.`,
};

export default function ContactPage() {
  return (
    <main className="flex-1">
      <HomeHeader />
      <section className="px-6 py-24 sm:py-28">
        <FadeIn className="text-center">
          <SectionHeader numeral="№" label="Contact" title="Write to the House" />
          <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed tracking-wide text-charcoal/65 sm:text-base">
            Questions about an order, the scents, or the format — send us a
            note and we&rsquo;ll get back to you.
          </p>
          <div className="mt-10">
            <ButtonLink href={`mailto:${CONTACT_EMAIL}`}>
              Email the House
            </ButtonLink>
          </div>
          <p className="mt-5 text-xs tracking-wide text-charcoal/55">
            {CONTACT_EMAIL}
          </p>
          <div className="mt-12 flex justify-center">
            <SocialLinks />
          </div>
        </FadeIn>
        <HomeFooter />
      </section>
    </main>
  );
}
