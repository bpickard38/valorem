import type { Metadata } from "next";
import Link from "next/link";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import { SectionHeader } from "@/components/ui";
import { CONTACT_EMAIL, RETURN_WINDOW } from "@/lib/site";

/*
 * Privacy policy. Required independently of any cookie banner: Meta's
 * Business Tools Terms and Microsoft Clarity's terms both oblige us to
 * disclose their use, and Meta ad reviews check for this page.
 *
 * Everything here describes what the site actually does — the trackers listed
 * are exactly those loaded in layout.tsx. If a tracker is added or removed
 * there, update this page in the same commit or it becomes a false statement.
 */

const LAST_UPDATED = "21 July 2026";

export const metadata: Metadata = {
  title: "Privacy Policy — VALOREM",
  description:
    "What VALOREM collects, why, who we share it with, and how to opt out.",
};

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-serif text-xl text-charcoal sm:text-2xl">{heading}</h2>
      <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-charcoal/70">
        {children}
      </div>
    </section>
  );
}

const linkStyle =
  "text-gold-deep underline underline-offset-4 transition-colors hover:text-gold";

export default function PrivacyPage() {
  return (
    <main className="flex-1">
      <HomeHeader />

      <div className="mx-auto w-full max-w-2xl px-5 pb-16 pt-12 md:px-6">
        <SectionHeader numeral="§" label="Privacy" align="left" />
        <h1 className="type-heading mt-7 text-charcoal">Privacy Policy</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-charcoal/50">
          Last updated {LAST_UPDATED}
        </p>

        <p className="mt-8 text-sm leading-relaxed text-charcoal/70">
          VALOREM sells solid fragrance at houseofvalorem.com. This page
          explains what we collect, why, and how to tell us to stop. We sell
          and ship within the United States only.
        </p>

        <Section heading="What we collect">
          <p>
            <strong className="font-medium text-charcoal">
              When you buy something.
            </strong>{" "}
            Your name, email, shipping address and order details. Checkout is
            hosted by Shopify, and payment is processed by Shopify&rsquo;s
            payment providers.
          </p>
          <p>
            <strong className="font-medium text-charcoal">
              When you contact us or join the list.
            </strong>{" "}
            Your email address, and whatever you write in a message to us.
          </p>
          <p>
            <strong className="font-medium text-charcoal">
              When you browse.
            </strong>{" "}
            Pages viewed, referring site, approximate location from your IP
            address, and device and browser type. On this site we also record
            how you interact with pages — clicks, scrolling and mouse movement
            — through Microsoft Clarity, described below.
          </p>
        </Section>

        <Section heading="What we never see">
          <p>
            <strong className="font-medium text-charcoal">
              Your card details.
            </strong>{" "}
            Payment information is entered on Shopify&rsquo;s checkout and
            handled by their payment processors. It never touches our servers
            and we cannot see it.
          </p>
        </Section>

        <Section heading="Cookies and tracking">
          <p>
            We use four tools. Two of them set cookies and follow behaviour;
            two do not.
          </p>
          <ul className="flex flex-col gap-4">
            <li>
              <strong className="font-medium text-charcoal">Meta Pixel</strong>{" "}
              — measures which ads lead to visits and purchases, and lets us
              show ads on Facebook and Instagram. It sets cookies and shares
              activity with Meta, including purchase events sent from our
              server through Meta&rsquo;s Conversions API. Purchase and checkout
              events are sent by Shopify.
            </li>
            <li>
              <strong className="font-medium text-charcoal">
                Microsoft Clarity
              </strong>{" "}
              — records how visitors use the site, as heatmaps and session
              replays, so we can find what is confusing or broken. It sets
              cookies.
            </li>
            <li>
              <strong className="font-medium text-charcoal">
                Vercel Analytics and Speed Insights
              </strong>{" "}
              — count page views and measure loading performance in aggregate.
              These are cookieless and do not identify you.
            </li>
          </ul>
        </Section>

        <Section heading="Who we share it with">
          <p>
            We do not sell your personal information for money. We share it
            only with the services that make the store work:
          </p>
          <ul className="ml-5 flex list-disc flex-col gap-2 marker:text-gold">
            <li>
              <strong className="font-medium text-charcoal">Shopify</strong> —
              checkout, payments, orders and customer records
            </li>
            <li>
              <strong className="font-medium text-charcoal">Meta</strong> —
              advertising and conversion measurement
            </li>
            <li>
              <strong className="font-medium text-charcoal">Microsoft</strong> —
              Clarity behaviour analytics
            </li>
            <li>
              <strong className="font-medium text-charcoal">Vercel</strong> —
              hosting and aggregate analytics
            </li>
            <li>
              <strong className="font-medium text-charcoal">Judge.me</strong> —
              product review requests and published reviews
            </li>
          </ul>
          <p>
            Sharing browsing activity with Meta for advertising may count as
            &ldquo;sharing&rdquo; or &ldquo;targeted advertising&rdquo; under
            some state privacy laws. You can opt out at any time using the
            methods below.
          </p>
        </Section>

        <Section heading="Your choices">
          <ul className="ml-5 flex list-disc flex-col gap-2 marker:text-gold">
            <li>
              <strong className="font-medium text-charcoal">
                Turn off ad tracking.
              </strong>{" "}
              Adjust what Meta may use in your{" "}
              <a
                href="https://accountscenter.facebook.com/ad_preferences"
                target="_blank"
                rel="noopener noreferrer"
                className={linkStyle}
              >
                Meta ad preferences
              </a>
              .
            </li>
            <li>
              <strong className="font-medium text-charcoal">
                Opt out of Clarity.
              </strong>{" "}
              Microsoft honours the{" "}
              <a
                href="https://privacy.microsoft.com/privacystatement"
                target="_blank"
                rel="noopener noreferrer"
                className={linkStyle}
              >
                choices in their privacy statement
              </a>
              , and browser Do Not Track settings.
            </li>
            <li>
              <strong className="font-medium text-charcoal">
                Block cookies.
              </strong>{" "}
              Every major browser can block or delete cookies. The store still
              works without them.
            </li>
            <li>
              <strong className="font-medium text-charcoal">
                Unsubscribe.
              </strong>{" "}
              Every marketing email has an unsubscribe link, and it works
              immediately.
            </li>
            <li>
              <strong className="font-medium text-charcoal">
                Ask us directly.
              </strong>{" "}
              Email us to see what we hold about you, correct it, delete it, or
              tell us not to share it for advertising. We will not treat you
              differently for asking.
            </li>
          </ul>
        </Section>

        <Section heading="How long we keep it">
          <p>
            Order records are kept as long as we need them for tax, accounting
            and returns — the return window is {RETURN_WINDOW} from delivery.
            Marketing contacts are kept until you unsubscribe or ask us to
            delete them.
          </p>
        </Section>

        <Section heading="Children">
          <p>
            This store is not intended for children under 13, and we do not
            knowingly collect their information. If you believe a child has
            given us information, email us and we will delete it.
          </p>
        </Section>

        <Section heading="Changes">
          <p>
            If this policy changes we will update the date at the top of this
            page. Material changes will be noted on the site.
          </p>
        </Section>

        <Section heading="Contact">
          <p>
            Questions, or a request about your data — write to us and a person
            will answer.
          </p>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkStyle}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-charcoal/55">
            See also our{" "}
            <Link href="/faq" className={linkStyle}>
              FAQ
            </Link>{" "}
            for shipping, sizing and returns.
          </p>
        </Section>
      </div>

      <div className="px-5 md:px-6">
        <HomeFooter />
      </div>
    </main>
  );
}
