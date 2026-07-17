"use client";

import { Button } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/site";

const field =
  "w-full border border-charcoal/20 bg-transparent px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-gold focus:outline-none";

/* Contact form — composes the message and opens the visitor's email app
 * addressed to CONTACT_EMAIL (no mail-sending backend yet). */
export default function ContactForm() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const name = `${d.get("firstName")} ${d.get("lastName")}`.trim();
    const subject = `Website inquiry — ${name}`;
    const body = [
      `Name: ${name}`,
      `Phone: ${d.get("phone") || "—"}`,
      `Email: ${d.get("email")}`,
      "",
      `${d.get("message")}`,
    ].join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-12 grid w-full max-w-xl gap-4 text-left"
    >
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
        <Button type="submit">Send</Button>
      </div>
      <p className="text-center text-xs tracking-wide text-charcoal/55">
        Opens your email app addressed to {CONTACT_EMAIL}.
      </p>
    </form>
  );
}
