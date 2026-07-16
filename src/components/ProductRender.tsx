import Image from "next/image";

/*
 * CSS product renders — stand-ins until real photography.
 * One twist-up stick, built from layered gradients: hard key light from the
 * upper left, specular strip on the body, tight contact shadow plus a long
 * directional cast. Wax tint varies per scent.
 */

const BODY_GRADIENT =
  "linear-gradient(90deg, #0d0c0b 0%, #201e1b 18%, #4a463e 30%, #26241f 45%, #171613 70%, #0a0908 100%)";

function StickFigure({ wax, height }: { wax: string; height: string }) {
  return (
    <div
      className="relative flex flex-col items-center"
      style={{ height, aspectRatio: "0.24" }}
    >
      {/* wax dome */}
      <div
        className="relative h-[13%] w-[86%] rounded-t-full"
        style={{ background: wax }}
      >
        <div
          className="absolute inset-0 rounded-t-full"
          style={{
            background:
              "linear-gradient(115deg, rgba(255,255,255,0.55) 8%, transparent 40%, rgba(26,25,23,0.18) 88%)",
          }}
        />
      </div>
      {/* case body */}
      <div
        className="relative flex w-full flex-1 items-center justify-center overflow-hidden"
        style={{ background: BODY_GRADIENT }}
      >
        {/* top lip highlight where wax meets case */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
        <span
          className="select-none font-serif text-[0.55rem] tracking-[0.32em] text-[#c9b06a]/80"
          style={{ writingMode: "vertical-rl" }}
        >
          VALOREM
        </span>
      </div>
      {/* gold twist base */}
      <div
        className="relative h-[6%] w-full"
        style={{
          background:
            "linear-gradient(90deg, #86642a 0%, #d8b96a 25%, #b8963e 50%, #8f6f2e 80%, #6d5423 100%)",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
      </div>
    </div>
  );
}

function CastShadow({ width }: { width: string }) {
  return (
    <>
      {/* tight contact shadow */}
      <div
        className="absolute bottom-[7.5%] left-1/2 h-[3%] -translate-x-1/2 translate-y-1/2"
        style={{
          width,
          background:
            "radial-gradient(ellipse at center, rgba(13,12,11,0.5) 0%, transparent 68%)",
        }}
      />
      {/* long directional cast, key light upper-left */}
      <div
        className="absolute bottom-[6.5%] left-1/2 h-[2.5%] origin-left rotate-[4deg]"
        style={{
          width: `calc(${width} * 2.4)`,
          background:
            "linear-gradient(90deg, rgba(13,12,11,0.28) 0%, transparent 85%)",
          filter: "blur(2px)",
        }}
      />
    </>
  );
}

/* Hero — stick on a stone plinth, wide editorial crop */
export function HeroRender() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden flex items-center justify-center"
      style={{
        background:
          "linear-gradient(115deg, #f0ebe0 0%, #e3dccb 52%, #cdc4ad 100%)",
      }}
    >
      <Image
        src="/shopify/valorem.png"
        alt="Valorem Solid Fragrance"
        fill
        sizes="(max-width: 768px) 100vw, 512px"
        className="object-contain"
        priority
      />
    </div>
  );
}

/* Card — stick against a scent-tinted stone field */
export function CardRender({
  wax,
  backdrop,
  scentId,
}: {
  wax?: string;
  backdrop?: string;
  scentId?: string;
}) {
  let imgSrc = "/shopify/valorem.png";
  if (scentId === "poseidon") imgSrc = "/shopify/poseidon.png";
  if (scentId === "aphrodite") imgSrc = "/shopify/aphrodite.png";

  return (
    <div
      aria-hidden="true"
      className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden transition-transform duration-500 ease-out group-hover:scale-[1.015]"
      style={{ background: backdrop }}
    >
      <Image
        src={imgSrc}
        alt={scentId || "Valorem product"}
        fill
        sizes="(max-width: 768px) 100vw, 384px"
        className="object-contain p-4"
      />
    </div>
  );
}
