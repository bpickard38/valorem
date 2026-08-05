import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Playfair_Display, Montserrat, Inter } from "next/font/google";
import { SITE_URL } from "@/lib/seo";
import CartProvider from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import "./globals.css";

/* Brand fonts per the Canva logo lockup: Playfair Display for the VALOREM
 * wordmark and display type, Montserrat ExtraLight for engraved labels. */
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["200", "300"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  /* metadataBase is what resolves the relative canonical and OG urls every
   * route sets via toMetadata(); without it Next emits no canonical at all,
   * which is how this site had none. */
  metadataBase: new URL(SITE_URL),
  title: "Valorem Solid Fragrance",
  description:
    "A journey through the House of Valorem. Solid fragrance in a twist-up stick. Carried, not sprayed.",
  /* Declared rather than left for crawlers to infer from the OG image. */
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* The cart lives above every route so the drawer survives navigation
            between the collection and product pages. */}
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
        <Analytics />
        <SpeedInsights />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src="https://www.facebook.com/tr?id=1506577174000493&ev=PageView&noscript=1"
          />
        </noscript>
      </body>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1506577174000493');
fbq('track', 'PageView');
        `}
      </Script>
      {/* Microsoft Clarity (tag xoms7dfcdq) was REMOVED on 2026-08-03. It is
        * not paused or gated — the script is gone.
        *
        * Why: it was the worst value-to-risk trade on the site. Session replay
        * earns its keep by revealing patterns across many sessions, and at this
        * traffic there were not enough to find one. Against that it was the only
        * tracker recording what visitors physically did — mouse movement,
        * clicks, scrolling — and if its masking is not configured tightly, form
        * fields go with it, which on a store means email and address data.
        *
        * If it comes back, it comes back BEHIND A CONSENT GATE, and the privacy
        * policy has to be updated in the same commit — see the note at the top
        * of app/privacy/page.tsx. A tracker listed there but not loaded here,
        * or loaded here but not listed there, makes that page a false
        * statement.
        *
        * The Meta Pixel above stays: it is load-bearing for advertising, and it
        * is paired with the server-side Conversions API in /api/events. Vercel
        * Analytics and Speed Insights stay too and are cookieless. */}
    </html>
  );
}
