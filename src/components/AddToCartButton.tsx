"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { useCart } from "@/components/CartProvider";

/* Adds the product and opens the drawer. The label is the caller's.
 *
 * `product` is a scent id or a discovery set id. `value` is what the item is
 * worth for ad tracking — omit it for a stick, pass it for anything priced
 * differently. */
export default function AddToCartButton({
  product,
  value,
  children,
  className = "",
}: {
  product: string;
  value?: number;
  children: ReactNode;
  className?: string;
}) {
  const { addItem, status } = useCart();

  return (
    <Button
      type="button"
      onClick={() => addItem(product, value)}
      disabled={status === "loading"}
      className={`w-full sm:w-auto ${className}`}
    >
      {children}
    </Button>
  );
}
