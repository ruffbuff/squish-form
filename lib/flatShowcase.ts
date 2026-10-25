import type { FlatFillId, FlatSilhouetteId } from "./flatTypes";

/** Per-silhouette preview colors for the Flat grid (stable, not live avatar color). */
export const FLAT_SHOWCASE: Record<FlatSilhouetteId, { color: string; fill: FlatFillId }> = {
  cloud: { color: "#7ec8ff", fill: "jelly" },
  blob: { color: "#ec6bff", fill: "jelly" },
  squircle: { color: "#40ea34", fill: "gloss" },
  star: { color: "#ffd166", fill: "matte" },
  flower: { color: "#fb7185", fill: "jelly" },
  drop: { color: "#34d399", fill: "gloss" },
  capsule: { color: "#f08a78", fill: "matte" },
  triangle: { color: "#c084fc", fill: "jelly" },
  pentagon: { color: "#60a5fa", fill: "gloss" },
  heart: { color: "#f472b6", fill: "jelly" },
  hex: { color: "#a3e635", fill: "matte" },
  cottage: { color: "#fbbf24", fill: "gloss" },
};
