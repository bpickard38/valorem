import type { Metadata } from "next";
import Link from "next/link";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import { SectionHeader } from "@/components/ui";
import { CONTACT_EMAIL, LEGAL_ENTITY, RETURN_WINDOW } from "@/lib/site";
import { PRIVACY_SEO, toMetadata } from "@/lib/seo";

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

export const metadata: Metadata = toMetadata(PRIVACY_SEO);

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

        <div className="mt-8 flex flex-col gap-4 text-sm leading-relaxed text-charcoal/70">
          <p>
            {LEGAL_ENTITY} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;), trading as VALOREM, operates houseofvalorem.com
            (the &ldquo;Website&rdquo;). This policy explains what we collect
            when you visit or buy from the Website, why, who we share it with,
            and how to tell us to stop. We sell and ship within the United
            States only.
          </p>
          <p>
            &ldquo;Personal information&rdquo; means information that
            identifies, relates to, or describes you as an individual — your
            name, email address, shipping address, or details of what you
            bought. By using the Website you acknowledge the practices
            described here.
          </p>
        </div>

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
            Your email address, and whatever you write in a message to us. Our
            contact form is delivered by Web3Forms, which passes your message on
            to us by email.
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

        <Section heading="How we use it">
          <p>We use personal information to:</p>
          <ul className="ml-5 flex list-disc flex-col gap-2 marker:text-gold">
            <li>take payment, fulfil your order, and send you tracking</li>
            <li>
              handle returns and refunds within the {RETURN_WINDOW} window
            </li>
            <li>answer your messages and support requests</li>
            <li>
              send marketing email if you asked for it, and invite you to
              review something you bought
            </li>
            <li>
              measure which ads and pages lead to sales, and improve the
              Website using that information
            </li>
            <li>detect and prevent fraud and abuse</li>
            <li>
              meet our legal, tax and accounting obligations, and respond to
              lawful requests
            </li>
          </ul>
          <p>
            We do not use your information for automated decisions that produce
            legal effects, and we do not use it for anything unrelated to
            running this store.
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
            <li>
              <strong className="font-medium text-charcoal">Web3Forms</strong> —
              delivering messages sent through our contact form
            </li>
          </ul>
          <p>
            Each of these processes your information under its own privacy
            policy. Because Shopify handles checkout and payment, their terms
            matter most: see the{" "}
            <a
              href="https://www.shopify.com/legal/privacy/consumers"
              target="_blank"
              rel="noopener noreferrer"
              className={linkStyle}
            >
              Shopify Consumer Privacy Policy
            </a>{" "}
            and, depending on where you live, the{" "}
            <a
              href="https://privacy.shopify.com/en"
              target="_blank"
              rel="noopener noreferrer"
              className={linkStyle}
            >
              Shopify Privacy Portal
            </a>
            .
          </p>
          <p>
            Sharing browsing activity with Meta for advertising may count as
            &ldquo;sharing&rdquo; or &ldquo;targeted advertising&rdquo; under
            some state privacy laws. You can opt out at any time using the
            methods below.
          </p>
          <p>
            <strong className="font-medium text-charcoal">
              Legal requests.
            </strong>{" "}
            We may disclose personal information where we are required to by
            law — to comply with a subpoena, warrant, or other lawful request,
            to enforce our terms, or to protect the rights, property or safety
            of our customers or of {LEGAL_ENTITY}.
          </p>
          <p>
            <strong className="font-medium text-charcoal">
              If the business changes hands.
            </strong>{" "}
            If {LEGAL_ENTITY} is involved in a merger, acquisition, sale of
            assets, bankruptcy or similar transaction, personal information may
            be transferred as part of that business. We will tell you before
            your information becomes subject to a materially different privacy
            policy.
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
              Every major browser can block or delete them, and the store still
              works without them. Cookie settings are per browser, so you will
              need to do this on each browser and device you use:{" "}
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className={linkStyle}
              >
                Chrome
              </a>
              ,{" "}
              <a
                href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
                className={linkStyle}
              >
                Safari
              </a>
              ,{" "}
              <a
                href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
                target="_blank"
                rel="noopener noreferrer"
                className={linkStyle}
              >
                Firefox
              </a>
              ,{" "}
              <a
                href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                target="_blank"
                rel="noopener noreferrer"
                className={linkStyle}
              >
                Edge
              </a>
              .
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

        <Section heading="How we protect it">
          <p>
            The Website is served over HTTPS, and payment and order data is
            held by Shopify rather than by us — which means the most sensitive
            information you give us is protected by their security rather than
            depending on ours. We limit access to personal information to the
            people who need it to run the business.
          </p>
          <p>
            No method of transmitting information over the internet is
            completely secure, and we cannot guarantee absolute security. Please
            take care about what you include in a message to us, and in anything
            you publish publicly, such as a product review.
          </p>
        </Section>

        <Section heading="How long we keep it">
          <p>
            Order records are kept as long as we need them for tax, accounting
            and returns — the return window is {RETURN_WINDOW} from delivery.
            Marketing contacts are kept until you unsubscribe or ask us to
            delete them.
          </p>
        </Section>

        <Section heading="Links to other sites">
          <p>
            The Website links to places we do not control — our Instagram,
            Facebook and TikTok pages, Shopify&rsquo;s checkout, and the opt-out
            pages listed above. Those sites have their own privacy policies, and
            we are not responsible for their content or their practices. This
            policy covers only houseofvalorem.com.
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
            will answer. {LEGAL_ENTITY}, trading as VALOREM.
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
