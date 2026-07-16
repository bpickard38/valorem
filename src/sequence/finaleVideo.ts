/*
 * The finale film (statues → product tins) is fetched inside the initial
 * Loader gate so the sanctum never waits on the network. The bytes land in a
 * blob object URL rather than warming the HTTP cache: media elements issue
 * Range requests and whether they share the fetch cache is browser-dependent
 * (Safari especially) — a blob src is deterministic. The URL is never revoked;
 * it lives for the session (~4 MB).
 */

const SRC = "/fx/statues-to-product-v1.mp4";

/** Progress denominator until (and unless) content-length arrives. */
export const FINALE_VIDEO_BYTES = 4_016_454;

let objectUrl: string | null = null;
let pending: Promise<void> | null = null;

/** The blob URL once the fetch has finished, else null. */
export function getFinaleObjectUrl(): string | null {
  return objectUrl;
}

/** Resolves with the blob URL once the preload settles — null if it failed
 *  or was never started (callers fall back to the element's own loading). */
export async function finaleVideoUrl(): Promise<string | null> {
  if (pending) await pending;
  return objectUrl;
}

export function preloadFinaleVideo(
  onBytes: (loaded: number, total: number) => void,
): Promise<void> {
  pending ??= (async () => {
    try {
      const res = await fetch(SRC);
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const total =
        Number(res.headers.get("content-length")) || FINALE_VIDEO_BYTES;
      const reader = res.body.getReader();
      const chunks: BlobPart[] = [];
      let loaded = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        onBytes(loaded, total);
      }
      objectUrl = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
      const settled = Math.max(loaded, total);
      onBytes(settled, settled);
    } catch {
      // Never wedge the Loader on the video — report complete; the Finale
      // falls back to the <video> element's native preload.
      onBytes(1, 1);
    }
  })();
  return pending;
}
