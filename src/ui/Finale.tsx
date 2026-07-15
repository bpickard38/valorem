"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import {
  experienceStore,
  startFinale,
  finaleEnded,
  resetFinale,
  beginNavigate,
  type FinaleStatus,
} from "@/experience/state";
import {
  FINALE_FRAME_FALLBACK,
  finalePointToScreen,
  tinScreenRect,
  TINS,
} from "@/experience/finaleConfig";
import type { ScentId } from "@/lib/shopify";
import { PRICE, SCENTS } from "@/lib/site";
import PreorderButton from "@/components/PreorderButton";

/*
 * The sanctum finale. When the scrub settles on the statues, a real <video>
 * (statues → product tins) crossfades over the held film frame and plays
 * once, unprompted — no more scrolling. Its final frame holds the two tins;
 * a DOM overlay then offers {PRICE} + Order per tin, and clicking a tin
 * routes to its product page. Scrolling back out of the sanctum rewinds
 * everything to the scrub film.
 */

const SRC = "/fx/statues-to-product-v1.mp4";
/** Don't arm until slightly into the sanctum — hysteresis against boundary
 *  jitter (reset fires the moment the phase is left). */
const ARM_AT = 0.15;

const SCENT_IDS: ScentId[] = ["poseidon", "aphrodite"];

export function Finale() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const hits = useRef(new Map<ScentId, HTMLButtonElement>());
  const captions = useRef(new Map<ScentId, HTMLDivElement>());
  const [status, setStatus] = useState<FinaleStatus>("idle");

  // Store subscription: preload gate, arm/reset triggers, status mirror.
  useEffect(() => {
    let preloaded = false;
    const unsub = experienceStore.subscribe((s, prev) => {
      if (s.finale !== prev.finale) setStatus(s.finale.status);

      const v = video.current;
      if (!v) return;

      // Fetch the finale only after the voyage sequence tier is down — it
      // must never compete with the film for first-load bandwidth.
      if (!preloaded && (s.tier >= 1 || s.phase === "voyage")) {
        preloaded = true;
        v.preload = "auto";
        v.load();
      }

      if (
        s.phase === "sanctum" &&
        s.phaseProgress >= ARM_AT &&
        s.finale.status === "idle"
      ) {
        startFinale();
      } else if (
        s.phase !== "sanctum" &&
        (s.finale.status === "playing" || s.finale.status === "ended")
      ) {
        resetFinale();
      }
    });
    return unsub;
  }, []);

  // Drive the <video> from the state machine.
  useEffect(() => {
    const v = video.current;
    if (!v) return;

    if (status === "playing") {
      v.currentTime = 0;
      const reveal = () =>
        gsap.to(v, { autoAlpha: 1, duration: 0.6, ease: "power2.out" });
      v.addEventListener("playing", reveal, { once: true });

      const tryPlay = () => void v.play().catch(() => {});
      tryPlay();
      window.addEventListener("pointerdown", tryPlay, { once: true });

      // If playback never starts (iOS Low-Power etc.), don't strand the
      // user — surface the shop overlay over the held statue frame.
      const stallGuard = setTimeout(() => {
        if (v.paused && experienceStore.getState().finale.status === "playing") {
          reveal();
          v.currentTime = v.duration || 0;
          finaleEnded();
        }
      }, 2500);

      return () => {
        clearTimeout(stallGuard);
        v.removeEventListener("playing", reveal);
        window.removeEventListener("pointerdown", tryPlay);
      };
    }

    if (status === "idle") {
      gsap.to(v, {
        autoAlpha: 0,
        duration: 0.3,
        onComplete: () => {
          v.pause();
          v.currentTime = 0;
        },
      });
    }
  }, [status]);

  // Keep hit-areas + captions glued to the tins under the cover crop.
  const shopping = status === "ended" || status === "navigating";
  useEffect(() => {
    if (!shopping) return;
    const tick = () => {
      const v = video.current;
      const fw = v?.videoWidth || FINALE_FRAME_FALLBACK.w;
      const fh = v?.videoHeight || FINALE_FRAME_FALLBACK.h;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      for (const id of SCENT_IDS) {
        const r = tinScreenRect(id, fw, fh, vw, vh);
        const hit = hits.current.get(id);
        if (hit) {
          hit.style.left = `${r.x}px`;
          hit.style.top = `${r.y}px`;
          hit.style.width = `${Math.max(44, r.w)}px`;
          hit.style.height = `${Math.max(44, r.h)}px`;
        }
        const cap = captions.current.get(id);
        if (cap) {
          // Caption floats in the clear zone above the tin's wax dome.
          const a = finalePointToScreen(TINS[id].cx, 0.07, fw, fh, vw, vh);
          cap.style.left = `${a.x}px`;
          cap.style.top = `${Math.max(16, a.y)}px`;
        }
      }
    };
    tick();
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [shopping]);

  const enter = (scent: ScentId) => {
    beginNavigate(scent);
    sessionStorage.setItem("from-sanctum", scent);
    // Ivory wash, then route — the product page opens on the same tin.
    setTimeout(() => router.push(`/product/${scent}`), 650);
  };

  return (
    <>
      {/* The finale film — above the scrub canvas (z-5), below the WebGL
          grain pass (z-10) so it stays color-graded with the rest. */}
      <video
        ref={video}
        src={SRC}
        muted
        playsInline
        preload="none"
        className="pointer-events-none fixed inset-0 z-[8] h-full w-full object-cover opacity-0"
        aria-hidden={!shopping}
        onEnded={finaleEnded}
      />

      {/* ivory wash for the terminal transition */}
      <div
        className={`pointer-events-none fixed inset-0 z-[45] bg-ivory transition-opacity duration-700 ${
          status === "navigating" ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Shop overlay — price + order per tin, tins clickable. */}
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-700 ${
          shopping ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!shopping}
      >
        {SCENT_IDS.map((id) => {
          const s = SCENTS[id];
          return (
            <div key={id}>
              {/* full-tin hit area → product page */}
              <button
                ref={(el) => {
                  if (el) hits.current.set(id, el);
                }}
                type="button"
                tabIndex={shopping ? 0 : -1}
                aria-label={`View ${s.name} — ${s.notes.join(", ")}`}
                onClick={() => enter(id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                style={{ pointerEvents: shopping ? "auto" : "none" }}
              />
              {/* price + order, floating above the tin */}
              <div
                ref={(el) => {
                  if (el) captions.current.set(id, el);
                }}
                className="absolute -translate-x-1/2 text-center"
                style={{ pointerEvents: shopping ? "auto" : "none" }}
              >
                <p className="label-engraved text-ivory/85 [text-shadow:0_1px_10px_rgba(26,25,23,.6)]">
                  {s.name}
                </p>
                <p className="mt-2 font-serif text-3xl text-ivory [text-shadow:0_1px_14px_rgba(26,25,23,.7)]">
                  {PRICE}
                </p>
                <div className="mt-3">
                  <PreorderButton scent={id}>Order</PreorderButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
