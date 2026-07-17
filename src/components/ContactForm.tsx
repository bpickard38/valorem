"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/site";

const field =
  "w-full border border-charcoal/20 bg-transparent px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-gold focus:outline-none";

/* Contact form — posts the message straight to Web3Forms, which delivers it
 * to CONTACT_EMAIL. No mail app, no page reload. The access key is a public
 * client token by design (safe to ship); set it in .env.local as
 * NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY. */
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    const form = e.currentTarget;
    const d = new FormData(form);
    const name = `${d.get("firstName")} ${d.get("lastName")}`.trim();

    if (!ACCESS_KEY) {
      setError(
        "The contact form isn't configured yet. Please email us directly.",
      );
      setStatus("error");
      return;
    }

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `Website inquiry — ${name}`,
          from_name: "VALOREM Website",
          name,
          phone: d.get("phone") || "—",
          email: d.get("email"),
          message: d.get("message"),
          botcheck: d.get("botcheck"), // honeypot; Web3Forms drops if filled
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Send failed");
      }
      form.reset();
      setStatus("sent");
    } catch {
      setError("Something went wrong. Please try again in a moment.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="mx-auto mt-12 max-w-xl text-center">
        <p className="font-serif text-2xl text-charcoal">Thank you.</p>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
          Your message is on its way — we&rsquo;ll get back to you soon.
        </p>
        <div className="mt-8">
          <Button type="button" onClick={() => setStatus("idle")}>
            Send another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-12 grid w-full max-w-xl gap-4 text-left"
    >
      {/* Honeypot — hidden from people, catches bots. */}
      <input
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          name="firstName"
          required
          autoComplete="given-name"
          placeholder="First name"
          aria-label="First name"
          className={field}
        />
        <input
          name="lastName"
          required
          autoComplete="family-name"
          placeholder="Last name"
          aria-label="Last name"
          className={field}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="Phone (optional)"
          aria-label="Phone"
          className={field}
        />
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          aria-label="Email"
          className={field}
        />
      </div>
      <textarea
        name="message"
        required
        rows={6}
        placeholder="Your comment or question"
        aria-label="Comment or question"
        className={field}
      />
      <div className="mt-2 text-center">
        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send"}
        </Button>
      </div>
      {status === "error" ? (
        <p className="text-center text-xs tracking-wide text-red-700/80">
          {error}
        </p>
      ) : (
        <p className="text-center text-xs tracking-wide text-charcoal/55">
          Sends straight to {CONTACT_EMAIL} — no email app needed.
        </p>
      )}
    </form>
  );
}
