"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  experienceStore,
  closeReveal,
  beginNavigate,
  type ExperienceState,
  type RevealScent,
} from "@/experience/state";
import { PRICE, SCENTS } from "@/lib/site";

/*
 * The revealed product card: appears when the particle morph settles, offers
 * the way through to the product page (the "terminal" of the experience).
 * Escape or ✕ reverses to idle statues; scrolling away also closes it
 * (handled by the phase guard below).
 */

const WAX: Record<RevealScent, string> = {
  aphrodite: "linear-gradient(135deg,#e8c4c9 0%,#d8a7ae 55%,#c48f97 100%)",
  poseidon: "linear-gradient(135deg,#c3d9e4 0%,#9fbfd0 55%,#7ea3b8 100%)",
};

export function ProductReveal() {
  const router = useRouter();
  const [state, setState] = useState<ExperienceState["sanctum"]>({
    status: "idle",
  });

  useEffect(() => {
    const unsub = experienceStore.subscribe((s, prev) => {
      if (s.sanctum !== prev.sanctum) setState(s.sanctum);
      // Scrolling back out of the sanctum closes the reveal.
      if (
        s.phase !== "sanctum" &&
        (s.sanctum.status === "revealed" || s.sanctum.status === "revealing")
      ) {
        closeReveal();
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (state.status === "idle") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeReveal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.status]);

  const scent = state.scent;
  const visible = state.status === "revealed" || state.status === "navigating";
  if (!scent || (!visible && state.status !== "revealing")) return null;
  const s = SCENTS[scent];

  const enter = () => {
    beginNavigate();
    sessionStorage.setItem("from-sanctum", scent);
    // Ivory wash, then route — the product page opens on the same capsule.
    setTimeout(() => router.push(`/product/${scent}`), 650);
  };

  return (
    <>
      {/* soft scrim dims the statue region while dust flies */}
      <div
        className={`pointer-events-none fixed inset-0 z-20 bg-charcoal/35 transition-opacity duration-700 ${
          state.status === "idle" ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden="true"
      />

      {/* ivory wash for the terminal transition */}
      <div
        className={`pointer-events-none fixed inset-0 z-[45] bg-ivory transition-opacity duration-700 ${
          state.status === "navigating" ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-label={`${s.name} revealed`}
        className={`fixed inset-0 z-[35] flex flex-col items-center justify-center px-6 text-center transition-opacity duration-700 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={closeReveal}
          aria-label="Close and return to the statues"
          className="absolute right-6 top-6 p-3 text-2xl leading-none text-ivory/80 transition-colors hover:text-gold"
        >
          ×
        </button>

        {/* capsule render — lands where the particles settle */}
        <div
          data-capsule={scent}
          className="relative h-56 w-16"
          aria-hidden="true"
        >
          <div
            className="absolute inset-x-1 top-0 h-16 rounded-t-full"
            style={{ background: WAX[scent] }}
          />
          <div className="absolute inset-x-0 top-14 bottom-8 bg-gradient-to-r from-[#232120] via-[#3c3835] to-[#1c1a18]" />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-r from-[#8a6f2f] via-[#c9a54b] to-[#7d6529]" />
        </div>

        <p className="label-engraved mt-10 text-ivory/80 [text-shadow:0_1px_10px_rgba(26,25,23,.6)]">
          Collection № 1
        </p>
        <h2 className="type-heading mt-3 text-ivory [text-shadow:0_1px_16px_rgba(26,25,23,.7)]">
          {s.name}
        </h2>
        <p className="label-engraved mt-4 text-ivory/70 [text-shadow:0_1px_10px_rgba(26,25,23,.6)]">
          {s.notes.join("  ·  ")}
        </p>

        <button
          type="button"
          onClick={enter}
          className="group relative mt-10 inline-block overflow-hidden bg-gold px-10 py-4 text-xs font-medium uppercase tracking-[0.25em] text-ivory transition-colors duration-300 active:translate-y-px"
        >
          <span className="absolute inset-0 origin-left scale-x-0 bg-gold-deep transition-transform duration-300 ease-out group-hover:scale-x-100" />
          <span className="relative z-10">
            Enter the House — {PRICE}
          </span>
        </button>
      </div>
    </>
  );
}
