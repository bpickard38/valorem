"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/lib/shopify";

/* Exactly five thumbnails per row, edge to edge — never a sliver of a sixth,
 * which reads as a rendering fault rather than an invitation to scroll.
 *
 * (100% − total gap) ÷ 5. gap-3 is 0.75rem and five thumbnails have four gaps
 * between them, hence 3rem. Written as a literal because Tailwind scans for
 * static class strings and cannot see a computed one. */
const THUMB_WIDTH = "w-[calc((100%-3rem)/5)]";

/* How long after the last scroll event we treat the carousel as settled and
 * teleport off a clone. Long enough to sit past momentum scrolling on iOS,
 * short enough that nobody sees the clone. */
const SETTLE_MS = 120;

/*
 * Product gallery. Photos and their order come from Shopify — image 1 is the
 * opening shot, and re-arranging them in the admin re-arranges this.
 *
 * The carousel loops. Swiping past the last photo continues into the first
 * and vice versa, with no rubber-banding at either end.
 *
 * How the loop works: the track renders [lastPhoto, ...photos, firstPhoto].
 * The two extras are clones. We open on the first real photo (index 1), and
 * once scrolling settles on a clone we reset scrollLeft to its real twin with
 * no animation. Because the clone and its twin are identical, the jump is
 * invisible — the shopper only sees a continuous strip.
 *
 * A native scroll-snap track does the actual movement, so momentum, rubber
 * band and accessibility all behave the way the platform intends, and one
 * scroll position stays the single source of truth for the dots and the
 * thumbnail highlight. They cannot disagree with the image on screen.
 *
 * No layout shift: every slide is a fixed 4/5 box whether or not its image
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

  // Index into `images`, never into the cloned slide list.
  const [active, setActive] = useState(0);

  const count = images.length;
  const loop = count > 1;

  /* The rendered slides. With a loop the real photos sit at 1..count, so a
   * real index maps to a slide index by adding one. */
  const slides = loop
    ? [images[count - 1], ...images, images[0]]
    : images;

  const slideIndexOf = useCallback(
    (real: number) => (loop ? real + 1 : real),
    [loop],
  );

  /* Open on the first real photo rather than the leading clone. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !loop) return;
    track.scrollLeft = track.clientWidth;
  }, [loop]);

  /* Track scroll → active index, plus the teleport that closes the loop. */
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

      /* Teleport only once motion stops. Doing it mid-gesture would fight
       * the finger; doing it during momentum would stop the scroll dead. */
      window.clearTimeout(settleRef.current);
      settleRef.current = window.setTimeout(() => {
        const settled = Math.round(track.scrollLeft / track.clientWidth);
        if (settled === 0) {
          // Landed on the leading clone of the last photo.
          track.scrollLeft = count * track.clientWidth;
        } else if (settled === count + 1) {
          // Landed on the trailing clone of the first photo.
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
   * them — without this the carousel lands between two photos after a device
   * rotation. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onResize = () => {
      track.scrollLeft = slideIndexOf(active) * track.clientWidth;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, slideIndexOf]);

  const goTo = useCallback(
    (real: number) => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollTo({
        left: slideIndexOf(real) * track.clientWidth,
        behavior: "smooth",
      });
      // Set immediately so the highlight answers the tap rather than waiting
      // for the smooth scroll to arrive.
      setActive(real);
    },
    [slideIndexOf],
  );

  /* Keep the active thumbnail fully on screen. Aligned flush to whichever
   * edge it ran past — never parked halfway, so the row always shows whole
   * thumbnails.
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

  return (
    <div className="w-full min-w-0">
      <div
        ref={trackRef}
        className={`no-scrollbar flex w-full min-w-0 snap-x snap-mandatory overscroll-x-contain ${
          loop ? "overflow-x-auto" : "overflow-x-hidden"
        }`}
        aria-live="polite"
      >
        {slides.map((image, i) => {
          // Map a slide back to the photo it shows, clones included.
          const real = loop ? (i - 1 + count) % count : i;
          return (
            <div
              key={`slide-${i}`}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-stone"
            >
              <Image
                src={image.url}
                alt={
                  image.altText ??
                  `${productName} solid fragrance — photo ${real + 1} of ${count}`
                }
                fill
                sizes="(max-width: 768px) 100vw, 512px"
                /* Only the opening photo is an LCP candidate. The clones and
                 * later slides load lazily, so a six-photo gallery still
                 * costs one image on first paint. */
                priority={i === slideIndexOf(0)}
                className="object-cover"
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

          {/* Thumbnails — exactly THUMBS_PER_ROW across, snapping so a scroll
           * always lands on whole ones. */}
          <div
            ref={stripRef}
            className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 md:mt-4"
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
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
