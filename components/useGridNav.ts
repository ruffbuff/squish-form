"use client";

import { useCallback, type KeyboardEvent } from "react";
import { nextGridIndex } from "@/lib/gridNav";

/**
 * Roving focus for a role="group" of plain buttons. Focus follows the arrow
 * keys; selection stays on Enter/Space so moving around never changes the
 * avatar by accident.
 */
export function useGridNav(columns: number) {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== "BUTTON") return;
      const items = Array.from(
        event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
      );
      const index = items.indexOf(target as HTMLButtonElement);
      const next = nextGridIndex(index, event.key, items.length, columns);
      if (next === null) return;
      event.preventDefault();
      items[next]?.focus();
    },
    [columns],
  );
}
