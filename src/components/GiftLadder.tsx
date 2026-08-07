import Image from "next/image";
import { CURRENCY, formatMoney } from "@/lib/site";
import type { GiftArtKey, GiftRung } from "@/lib/site";

/*
 * The gift ladder — three gifts as cards, locked until the size unlocks them.
 *
 * It sits directly under the size selector and above the button, which is the
 * whole point: the reason to take the 30 ml over the 5 ml is not the wax, it is
 * this row, and a shopper who has to scroll to find that out has already
 * decided.
 *
 * WHY CARDS AND NOT A CHECKLIST. It was a vertical tick list first, and the
 * list had a flaw the card grid does not: a gift you cannot picture is a line
 * of text competing with other lines of text. A padlocked tile reads as
 * something being withheld — the shopper sees the shape of what they are not
 * getting. Three cards also fit above the fold where three rows plus a heading
 * did not.
 *
 * WHY A PADLOCK AND NOT A CROSS. A cross means "no". A padlock means "not
 * yet, and here is how" — which is the actual state, and the only one that
 * makes an unlit card persuasive rather than discouraging.
 *
 * WHAT KEEPS THE VALUES HONEST. Each card shows what its gift would cost, and
 * the figures come from the live Shopify sample price and the real flat
 * shipping rate — prices this site charges today, one of them three inches up
 * this same page. That is what makes a struck-through number here legitimate
 * where an invented "was" price would not be; see the note in site.ts, and
 * PRICE_BADGE for the case this is deliberately NOT. The values sum, which is
 * why the third card is the SECOND sample rather than a restatement of the
 * pair — that counting bug is documented on giftLadder.
 *
 * NOTHING HERE IS A CART LINE. These are fulfilment promises packed by hand —
 * see the note on SIZES — so the wording stays "free", never "added to your
 * bag", which would promise a line the cart drawer is never going to show.
 *
 * A11y: lock state is in each card's own text, never in colour or a padlock
 * glyph alone. The grid is aria-live so a shopper arrowing through the sizes
 * hears what just unlocked; the heading sits outside that region, because a
 * fixed string re-announced on every change is noise.
 */
export default function GiftLadder({
  rungs,
  className = "",
}: {
  rungs: GiftRung[];
  className?: string;
}) {
  if (rungs.length === 0) return null;

  return (
    <section
      className={`border border-charcoal/25 bg-stone/50 px-4 pb-4 pt-3.5 ${className}`}
    >
      <p id="gift-ladder-label" className="label-engraved text-charcoal/55">
        Free gifts with this size
      </p>
      <ul
        aria-live="polite"
        aria-labelledby="gift-ladder-label"
        /* Three across at every width. The cards are square and the captions
           are short, so they hold together at 375px; stacking them would put
           the button below the fold, which is the one thing this block exists
           to avoid. */
        className="mt-3.5 grid grid-cols-3 gap-2.5"
      >
        {rungs.map((rung) => (
          <li key={rung.key} className="min-w-0">
            <div
              className={`relative aspect-square overflow-hidden border transition-colors duration-200 ${
                rung.unlocked
                  ? "border-green-deep/50 bg-green/[0.14]"
                  : "border-charcoal/15 bg-stone-deep/40"
              }`}
            >
              {/* The gift itself. A photograph when GIFT_IMAGES has one, drawn
                  line art otherwise — same null-means-placeholder contract the
                  collection cards use.
                  FIT COMES FROM THE ASSET, never from this component: a cutout
                  is letterboxed with padding so the card's own green shows
                  around the product, an opaque photo bleeds. See GIFT_IMAGES
                  for why treating them alike breaks one or the other.
                  Locked art is desaturated AND dimmed — greyscale alone still
                  reads as available on a palette this warm. */}
              <div
                className={`flex h-full w-full items-center justify-center transition-all duration-200 ${
                  rung.unlocked
                    ? "text-gold-deep"
                    : "text-charcoal/30 grayscale"
                }`}
              >
                {rung.image ? (
                  <Image
                    src={rung.image.src}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 130px, 33vw"
                    className={`${
                      rung.image.cutout
                        ? "object-contain p-[8%]"
                        : "object-cover"
                    } ${rung.unlocked ? "" : "opacity-45"}`}
                  />
                ) : (
                  <GiftArt art={rung.art} />
                )}
              </div>

              {/* The padlock, over a scrim so it stays legible on top of a
                  photograph as well as on line art. */}
              {!rung.unlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone/45">
                  <Lock />
                </div>
              )}

              {/* Value ribbon. "FREE" beside the struck-through real price. */}
              {rung.value !== null && (
                <span
                  className={`absolute inset-x-0 top-0 flex items-center justify-center gap-1 px-1 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] ${
                    rung.unlocked
                      ? "bg-green-deep text-ivory"
                      : "bg-charcoal/45 text-ivory"
                  }`}
                >
                  Free
                  <s className="opacity-70">
                    {formatMoney(rung.value, CURRENCY)}
                  </s>
                </span>
              )}
            </div>

            <p
              className={`mt-2 text-center text-[0.7rem] leading-snug ${
                rung.unlocked
                  ? "font-medium text-charcoal"
                  : "text-charcoal/45"
              }`}
            >
              {rung.label}
            </p>
            {/* The state, for a screen reader only — sighted users get it from
                the padlock and the fill. */}
            <span className="sr-only">
              {rung.unlocked
                ? "Included with this size."
                : "Locked. Choose a larger size to unlock."}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Lock() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-7 w-7 text-charcoal/55"
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="1.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      <circle cx="12" cy="15.5" r="1.2" />
    </svg>
  );
}

/* Placeholder artwork, in the same stroke language as the spec row — one <svg>
 * shell so weight and box size cannot drift between the three. Replaced per
 * card the moment a real photograph lands in GIFT_IMAGES. */
function GiftArt({ art }: { art: GiftArtKey }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[55%] w-[55%]"
    >
      {ART[art]}
    </svg>
  );
}

const ART: Record<GiftArtKey, React.ReactNode> = {
  /* A parcel, corner-on. */
  shipping: (
    <>
      <path d="M24 6 41 14v20L24 42 7 34V14Z" />
      <path d="M7 14l17 8 17-8" />
      <path d="M24 22v20" />
      <path d="M15.5 10.2 32.5 18.2v6" />
    </>
  ),
  /* One tin, twisted up. */
  sample: (
    <>
      <rect x="17" y="17" width="14" height="24" rx="2" />
      <path d="M20 17v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" />
      <path d="M17 23h14" />
    </>
  ),
  /* Two tins — the card that takes the pair to its full count. */
  "sample-extra": (
    <>
      <rect x="7" y="19" width="13" height="22" rx="2" />
      <path d="M10 19v-5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v5" />
      <path d="M7 25h13" />
      <rect x="27" y="19" width="13" height="22" rx="2" />
      <path d="M30 19v-5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v5" />
      <path d="M27 25h13" />
    </>
  ),
};
