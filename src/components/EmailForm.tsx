"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export default function EmailForm() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");

  if (status === "done") {
    return (
      <p className="py-4 font-serif text-xl text-charcoal">
        You are on the list.
      </p>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <form
        onSubmit={submit}
        className="flex w-full flex-col items-stretch gap-6 sm:flex-row sm:items-end sm:gap-4"
      >
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="Email address"
          className="w-full border-b border-charcoal/30 bg-transparent px-1 pb-3 pt-2 text-center font-serif text-lg text-charcoal transition-colors placeholder:text-charcoal/35 focus:border-gold focus:outline-none sm:text-left"
        />
        <Button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0"
        >
          {status === "loading" ? "One moment" : "Get Access"}
        </Button>
      </form>
      {status === "error" && (
        <p className="mt-3 text-xs tracking-wide text-charcoal/70">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  );
}
