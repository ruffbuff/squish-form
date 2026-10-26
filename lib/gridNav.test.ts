import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SILHOUETTES } from "./silhouettes";
import {
  FLAT_SILHOUETTE_GRID_COLUMNS,
  SILHOUETTE_GRID_COLUMNS,
  columnCountFromGridTemplate,
  nextGridIndex,
} from "./gridNav";

describe("grid keyboard navigation", () => {
  it("moves left and right without leaving the row", () => {
    const columns = 4;
    expect(nextGridIndex(1, "ArrowLeft", 12, columns)).toBe(0);
    expect(nextGridIndex(0, "ArrowLeft", 12, columns)).toBeNull();
    expect(nextGridIndex(2, "ArrowRight", 12, columns)).toBe(3);
    expect(nextGridIndex(3, "ArrowRight", 12, columns)).toBeNull();
  });

  it("moves by a full row up and down", () => {
    const columns = 4;
    expect(nextGridIndex(5, "ArrowUp", 12, columns)).toBe(1);
    expect(nextGridIndex(1, "ArrowUp", 12, columns)).toBeNull();
    expect(nextGridIndex(5, "ArrowDown", 12, columns)).toBe(9);
    expect(nextGridIndex(9, "ArrowDown", 12, columns)).toBeNull();
  });

  it("does not jump to the next row across the last column", () => {
    expect(nextGridIndex(3, "ArrowRight", 12, 4)).toBeNull();
    expect(nextGridIndex(7, "ArrowRight", 12, 4)).toBeNull();
  });

  it("handles Home and End", () => {
    expect(nextGridIndex(7, "Home", 12, 4)).toBe(0);
    expect(nextGridIndex(7, "End", 12, 4)).toBe(11);
  });

  it("treats a row as one line", () => {
    expect(nextGridIndex(2, "ArrowRight", 5, 5)).toBe(3);
    expect(nextGridIndex(4, "ArrowRight", 5, 5)).toBeNull();
    expect(nextGridIndex(2, "ArrowUp", 5, 5)).toBeNull();
    expect(nextGridIndex(2, "ArrowDown", 5, 5)).toBeNull();
  });

  it("ignores unrelated keys and empty grids", () => {
    expect(nextGridIndex(1, "Enter", 12, 4)).toBeNull();
    expect(nextGridIndex(1, "ArrowRight", 0, 4)).toBeNull();
    expect(nextGridIndex(-1, "ArrowRight", 12, 4)).toBeNull();
  });

  it("moves through the 8-tile 3D silhouette grid by three columns", () => {
    const count = SILHOUETTES.length;
    const columns = SILHOUETTE_GRID_COLUMNS;
    expect(count).toBe(8);
    expect(columns).toBe(3);

    // 0 1 2
    // 3 4 5
    // 6 7
    expect(nextGridIndex(0, "ArrowDown", count, columns)).toBe(3);
    expect(nextGridIndex(1, "ArrowDown", count, columns)).toBe(4);
    expect(nextGridIndex(2, "ArrowDown", count, columns)).toBe(5);
    expect(nextGridIndex(3, "ArrowDown", count, columns)).toBe(6);
    expect(nextGridIndex(4, "ArrowDown", count, columns)).toBe(7);
    expect(nextGridIndex(5, "ArrowDown", count, columns)).toBeNull();
    expect(nextGridIndex(6, "ArrowDown", count, columns)).toBeNull();
    expect(nextGridIndex(7, "ArrowDown", count, columns)).toBeNull();

    expect(nextGridIndex(2, "ArrowRight", count, columns)).toBeNull();
    expect(nextGridIndex(5, "ArrowRight", count, columns)).toBeNull();
    expect(nextGridIndex(6, "ArrowRight", count, columns)).toBe(7);
    expect(nextGridIndex(7, "ArrowRight", count, columns)).toBeNull();

    expect(nextGridIndex(0, "ArrowLeft", count, columns)).toBeNull();
    expect(nextGridIndex(3, "ArrowLeft", count, columns)).toBeNull();
    expect(nextGridIndex(6, "ArrowLeft", count, columns)).toBeNull();
    expect(nextGridIndex(7, "ArrowLeft", count, columns)).toBe(6);
    expect(nextGridIndex(1, "ArrowLeft", count, columns)).toBe(0);

    expect(nextGridIndex(0, "ArrowUp", count, columns)).toBeNull();
    expect(nextGridIndex(2, "ArrowUp", count, columns)).toBeNull();
    expect(nextGridIndex(3, "ArrowUp", count, columns)).toBe(0);
    expect(nextGridIndex(5, "ArrowUp", count, columns)).toBe(2);
    expect(nextGridIndex(6, "ArrowUp", count, columns)).toBe(3);
    expect(nextGridIndex(7, "ArrowUp", count, columns)).toBe(4);

    expect(nextGridIndex(4, "Home", count, columns)).toBe(0);
    expect(nextGridIndex(4, "End", count, columns)).toBe(count - 1);
  });

  it("counts resolved grid tracks and leaves flex rows on their fallback", () => {
    expect(columnCountFromGridTemplate("120px 120px 120px", 4)).toBe(3);
    expect(columnCountFromGridTemplate("80px 80px 80px 80px", 3)).toBe(4);
    expect(columnCountFromGridTemplate("repeat(4, 1fr)", 3)).toBe(4);
    expect(columnCountFromGridTemplate("none", 4)).toBe(4);
    expect(columnCountFromGridTemplate("", 3)).toBe(3);
    expect(columnCountFromGridTemplate(null, 3)).toBe(3);
    expect(columnCountFromGridTemplate("repeat(var(--sil-columns), 1fr)", 3)).toBe(3);
  });

  it("keeps silhouette column constants aligned with .sil-grid", () => {
    const css = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../app/globals.css"),
      "utf8",
    );
    const sil = css.match(/\.sil-grid\s*\{([^}]*)\}/)?.[1] ?? "";
    const flat = css.match(/\.sil-grid--flat\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(sil).toContain(`--sil-columns: ${SILHOUETTE_GRID_COLUMNS}`);
    expect(sil).toContain("repeat(var(--sil-columns), 1fr)");
    expect(flat).toContain(`--sil-columns: ${FLAT_SILHOUETTE_GRID_COLUMNS}`);
    expect(FLAT_SILHOUETTE_GRID_COLUMNS).toBe(4);
  });
});
