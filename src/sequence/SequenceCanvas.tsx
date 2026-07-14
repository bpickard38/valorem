"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { PHASES, TOTAL_SPAN, DAMP, type Phase } from "@/experience/phases";
import { experienceStore, locate, damp } from "@/experience/state";
import { getManifest } from "@/experience/manifest";
import { coverFit } from "./coverFit";
import { decodePool } from "./decodePool";
import { getBlob, segMeta } from "./sequences";

/*
 * The baked film. A fixed fullscreen 2D canvas whose playhead is a damped
 * copy of scroll progress. Draws floor/ceil frames cross-blended (16fps
 * sources read as continuous motion), dissolves across baked→baked seams,
 * and NEVER awaits — if the exact frame isn't decoded yet it draws the
 * nearest neighbor and lets the damped playhead catch up.
 */

const DISSOLVE_SPAN = 0.06; // fraction of a phase used for seam dissolves

function phaseAt(idx: number): Phase | undefined {
  return PHASES[idx];
}

export function SequenceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let vw = 0;
    let vh = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      vw = Math.round(window.innerWidth * dpr);
      vh = Math.round(window.innerHeight * dpr);
      canvas.width = vw;
      canvas.height = vh;
    };
    resize();
    window.addEventListener("resize", resize);

    let dampedPos = experienceStore.getState().progress * TOTAL_SPAN;

    /** Draw one segment frame cover-fit; returns true if something drew. */
    const drawFrame = (
      seg: string,
      frame: number,
      focal: Phase["focal"],
      alpha: number,
    ): boolean => {
      const bmp = decodePool().nearest(seg, frame);
      if (!bmp) return false;
      const { sx, sy, sw, sh } = coverFit(
        bmp.width,
        bmp.height,
        vw,
        vh,
        focal,
      );
      ctx.globalAlpha = alpha;
      ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, vw, vh);
      ctx.globalAlpha = 1;
      return true;
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
        // Hold the final doors frame under the sanctum interactions.
        seg = phaseAt(idx - 1)?.seq?.name ?? null;
        local = 1;
      }

      if (!seg) {
        // hero: live WebGL owns the frame — keep the film transparent
        ctx.clearRect(0, 0, vw, vh);
        return;
      }
      const meta = segMeta(seg);
      if (!meta) return;

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
        drawFrame(seg, lo, ph.focal, 1);
        if (hi !== lo && decodePool().has(seg, hi)) {
          drawFrame(seg, hi, ph.focal, f - lo); // 2-frame cross-blend
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
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[5] h-full w-full"
      aria-hidden="true"
    />
  );
}
