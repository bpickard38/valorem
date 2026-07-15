"use client";

import { useEffect, useState } from "react";
import { PRICE } from "@/lib/site";

/* Fixed mini-nav — hidden over the hero, slides in once it scrolls away. */
export default function Nav() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShown(!entry.isIntersecting),
      { rootMargin: "-1px 0px 0px 0px" },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 top-0 z-40 border-b border-charcoal/10 bg-ivory/85 backdrop-blur-md transition-transform duration-500 ease-out ${
        shown ? "translate-y-0" : "-translate-y-full"
      }`}
      aria-hidden={!shown}
    >
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <a
          href="#hero"
          className="font-serif text-sm uppercase tracking-[0.4em] text-charcoal"
          tabIndex={shown ? 0 : -1}
        >
          Valorem
        </a>
        <div className="flex items-center gap-6">
          <a
            href="/"
            className="text-[0.65rem] uppercase tracking-[0.25em] text-charcoal/60 transition-colors hover:text-gold"
            tabIndex={shown ? 0 : -1}
          >
            ← The House
          </a>
          <a
            href="#pantheon"
            className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-gold-deep transition-colors hover:text-charcoal"
            tabIndex={shown ? 0 : -1}
          >
            Preorder — {PRICE}
          </a>
        </div>
      </nav>
    </div>
  );
}
