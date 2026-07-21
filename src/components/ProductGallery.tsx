"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/lib/shopify";

/*
 * Product gallery. Photos and their order come from Shopify — image 1 is the
 * opening shot, and re-arranging them in the admin re-arranges this.
 *
 * One scroll-snapping track is the single source of truth for which image is
 * active: swiping moves it, tapping a thumbnail scrolls it, and the dots just
 * read it back. That avoids the usual carousel bug where a swipe and a
 * thumbnail tap disagree about the current slide.
 *
 * No layout shift: the track holds a fixed 4/5 aspect box whether or not the
 * images have loaded, and every slide is the same shape.
 */
export default function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  /* Derive the active slide from scroll position. The browser already caps
   * scroll events at one per frame, and the setState is a no-op while the
   * index is unchanged, so no extra throttling is needed — an rAF wrapper
   * here would only add a way for the dots to desync (rAF is frozen in
   * backgrounded tabs, scroll events are not). */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handler = () => {
      const index = Math.round(track.scrollLeft / track.clientWidth);
      setActive((prev) => (prev === index ? prev : index));
    };
    track.addEventListener("scroll", handler, { passive: true });
    return () => track.removeEventListener("scroll", handler);
  }, []);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    // Update immediately so the thumbnail highlight responds to the tap
    // rather than waiting for the smooth scroll to land.
    setActive(index);
  }, []);

  // No photos in Shopify yet — hold the exact same space the gallery will
  // occupy so the page doesn't jump once they're uploaded.
  if (images.length === 0) {
    return (
      <div
        className="aspect-[4/5] w-full bg-stone"
        role="img"
        aria-label={`${productName} — photography coming soon`}
      />
    );
  }

  const single = images.length === 1;

  return (
    <div className="w-full min-w-0">
      {/* Main / swipe track */}
      <div
        ref={trackRef}
        className={`no-scrollbar flex w-full min-w-0 snap-x snap-mandatory overscroll-x-contain ${
          single ? "overflow-x-hidden" : "overflow-x-auto"
        }`}
        aria-live="polite"
      >
        {images.map((image, i) => (
          <div
            key={image.url}
            className="relative aspect-[4/5] w-full shrink-0 snap-center bg-stone"
          >
            <Image
              src={image.url}
              alt={
                image.altText ??
                `${productName} solid fragrance — photo ${i + 1} of ${images.length}`
              }
              fill
              /* Full-bleed on phones, half the 1024px shell on desktop. */
              sizes="(max-width: 768px) 100vw, 512px"
              /* Only the opening shot is the LCP candidate; the rest load
               * lazily so a 5-photo gallery costs one image on first paint. */
              priority={i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {!single && (
        <>
          {/* Dots — mobile's position indicator. Hidden once thumbnails show. */}
          <div className="mt-4 flex justify-center gap-2 md:hidden">
            {images.map((image, i) => (
              <button
                key={image.url}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to photo ${i + 1}`}
                aria-current={i === active}
                /* 44px tap target around a 6px dot — the dot is the visual, the
                 * padding is the thumb target. */
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

          {/* Thumbnails — tap to switch. Scrollable on small screens so five
           * photos never squeeze the layout. */}
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1 md:mt-4">
            {images.map((image, i) => (
              <button
                key={image.url}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`View photo ${i + 1}`}
                aria-current={i === active}
                className={`relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-stone transition-opacity duration-200 sm:w-20 ${
                  i === active
                    ? "opacity-100 ring-1 ring-gold"
                    : "opacity-60 hover:opacity-90"
                }`}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
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
