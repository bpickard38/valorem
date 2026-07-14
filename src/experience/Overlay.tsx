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

      {/* MORPH settle — crisp vector lockup */}
      <div
        data-logo-lockup
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center opacity-0"
      >
        <p className="type-display text-charcoal">VALOREM</p>
        <div className="mx-auto mt-4 h-px w-12 bg-gold/80" />
        <p className="label-engraved mt-4 text-charcoal/55">Solid Fragrance</p>
      </div>

      {/* DESCENT */}
      <div
        data-copy="descent"
        className="absolute inset-x-0 top-[14%] text-center opacity-0"
      >
        <p className="label-engraved text-ivory/85 [text-shadow:0_1px_12px_rgba(26,25,23,.35)]">
          The House
        </p>
      </div>

      {/* DOORS */}
      <div
        data-copy="doors"
        className="absolute inset-x-0 top-[12%] text-center opacity-0"
      >
        <p className="label-engraved text-ivory/85 [text-shadow:0_1px_12px_rgba(26,25,23,.5)]">
          Collection № 1 — The Pantheon
        </p>
      </div>

      {/* SANCTUM */}
      <div
        data-copy="sanctum"
        className="absolute inset-x-0 bottom-12 text-center opacity-0"
      >
        <p className="label-engraved text-ivory/90 [text-shadow:0_1px_12px_rgba(26,25,23,.5)]">
          Choose your deity
        </p>
      </div>
    </div>
  );
}
