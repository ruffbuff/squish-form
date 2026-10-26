export type GridKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "Home"
  | "End";

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
