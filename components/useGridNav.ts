"use client";

import { useCallback, type KeyboardEvent } from "react";
import { columnCountFromGridTemplate, nextGridIndex } from "@/lib/gridNav";

/**
 * Roving focus for a role="group" of plain buttons. Focus follows the arrow
 * keys; selection stays on Enter/Space so moving around never changes the
 * avatar by accident.
 *
 * `columns` is the fallback for a flex row. A CSS grid uses the computed
 * track list instead, so ArrowUp/ArrowDown follow the visual columns even
 * when a breakpoint changes `--sil-columns`.
 */
export function useGridNav(columns: number) {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== "BUTTON") return;
      const root = event.currentTarget;
      const items = Array.from(
        root.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
      );
      const index = items.indexOf(target as HTMLButtonElement);
      const style = window.getComputedStyle(root);
      const isGrid = style.display === "grid" || style.display === "inline-grid";
      const span = isGrid
        ? columnCountFromGridTemplate(style.gridTemplateColumns, columns)
        : Math.max(1, Math.floor(columns));
      const next = nextGridIndex(index, event.key, items.length, span);
      if (next === null) return;
      event.preventDefault();
      items[next]?.focus();
    },
    [columns],
  );
}
