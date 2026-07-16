"use client";

import { useEffect, useState } from "react";
import { startLoading } from "@/sequence/sequences";
import { experienceStore } from "@/experience/state";

/*
 * Byte-weighted preloader. Blocks scroll until EVERYTHING is playable — both
 * sequence tiers and the finale video — then fades out. Dismissal flips the
 * store's `loaded` flag (the "film is watchable" signal, e.g. for the
 * return-from-checkout jump in Finale).
 * Brand-calm: ivory field, gold rule + progress bar, serif numerals.
 */
export function Loader() {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"loading" | "fading" | "done">("loading");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      document.body.style.overflow = "";
      // The film must open on frame one.
      window.scrollTo(0, 0);
      experienceStore.setState({ loaded: true });
      setPhase("fading");
      setTimeout(() => setPhase("done"), 700);
    };

    // Never trap the user: if the network hangs, unlock anyway after a grace
    // period (the full gate is ~15 MB — allow slow connections to make it).
    const failsafe = setTimeout(finish, 25000);

    void startLoading((fraction) => {
      setPct(Math.round(fraction * 100));
      if (fraction >= 1) finish();
    }).then(finish);

    return () => clearTimeout(failsafe);
  }, []);

  if (phase === "done") return null;
  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-ivory transition-opacity duration-700 ${
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden={phase === "fading"}
    >
      <p className="label-engraved text-charcoal/60">Valorem</p>
      <div className="mt-5 h-px w-10 bg-gold/70" />
      <div className="mt-6 h-px w-44 overflow-hidden bg-charcoal/15">
        <div
          className="h-full origin-left bg-gold transition-transform duration-200 ease-out"
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
      <p className="mt-5 font-serif text-4xl tabular-nums text-charcoal">
        {pct}
      </p>
    </div>
  );
}
