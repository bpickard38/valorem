"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { SizeId } from "@/lib/site";

/*
 * The selected size, shared between the two halves of the buy block.
 *
 * The size selector and the gallery sit in different columns of a grid that a
 * SERVER component lays out, so neither can own the state the other needs: the
 * selector knows which size is chosen, the gallery has to show that size's
 * photograph. This provider is the smallest thing that joins them without
 * dragging the layout into the client bundle — it takes `children`, so the
 * server-rendered grid, gallery frame and copy all pass straight through it and
 * only the two components that actually read the state are interactive.
 *
 * THE SELECTION IS PUBLISHED TWICE, AND THE SECOND WAY IS THE IMPORTANT ONE:
 *
 *   `selected` — the current value, for anything that renders differently
 *     depending on it. The selector reads this to know which option is lit.
 *   `subscribe` — notification that the shopper JUST PICKED a size, delivered
 *     as an event.
 *
 * The gallery has to use the second. Moving a carousel is a one-shot action, not
 * a function of state, and driving it from `selected` in an effect would mean
 * every re-render is an opportunity to re-run it — so a shopper who picks the
 * 30 ml and then swipes to a lifestyle photo gets dragged back to the tin by
 * the next unrelated render. Subscribing means the gallery moves when, and only
 * when, a size is actually chosen. It is also why direction is one-way: the
 * gallery never writes back, because swiping through photographs is browsing
 * and must not change what is about to be added to the cart.
 *
 * `select` notifies synchronously, from inside the click/keypress that caused
 * it, so the photo starts moving in the same frame as the option lights up.
 *
 * `useSelectedSize` returns null rather than throwing when there is no provider
 * above it. Both consumers work standalone — the gallery simply stops syncing
 * and the selector falls back to its own state — and a product page is not
 * worth crashing over a missing wrapper.
 */

interface SelectedSize {
  selected: SizeId;
  select: (size: SizeId) => void;
  /* Returns its own unsubscribe, so a consumer can hand it straight back as an
   * effect cleanup. Stable across renders — subscribing must not churn every
   * time the selection changes. */
  subscribe: (listener: (size: SizeId) => void) => () => void;
}

const SelectedSizeContext = createContext<SelectedSize | null>(null);

export function SelectedSizeProvider({
  initial,
  children,
}: {
  /* Seeded by the server from the same preferredSize() the selector uses, so
   * the gallery opens on the photograph of the size that opens selected. */
  initial: SizeId;
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<SizeId>(initial);
  const listeners = useRef<Set<(size: SizeId) => void>>(new Set());

  const select = useCallback((size: SizeId) => {
    setSelected(size);
    for (const listener of listeners.current) listener(size);
  }, []);

  const subscribe = useCallback((listener: (size: SizeId) => void) => {
    const set = listeners.current;
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }, []);

  const value = useMemo(
    () => ({ selected, select, subscribe }),
    [selected, select, subscribe],
  );

  return (
    <SelectedSizeContext.Provider value={value}>
      {children}
    </SelectedSizeContext.Provider>
  );
}

export function useSelectedSize(): SelectedSize | null {
  return useContext(SelectedSizeContext);
}
