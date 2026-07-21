"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { useCart } from "@/components/CartProvider";

/* Adds the scent and opens the drawer. The label is the caller's. */
export default function AddToCartButton({
  scent,
  children,
  className = "",
}: {
  scent: string;
  children: ReactNode;
  className?: string;
}) {
  const { addItem, status } = useCart();

  return (
    <Button
      type="button"
      onClick={() => addItem(scent)}
      disabled={status === "loading"}
      className={`w-full sm:w-auto ${className}`}
    >
      {children}
    </Button>
  );
}
