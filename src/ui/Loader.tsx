"use client";

import { useEffect, useState } from "react";
import { startLoading } from "@/sequence/sequences";

/*
 * Byte-weighted preloader. Blocks scroll until the opening tier (T0, the
 * morph) is fetched, then fades out while T1 continues in the background.
 * The overflow lock is also what keeps AutoPlay from arming early — no
 * scroll is possible until the film can actually play.
 * Brand-calm: ivory field, gold rule, serif numerals.
 */
export function Loader() {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"loading" | "fading" | "done">("loading");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    let t0Done = false;

    const finish = () => {
      if (t0Done) return;
      t0Done = true;
      document.body.style.overflow = "";
      setPhase("fading");
      setTimeout(() => setPhase("done"), 700);
    };

    // Never trap the user: if the manifest is missing or the network hangs,
    // unlock anyway after a grace period.
    const failsafe = setTimeout(finish, 12000);

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
      <p className="mt-6 font-serif text-4xl tabular-nums text-charcoal">
        {pct}
      </p>
    </div>
  );
}
