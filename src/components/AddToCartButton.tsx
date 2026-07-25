"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { useCart } from "@/components/CartProvider";
import { DEFAULT_SIZE } from "@/lib/site";
import type { SizeId } from "@/lib/site";

/* Adds the product and opens the drawer. The label is the caller's.
 *
 * `product` is a scent id and `size` the size being bought. `value` is what
 * the item is worth for ad tracking — it must be the SELECTED size's price,
 * not the product's headline price, or Meta optimises against a number that
 * was never charged. */
export default function AddToCartButton({
  product,
  size = DEFAULT_SIZE,
  value,
  disabled = false,
  children,
  className = "",
}: {
  product: string;
  size?: SizeId;
  value?: number;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const { addItem, status } = useCart();

  return (
    <Button
      type="button"
      onClick={() => addItem(product, size, value)}
      disabled={disabled || status === "loading"}
      className={`w-full sm:w-auto ${className}`}
    >
      {children}
    </Button>
  );
}
