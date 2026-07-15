"use client";

/*
 * DOM copy layer. Elements are tweened by ScrollRig at timeline labels via
 * their data attributes — this component only renders them (hidden states are
 * set by GSAP autoAlpha). pointer-events stay off except interactive children.
 */
export function Overlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {/* HERO */}
      <div
        data-copy="hero"
        className="absolute inset-x-0 top-[16%] mx-auto max-w-2xl px-6 text-center"
      >
        <p className="label-engraved text-charcoal/60">Valorem</p>
        <h1 className="type-display mt-6 text-charcoal">
          Fragrance, in its most permanent form.
        </h1>
        <p className="mt-5 text-sm tracking-wide text-charcoal/65">
          Carried, not sprayed.
        </p>
      </div>

      {/* Scroll hint */}
      <div
        data-copy="hero"
        className="absolute inset-x-0 bottom-10 text-center"
      >
        <span className="label-engraved text-charcoal/45">Scroll</span>
      </div>

      {/* MORPH settle → dock. The pegasus MARK matches the film silhouette's
          size at settle (wordmark hidden); as the whole thing shrinks toward
          the top dock, VALOREM + subline fade in beneath it and ride down.
          GSAP owns the transform (centering + y/scale); the wordmark is
          out of flow so it never shifts the mark off-center. */}
      <div
        data-logo-dock
        className="absolute left-1/2 top-1/2 opacity-0 will-change-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- animated, scaled element; next/image adds nothing here */}
        {/* Sized so the horse INSIDE the png (≈93% of its height) matches the
            film silhouette's on-screen height (~full viewport). */}
        <img
          data-logo-mark
          src="/brand/pegasus-mark.png"
          alt=""
          draggable={false}
          className="block h-[104vh] w-auto max-w-[104vw] select-none object-contain"
        />
        <div
          data-logo-word
          className="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap text-center opacity-0"
        >
          <p className="type-display leading-none text-charcoal">VALOREM</p>
          <div className="mx-auto mt-3 h-px w-12 bg-gold/80" />
          <p className="label-engraved mt-3 text-charcoal/55">
            Solid Fragrance
          </p>
        </div>
      </div>

      {/* VOYAGE — sits below the docked brand header */}
      <div
        data-copy="voyage"
        className="absolute inset-x-0 top-[26%] text-center opacity-0"
      >
        <p className="label-engraved text-ivory/85 [text-shadow:0_1px_12px_rgba(26,25,23,.35)]">
          The House
        </p>
      </div>

      {/* COLLECTION — as the doors pass, before the sanctum finale */}
      <div
        data-copy="collection"
        className="absolute inset-x-0 top-[26%] text-center opacity-0"
      >
        <p className="label-engraved text-ivory/85 [text-shadow:0_1px_12px_rgba(26,25,23,.5)]">
          Collection № 1 — The Pantheon
        </p>
      </div>
    </div>
  );
}
