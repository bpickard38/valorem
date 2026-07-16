import sharp from "sharp";

/*
 * Build the pegasus mark from the supplied lockup (`new logo.webp`).
 *
 * The source is black-on-white, lossy, and includes the VALOREM wordmark below
 * the horse. We take the horse only (the site renders the wordmark as live
 * text), and key the white to alpha — including the WHITE DETAIL LINES inside
 * the horse (eye, feather separations), because the film's silhouette has those
 * transparent and the two have to crossfade onto each other.
 */
const SRC = "scripts/_raw/brand-lockup-master.webp";
const OUT = "public/brand/pegasus-mark-v2.png";
const REGION = { left: 200, top: 0, width: 1180, height: 1000 }; // horse block

// Levels key. A straight luminance->alpha ramp leaves the body ~250 rather than
// 255, because lossy encoding scatters "black" body pixels up to ~60 — the sky
// then shows faintly THROUGH the horse. Anything at or below INK_HI is ink;
// anything at or above WHITE_LO is background; between is the anti-aliased edge.
const INK_HI = 70;
const WHITE_LO = 238;
const FILM_INK = [22, 21, 20]; // measured mean ink of the film's silhouette
const FILM_FRAME = "public/sequences/pegasus-morph/1080/f_0120.webp"; // last morph frame

const { data, info } = await sharp(SRC)
  .extract(REGION).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;

const out = Buffer.alloc(w * h * 4);
for (let p = 0; p < w * h; p++) {
  const i = p * 4;
  const L = (data[i] + data[i + 1] + data[i + 2]) / 3;
  const t = (WHITE_LO - L) / (WHITE_LO - INK_HI);
  const a = Math.max(0, Math.min(1, t));
  out[i] = FILM_INK[0]; out[i+1] = FILM_INK[1]; out[i+2] = FILM_INK[2];
  out[i+3] = Math.round(a * 255);
}

await sharp(out, { raw: { width: w, height: h, channels: 4 } })
  .png().trim({ threshold: 10 }).toFile(OUT);

async function stats(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0=1e9,y0=1e9,x1=-1,y1=-1,solid=0,any=0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const a = data[(y*info.width+x)*4+3];
    if (a > 250) solid++;
    if (a > 24) { any++; if (x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
  }
  const c = data[((info.height>>1)*info.width + (info.width>>1))*4+3];
  return { size: `${info.width}x${info.height}`, aspect: +((x1-x0+1)/(y1-y0+1)).toFixed(4),
           heightFrac: +((y1-y0+1)/info.height).toFixed(4),
           // normalised centre of the ink INSIDE the frame — the film's pegasus
           // is not centred, and the DOM logo has to match it.
           cx: (x0 + (x1-x0+1)/2) / info.width,
           cy: (y0 + (y1-y0+1)/2) / info.height,
           solidPct: +((solid/any)*100).toFixed(1), centreAlpha: c };
}
const mark = await stats(OUT);
const film = await stats(FILM_FRAME);

// These three numbers are what the app is calibrated against. If the morph is
// re-encoded or the logo changes, re-run this and update both call sites:
//   SILHOUETTE (experience/phases.ts)  and  the h-[calc(...)] in Overlay.tsx
console.log(JSON.stringify({
  mark, film,
  aspectDeltaPct: +((mark.aspect / film.aspect - 1) * 100).toFixed(2),
  "=> phases.ts SILHOUETTE": {
    cx: +film.cx.toFixed(4),
    cy: +film.cy.toFixed(4),
    heightFrac: +(film.heightFrac / mark.heightFrac).toFixed(4),
  },
  "=> Overlay.tsx": `h-[calc(var(--film-h)*${(film.heightFrac / mark.heightFrac).toFixed(4)})]`,
}, null, 1));
