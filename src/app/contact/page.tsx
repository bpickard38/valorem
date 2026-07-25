import type { Metadata } from "next";
import FadeIn from "@/components/FadeIn";
import ContactForm from "@/components/ContactForm";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import SocialLinks from "@/components/SocialLinks";
import { SectionHeader } from "@/components/ui";
import { CONTACT_SEO, toMetadata } from "@/lib/seo";

export const metadata: Metadata = toMetadata(CONTACT_SEO);

export default function ContactPage() {
  return (
    <main className="flex-1">
      <HomeHeader />
      <section className="px-6 py-24 sm:py-28">
        <FadeIn className="text-center">
          <SectionHeader numeral="№" label="Contact" title="Get in Touch" />
          <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed tracking-wide text-charcoal/65 sm:text-base">
            Questions about an order, the scents, or the format — send us a
            note and we&rsquo;ll get back to you.
          </p>
        </FadeIn>
        <FadeIn delay={120}>
          <ContactForm />
          <div className="mt-12 flex justify-center">
            <SocialLinks />
          </div>
        </FadeIn>
        <HomeFooter />
      </section>
    </main>
  );
}
