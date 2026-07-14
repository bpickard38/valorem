import { createCheckout, isScentId } from "@/lib/shopify";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const scent = body && typeof body === "object" ? body.scent : null;

  if (!isScentId(scent)) {
    return Response.json({ error: "Unknown scent" }, { status: 400 });
  }

  try {
    const url = await createCheckout(scent);
    return Response.json({ url });
  } catch (error) {
    console.error("checkout failed:", error);
    return Response.json(
      { error: "Checkout is unavailable right now." },
      { status: 502 },
    );
  }
}
