import type { Metadata } from "next";
import FadeIn from "@/components/FadeIn";
import Faq from "@/components/Faq";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import { SectionHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "FAQ — VALOREM Solid Fragrance",
  description:
    "How long solid fragrance lasts, shipping, returns, sizing, and what's inside the twist-up stick.",
};

export default function FaqPage() {
  return (
    <main className="flex-1">
      <HomeHeader />
      <section className="px-6 py-24 sm:py-28">
        <FadeIn>
          <SectionHeader numeral="№" label="Questions" title="Frequently Asked" />
        </FadeIn>
        <FadeIn delay={120} className="mx-auto mt-14 max-w-2xl">
          <Faq />
        </FadeIn>
        <HomeFooter />
      </section>
    </main>
  );
}
