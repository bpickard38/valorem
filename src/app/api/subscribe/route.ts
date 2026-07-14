import { subscribeEmail } from "@/lib/shopify";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = body && typeof body === "object" ? body.email : null;

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Enter a valid email." }, { status: 400 });
  }

  try {
    await subscribeEmail(email.trim().toLowerCase());
    return Response.json({ ok: true });
  } catch (error) {
    console.error("subscribe failed:", error);
    return Response.json(
      { error: "Something went wrong. Try again." },
      { status: 502 },
    );
  }
}
