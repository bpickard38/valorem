"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/lib/shopify";
import { useSelectedSize } from "@/components/SelectedSizeProvider";
import { SIZE_IMAGE_INDEX, galleryImageMode } from "@/lib/site";

/* Exactly five thumbnails per row, edge to edge — never a sliver of a sixth,
 * which reads as a rendering fault rather than an invitation to scroll.
 *
 * (100% − total gap) ÷ 5. gap-3 is 0.75rem and five thumbnails have four gaps
 * between them, hence 3rem. Written as a literal because Tailwind scans for
 * static class strings and cannot see a computed one. */
const THUMB_WIDTH = "w-[calc((100%-3rem)/5)]";

/* How long after the last scroll event the phone carousel counts as settled
 * and teleports off a clone. Long enough to sit past iOS momentum, short
 * enough that nobody sees the clone. */
const SETTLE_MS = 120;

/*
 * Product gallery. Photos and their order come from Shopify, and the size
 * selector drives which one is showing — see SIZE_IMAGE_INDEX.
 *
 * Two presentations of one state, because phones and desktops want different
 * things and one mechanism cannot do both well:
 *
 *   Phone   — a native scroll-snap track, so swiping has real momentum and
 *             rubber-band. Loops by cloning the first and last photos and
 *             teleporting off the clone once scrolling settles.
 *   Desktop — one photo at full width with the thumbnail strip underneath as
 *             the picker.
 *
 * THE DESKTOP VIEW WAS A THREE-UP RING until 2026-08-07: the active photo
 * centred at 62% width with its two neighbours peeking out either side, dimmed
 * and scaled down, clicking one to rotate it in. It was replaced because the
 * ring spends nearly 40% of the column showing two photos you are not looking
 * at, and the one you ARE looking at is the one being sold — the cost fell
 * entirely on the product shot. It also had no way to jump: reaching photo 5
 * from photo 1 meant three separate rotations, where a strip of thumbnails is
 * one click to anything. And now that the first three photos are the same tin
 * in three sizes, two dimmed near-identical neighbours read as a rendering
 * fault rather than as a carousel.
 *
 * Both presentations read and write the same `active` index, so the dots, the
 * thumbnails and whatever is on screen can never disagree.
 *
 * No layout shift: every frame is a fixed aspect box whether or not its image
 * has loaded.
 */
export default function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const settleRef = useRef<number | undefined>(undefined);

  const count = images.length;
  const loop = count > 1;

  /* The size the buy block currently has selected, when this gallery is inside
   * a SelectedSizeProvider. Null on any page that renders the gallery on its
   * own, in which case none of the sync below does anything. */
  const sizeSync = useSelectedSize();

  /* Which photo shows a given size. Out-of-range indexes are dropped rather
   * than clamped: a product with two photos should leave the gallery alone when
   * the 5 ml is picked, not swap to whatever happens to be last. */
  const imageForSize = useCallback(
    (size: string | undefined): number | null => {
      if (!size) return null;
      const index = SIZE_IMAGE_INDEX[size as keyof typeof SIZE_IMAGE_INDEX];
      return index !== undefined && index < count ? index : null;
    },
    [count],
  );

  /* The index the gallery opens on, resolved once. The phone track positions
   * itself in track-widths on mount and has to land on the photo of the size
   * that opens selected — not on photo 1, which is only the same thing while
   * the 30 ml is in stock. Held in state rather than a ref so it can be read
   * during render (it decides which image gets `priority`). */
  const [openedOn] = useState(() => imageForSize(sizeSync?.selected) ?? 0);

  // Index into `images`, never into the cloned slide list.
  const [active, setActive] = useState(openedOn);

  /* Phone slides. The real photos sit at 1..count, so a real index maps to a
   * slide index by adding one. */
  const slides = loop ? [images[count - 1], ...images, images[0]] : images;
  const slideIndexOf = useCallback(
    (real: number) => (loop ? real + 1 : real),
    [loop],
  );

  /* Open on the photo of the selected size rather than on the leading clone —
   * `openedOn + 1` is that photo's slide index once the clones are counted. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !loop) return;
    track.scrollLeft = (openedOn + 1) * track.clientWidth;
  }, [loop, openedOn]);

  /* Phone track scroll → active index, plus the teleport that closes the loop.
   * On desktop the track is display:none, so clientWidth is 0 and this bails
   * out before doing anything. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const width = track.clientWidth;
      if (!width) return;

      const slide = Math.round(track.scrollLeft / width);
      const real = loop ? (slide - 1 + count) % count : slide;
      setActive((prev) => (prev === real ? prev : real));

      if (!loop) return;

      /* Teleport only once motion stops. Doing it mid-gesture would fight the
       * finger; doing it during momentum would stop the scroll dead. */
      window.clearTimeout(settleRef.current);
      settleRef.current = window.setTimeout(() => {
        if (!track.clientWidth) return;
        const settled = Math.round(track.scrollLeft / track.clientWidth);
        if (settled === 0) {
          track.scrollLeft = count * track.clientWidth;
        } else if (settled === count + 1) {
          track.scrollLeft = track.clientWidth;
        }
      }, SETTLE_MS);
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.clearTimeout(settleRef.current);
    };
  }, [loop, count]);

  /* Slide positions are measured in track widths, so a resize invalidates
   * them — without this the phone carousel lands between two photos after a
   * rotation, and crossing the md breakpoint leaves it mid-slide. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onResize = () => {
      if (!track.clientWidth) return;
      track.scrollLeft = slideIndexOf(active) * track.clientWidth;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, slideIndexOf]);

  const goTo = useCallback(
    (real: number) => {
      setActive(real);
      const track = trackRef.current;
      // Zero width means the phone track is hidden — desktop needs no scroll,
      // the ring is driven by `active` alone.
      if (!track || !track.clientWidth) return;
      track.scrollTo({
        left: slideIndexOf(real) * track.clientWidth,
        behavior: "smooth",
      });
    },
    [slideIndexOf],
  );

  /* Picking a size brings that size's tin to the front — on both presentations
   * at once, since goTo drives the phone track and the desktop ring off the
   * same `active`. The thumbnail strip follows through the effect below, which
   * already scrolls whatever is active into view, so there is nothing extra to
   * do for it here.
   *
   * Subscribed to the SELECTION EVENT, not to the selected value: see the long
   * note in SelectedSizeProvider. The effect only registers the listener, so it
   * runs once — the gallery moves inside the shopper's click, and a later
   * re-render cannot re-run it and undo a swipe. */
  const subscribe = sizeSync?.subscribe;
  useEffect(() => {
    if (!subscribe) return;
    return subscribe((size) => {
      const index = imageForSize(size);
      if (index === null) return;
      goTo(index);
    });
  }, [subscribe, imageForSize, goTo]);

  /* Keep the active thumbnail fully on screen, flush to whichever edge it ran
   * past — never parked halfway, so the row always shows whole thumbnails.
   *
   * Measured with getBoundingClientRect, not offsetLeft: the strip is not a
   * positioned element, so the thumbnails' offsetParent is the page body and
   * offsetLeft would carry the page padding with it. */
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !thumb) return;

    const stripRect = strip.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const left = strip.scrollLeft + (thumbRect.left - stripRect.left);
    const right = left + thumbRect.width;

    if (left < strip.scrollLeft) {
      strip.scrollTo({ left, behavior: "smooth" });
    } else if (right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: right - strip.clientWidth, behavior: "smooth" });
    }
  }, [active]);

  // No photos in Shopify yet — hold the exact space the gallery will occupy
  // so the page doesn't jump once they're uploaded.
  if (count === 0) {
    return (
      <div
        className="aspect-[4/5] w-full bg-stone"
        role="img"
        aria-label={`${productName} — photography coming soon`}
      />
    );
  }

  const altFor = (image: ProductImage, real: number) =>
    image.altText ??
    `${productName} solid fragrance — photo ${real + 1} of ${count}`;

  return (
    <div className="w-full min-w-0">
      {/* ---------- PHONE: swipe track ---------- */}
      <div
        ref={trackRef}
        className={`no-scrollbar flex w-full min-w-0 snap-x snap-mandatory overscroll-x-contain md:hidden ${
          loop ? "overflow-x-auto" : "overflow-x-hidden"
        }`}
        aria-live="polite"
      >
        {slides.map((image, i) => {
          const real = loop ? (i - 1 + count) % count : i;
          const mode = galleryImageMode(real);
          return (
            <div
              key={`slide-${i}`}
              className={`relative aspect-[4/5] w-full shrink-0 snap-center bg-stone ${mode.frame}`}
            >
              <Image
                src={image.url}
                alt={altFor(image, real)}
                fill
                sizes="100vw"
                priority={i === slideIndexOf(openedOn)}
                className={mode.image}
              />
            </div>
          );
        })}
      </div>

      {/* ---------- DESKTOP: one photo, picked from the strip below ----------
          Every photo is rendered and cross-faded on opacity rather than
          swapping one <img> src. Two reasons: the switch is instant because
          the next photo is already decoded, and a src swap would flash the
          empty stone frame between the old image unloading and the new one
          painting — which, on a control the size selector drives, reads as the
          page breaking rather than as a photo changing. */}
      <div className="relative hidden aspect-[4/5] w-full bg-stone md:block">
        {images.map((image, i) => {
          const isActive = i === active;
          return (
            <div
              key={image.url}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-300 ease-out ${
                galleryImageMode(i).frame
              } ${isActive ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={image.url}
                alt={isActive ? altFor(image, i) : ""}
                fill
                /* Half the 1024px content column, less the gap. */
                sizes="(min-width: 768px) 480px, 100vw"
                priority={i === openedOn}
                className={galleryImageMode(i).image}
              />
            </div>
          );
        })}
      </div>

      {loop && (
        <>
          {/* Dots — the position indicator on a phone. */}
          <div className="mt-4 flex justify-center gap-2 md:hidden">
            {images.map((image, i) => (
              <button
                key={image.url}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to photo ${i + 1}`}
                aria-current={i === active}
                /* 44px tap target around a 6px dot — the dot is the visual,
                 * the padding is the thumb target. */
                className="flex h-11 w-6 items-center justify-center"
              >
                <span
                  className={`block h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
                    i === active ? "bg-gold" : "bg-charcoal/25"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Thumbnails — exactly five across, snapping so a scroll always
           * lands on whole ones.
           *
           * Shown at EVERY width since 2026-08-07. On a phone it supplements
           * the swipe track; on desktop it is the only way to change photo, so
           * it is the picker the ring used to be. One click reaches any photo,
           * which the ring's rotate-a-step-at-a-time never could. */}
          <div
            ref={stripRef}
            className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
          >
            {images.map((image, i) => (
              <button
                key={image.url}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`View photo ${i + 1}`}
                aria-current={i === active}
                className={`relative aspect-[4/5] ${THUMB_WIDTH} shrink-0 snap-start overflow-hidden bg-stone transition-opacity duration-200 ${
                  i === active
                    ? "opacity-100 ring-1 ring-gold"
                    : "opacity-60 hover:opacity-90"
                }`}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="20vw"
                  className={galleryImageMode(i).thumb}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
