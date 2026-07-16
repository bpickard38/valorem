import type { ComponentPropsWithoutRef, ReactNode } from "react";

/*
 * Shared primitives — single source for CTA and section-header styling.
 * Ported from ../valorem/src/components/ui.tsx — keep in step.
 */

const buttonBase =
  "group relative inline-block cursor-pointer overflow-hidden px-10 py-4 text-xs font-medium uppercase tracking-[0.25em] transition-colors duration-300 active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

const buttonSkin = {
  solid: "bg-gold text-ivory",
  outline: "border border-gold text-charcoal hover:text-ivory",
} as const;

const buttonSweep = {
  solid: "bg-gold-deep",
  outline: "bg-gold",
} as const;

type Variant = keyof typeof buttonSkin;

function ButtonInner({ children }: { children: ReactNode }) {
  return <span className="relative z-10">{children}</span>;
}

function Sweep({ variant }: { variant: Variant }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 ${buttonSweep[variant]}`}
    />
  );
}

export function ButtonLink({
  variant = "solid",
  className = "",
  children,
  ...props
}: ComponentPropsWithoutRef<"a"> & { variant?: Variant }) {
  return (
    <a className={`${buttonBase} ${buttonSkin[variant]} ${className}`} {...props}>
      <Sweep variant={variant} />
      <ButtonInner>{children}</ButtonInner>
    </a>
  );
}

export function Button({
  variant = "solid",
  className = "",
  children,
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: Variant }) {
  return (
    <button
      className={`${buttonBase} ${buttonSkin[variant]} ${className}`}
      {...props}
    >
      <Sweep variant={variant} />
      <ButtonInner>{children}</ButtonInner>
    </button>
  );
}

export function SectionHeader({
  numeral,
  label,
  title,
  align = "center",
}: {
  numeral: string;
  label?: string;
  title?: ReactNode;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <header className={centered ? "text-center" : "text-left"}>
      <p className="font-serif text-sm tracking-[0.2em] text-gold">{numeral}</p>
      <div
        className={`mt-4 h-px w-10 bg-gold/70 ${centered ? "mx-auto" : ""}`}
      />
      {label ? (
        <p className="label-engraved mt-4 text-charcoal/55">{label}</p>
      ) : null}
      {title ? <h2 className="type-heading mt-7 text-charcoal">{title}</h2> : null}
    </header>
  );
}
