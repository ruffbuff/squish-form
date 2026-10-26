export type GridKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "Home"
  | "End";

/**
 * Visual columns of the 3D silhouette picker.
 * `.sil-grid` sets the same count on `--sil-columns`.
 */
export const SILHOUETTE_GRID_COLUMNS = 3;

/**
 * Visual columns of the Flat silhouette picker (`.sil-grid--flat`).
 * The 380px panel fits four tiles; 3D stays at three.
 */
export const FLAT_SILHOUETTE_GRID_COLUMNS = 4;

/**
 * How many columns a computed `grid-template-columns` value actually laid out.
 * Browsers resolve `repeat(var(--sil-columns), 1fr)` to one length per track
 * (`"120px 120px 120px"`). `"none"`, an empty string, or an unresolved
 * template (a `var()` or `minmax()` that has not been turned into lengths)
 * means "not a measured grid", so the caller's fallback is used. That fallback
 * is what flex rows (mood chips, preset chips) pass in.
 */
export function columnCountFromGridTemplate(
  template: string | null | undefined,
  fallback: number,
): number {
  const span = Math.max(1, Math.floor(Number.isFinite(fallback) ? fallback : 1));
  if (!template) return span;
  const value = template.trim();
  if (!value || value === "none") return span;

  const repeat = /^repeat\(\s*(\d+)\s*,/.exec(value);
  if (repeat) return Math.max(1, Number(repeat[1]));

  if (/[()]/.test(value)) return span;

  const tracks = value.split(/\s+/).filter(Boolean);
  return tracks.length > 0 ? tracks.length : span;
}

/**
 * Index a single arrow/Home/End key should focus inside a grid or a row.
 * `columns` is 1 for a plain list. Movement clamps at the edges instead of
 * wrapping, which matches the ARIA grid pattern and makes the last tile a
 * predictable stop.
 */
export function nextGridIndex(
  index: number,
  key: string,
  count: number,
  columns = 1,
): number | null {
  if (count <= 0 || index < 0 || index >= count) return null;
  const span = Math.max(1, Math.floor(columns));
  switch (key) {
    case "ArrowLeft":
      return index % span === 0 ? null : index - 1;
    case "ArrowRight":
      return index % span === span - 1 || index === count - 1 ? null : index + 1;
    case "ArrowUp":
      return index - span >= 0 ? index - span : null;
    case "ArrowDown":
      return index + span < count ? index + span : null;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}
