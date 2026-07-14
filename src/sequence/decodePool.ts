/*
 * Global decoded-bitmap pool. Budgets BYTES (not frame counts), caps decode
 * concurrency, and evicts by DISTANCE from the playhead — recency-LRU
 * thrashes the moment the user reverses scroll direction.
 *
 * The draw loop never awaits: request() is fire-and-forget, nearest() returns
 * the closest already-decoded frame (or null).
 */

const OTHER_SEGMENT_PENALTY = 1e6;

class DecodePool {
  private frames = new Map<string, Map<number, ImageBitmap>>();
  private inflight = new Set<string>();
  private bytes = 0;
  private playhead = { seg: "", frame: 0 };

  constructor(
    readonly budgetBytes: number,
    readonly maxInflight = 4,
  ) {}

  setPlayhead(seg: string, frame: number): void {
    this.playhead.seg = seg;
    this.playhead.frame = frame;
  }

  has(seg: string, i: number): boolean {
    return this.frames.get(seg)?.has(i) ?? false;
  }

  /** Fire-and-forget decode. Skips silently when saturated or blob missing. */
  request(
    seg: string,
    i: number,
    getBlob: (i: number) => Blob | null,
    resizeWidth?: number,
  ): void {
    if (i < 0) return;
    const key = `${seg}:${i}`;
    if (this.has(seg, i) || this.inflight.has(key)) return;
    if (this.inflight.size >= this.maxInflight) return;
    const blob = getBlob(i);
    if (!blob) return;

    this.inflight.add(key);
    void (async () => {
      try {
        let bmp: ImageBitmap;
        try {
          bmp = resizeWidth
            ? await createImageBitmap(blob, {
                resizeWidth,
                resizeQuality: "medium",
              })
            : await createImageBitmap(blob);
        } catch {
          // Older Safari: no resize options support.
          bmp = await createImageBitmap(blob);
        }
        let segMap = this.frames.get(seg);
        if (!segMap) {
          segMap = new Map();
          this.frames.set(seg, segMap);
        }
        segMap.set(i, bmp);
        this.bytes += bmp.width * bmp.height * 4;
        this.evict();
      } catch {
        // decode failure: leave undecoded; draw loop falls back to neighbors
      } finally {
        this.inflight.delete(key);
      }
    })();
  }

  /** Closest decoded frame to i within radius, else null. */
  nearest(seg: string, i: number, radius = 24): ImageBitmap | null {
    const segMap = this.frames.get(seg);
    if (!segMap?.size) return null;
    const exact = segMap.get(i);
    if (exact) return exact;
    for (let d = 1; d <= radius; d++) {
      const fwd = segMap.get(i + d);
      if (fwd) return fwd;
      const back = segMap.get(i - d);
      if (back) return back;
    }
    return null;
  }

  private evict(): void {
    while (this.bytes > this.budgetBytes) {
      let worstSeg = "";
      let worstFrame = -1;
      let worstDist = -1;
      for (const [seg, segMap] of this.frames) {
        for (const i of segMap.keys()) {
          const dist =
            seg === this.playhead.seg
              ? Math.abs(i - this.playhead.frame)
              : OTHER_SEGMENT_PENALTY + i;
          if (dist > worstDist) {
            worstDist = dist;
            worstSeg = seg;
            worstFrame = i;
          }
        }
      }
      if (worstFrame < 0) return;
      const segMap = this.frames.get(worstSeg)!;
      const bmp = segMap.get(worstFrame)!;
      this.bytes -= bmp.width * bmp.height * 4;
      bmp.close();
      segMap.delete(worstFrame);
    }
  }

  stats(): { bytes: number; decoded: number; inflight: number } {
    let decoded = 0;
    for (const m of this.frames.values()) decoded += m.size;
    return { bytes: this.bytes, decoded, inflight: this.inflight.size };
  }
}

let pool: DecodePool | null = null;

/** Lazy singleton — module is imported during SSR, but the pool touches
 *  browser APIs, so construct on first client use only. */
export function decodePool(): DecodePool {
  if (!pool) {
    const mobile =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|Android/i.test(navigator.userAgent);
    pool = new DecodePool(mobile ? 96e6 : 320e6);
  }
  return pool;
}
