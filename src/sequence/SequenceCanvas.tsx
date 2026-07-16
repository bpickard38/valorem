"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { PHASES, TOTAL_SPAN, DAMP, type Phase } from "@/experience/phases";
import { experienceStore, locate, damp } from "@/experience/state";
import { getManifest } from "@/experience/manifest";
import { isLetterboxed, stageFit, syncFilmVars } from "./coverFit";
import { decodePool } from "./decodePool";
import { getBlob, segMeta } from "./sequences";

/*
 * The baked film. A fixed fullscreen 2D canvas whose playhead is a damped
 * copy of scroll progress. Draws floor/ceil frames cross-blended (16fps
 * sources read as continuous motion), dissolves across baked→baked seams,
 * and NEVER awaits — if the exact frame isn't decoded yet it draws the
 * nearest neighbor and lets the damped playhead catch up.
 *
 * On viewports too narrow to crop (see MIN_COVER_ASPECT) the film becomes a
 * centered band and a second canvas fills the gap behind it with a blurred
 * enlargement of the same frame. That backdrop only runs for opaque phases:
 * the morph is an alpha cutout over the sky plate, which already fills the
 * screen — blurring a transparent frame would just smear it.
 */

const DISSOLVE_SPAN = 0.06; // fraction of a phase used for seam dissolves

/* The backdrop is blurred to mush by CSS, so it's drawn at a deliberately
 * tiny size — a full-DPR canvas-2D filter: blur() would not be affordable per
 * frame, while a 64px drawImage plus a GPU-composited CSS blur is free. */
const BACKDROP_W = 64;
const BACKDROP_H = Math.round(BACKDROP_W / (1920 / 1072));

function phaseAt(idx: number): Phase | undefined {
  return PHASES[idx];
}

export function SequenceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backdropRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const backdrop = backdropRef.current!;
    const bctx = backdrop.getContext("2d")!;
    backdrop.width = BACKDROP_W;
    backdrop.height = BACKDROP_H;
    let vw = 0;
    let vh = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      vw = Math.round(window.innerWidth * dpr);
      vh = Math.round(window.innerHeight * dpr);
      canvas.width = vw;
      canvas.height = vh;
      // The film's layer owns the fit, so it owns publishing it. See
      // syncFilmVars — ScrollTrigger's refresh alone can't be trusted to.
      syncFilmVars();
    };
    resize();
    window.addEventListener("resize", resize);

    let dampedPos = experienceStore.getState().progress * TOTAL_SPAN;

    /** Draw one segment frame at its stage placement; true if something drew. */
    const drawFrame = (
      seg: string,
      frame: number,
      focal: Phase["focal"],
      alpha: number,
    ): boolean => {
      const bmp = decodePool().nearest(seg, frame);
      if (!bmp) return false;
      const { sx, sy, sw, sh, dx, dy, dw, dh } = stageFit(
        bmp.width,
        bmp.height,
        vw,
        vh,
        focal,
      );
      ctx.globalAlpha = alpha;
      ctx.drawImage(bmp, sx, sy, sw, sh, dx, dy, dw, dh);
      ctx.globalAlpha = 1;
      return true;
    };

    /** The whole frame, squeezed into a thumbnail. CSS crops, blurs, and
     *  scales it up to fill the gap around the letterboxed band. */
    const drawBackdrop = (seg: string, frame: number): void => {
      const bmp = decodePool().nearest(seg, frame);
      if (!bmp) return;
      bctx.drawImage(bmp, 0, 0, BACKDROP_W, BACKDROP_H);
    };

    const requestAround = (seg: string, f: number, dir: number) => {
      const meta = segMeta(seg);
      if (!meta) return;
      // Decode at (roughly) display resolution — a 1080p source on a small
      // viewport decodes ~2× smaller, halving pool bytes.
      const need = Math.min(meta.w, Math.max(vw, Math.ceil(vh * (meta.w / meta.h))));
      const lo = Math.floor(f);
      const order = [lo, lo + 1, lo + dir * 2, lo + dir * 3, lo + dir * 4, lo - dir];
      for (const i of order) {
        if (i >= 0 && i < meta.frames) {
          decodePool().request(seg, i, (n) => getBlob(seg, n), need);
        }
      }
    };

    const tick = (_time: number, deltaMs: number) => {
      const st = experienceStore.getState();
      if (!getManifest()) return;

      dampedPos = damp(dampedPos, st.progress * TOTAL_SPAN, DAMP, deltaMs / 1000);
      const { phase, phaseProgress } = locate(dampedPos / TOTAL_SPAN);
      const idx = PHASES.findIndex((p) => p.id === phase);
      const ph = phaseAt(idx)!;

      // What does this phase show?
      let seg = ph.seq?.name ?? null;
      let local = phaseProgress;
      if (ph.id === "sanctum") {
        // Hold the final voyage frame (the statues) under the finale.
        seg = phaseAt(idx - 1)?.seq?.name ?? null;
        local = 1;
      }

      if (!seg) {
        // No phase hits this today; cheap insurance if one ever hands the
        // frame to the live WebGL layer again.
        ctx.clearRect(0, 0, vw, vh);
        backdrop.style.opacity = "0";
        return;
      }
      const meta = segMeta(seg);
      if (!meta) return;

      // Blurred fill, only where it earns its keep: a band that can't fill the
      // screen, showing footage that's actually opaque.
      const wantBackdrop = ph.opaque === true && isLetterboxed(vw, vh);
      backdrop.style.opacity = wantBackdrop ? "1" : "0";

      const f = local * (meta.frames - 1);
      const dir = st.velocity >= 0 ? 1 : -1;
      decodePool().setPlayhead(seg, f);
      requestAround(seg, f, dir);

      // Seam dissolve: at the head of a dissolve phase, keep the previous
      // segment's tail underneath while the new head fades in.
      const prevSeq = phaseAt(idx - 1)?.seq;
      const dissolving =
        ph.seam === "dissolve" && prevSeq && local < DISSOLVE_SPAN;
      if (dissolving) {
        const prevMeta = segMeta(prevSeq.name);
        if (prevMeta) {
          decodePool().request(
            prevSeq.name,
            prevMeta.frames - 1,
            (n) => getBlob(prevSeq.name, n),
            vw,
          );
        }
      }

      const lo = Math.floor(f);
      const hi = Math.min(meta.frames - 1, lo + 1);
      const hasCurrent = decodePool().nearest(seg, lo, 6) !== null;
      if (!hasCurrent && !dissolving) return; // hold last drawn frame

      // fadeTail: film hands the frame to a DOM element at the phase end.
      const tailAlpha =
        ph.fadeTail && local > 1 - ph.fadeTail
          ? Math.max(0, (1 - local) / ph.fadeTail)
          : 1;

      if (wantBackdrop) drawBackdrop(seg, lo);

      ctx.clearRect(0, 0, vw, vh);
      if (dissolving) {
        const prevMeta = segMeta(prevSeq.name);
        if (prevMeta) {
          drawFrame(
            prevSeq.name,
            prevMeta.frames - 1,
            phaseAt(idx - 1)?.focal,
            1,
          );
        }
        const headAlpha = local / DISSOLVE_SPAN;
        drawFrame(seg, lo, ph.focal, headAlpha);
      } else {
        drawFrame(seg, lo, ph.focal, tailAlpha);
        if (hi !== lo && decodePool().has(seg, hi)) {
          drawFrame(seg, hi, ph.focal, (f - lo) * tailAlpha); // cross-blend
        }
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* Blurred fill — under the film (z-5), over the sky plates (z-0). */}
      <canvas
        ref={backdropRef}
        className="pointer-events-none fixed inset-0 z-[4] h-full w-full scale-110 object-cover opacity-0 blur-2xl brightness-[0.82] transition-opacity duration-300"
        aria-hidden="true"
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[5] h-full w-full"
        aria-hidden="true"
      />
    </>
  );
}
