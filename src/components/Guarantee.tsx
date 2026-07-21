import { GUARANTEE } from "@/lib/site";

/*
 * The return policy as a selling point rather than fine print. Sits directly
 * beside every buy button, framed and gold-ruled so it reads as a promise the
 * house is making — not a disclaimer it is hiding.
 */
export default function Guarantee({
  className = "",
  align = "center",
}: {
  className?: string;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <div
      className={`border border-gold/40 bg-gold/[0.06] px-5 py-4 ${
        centered ? "text-center" : "text-left"
      } ${className}`}
    >
      <p className="font-serif text-lg leading-snug text-charcoal sm:text-xl">
        {GUARANTEE.headline}
      </p>
      <p className="mt-1 font-serif text-lg leading-snug text-gold-deep sm:text-xl">
        {GUARANTEE.sub}
      </p>
    </div>
  );
}
