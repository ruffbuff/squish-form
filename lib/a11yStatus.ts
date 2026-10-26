import { FLAT_SILHOUETTES } from "./flatShapes";
import { SILHOUETTES } from "./silhouettes";
import type { FlatEyeMood, FlatSilhouetteId, PlayMode } from "./flatTypes";
import type { EyeMood, SilhouetteId } from "./types";

export const MOOD_LABELS: Record<EyeMood | FlatEyeMood, string> = {
  calm: "Обычные",
  joy: "Радость",
  sleep: "Сон",
  wow: "Удивление",
};

const flatNames = new Map<string, string>(
  FLAT_SILHOUETTES.map((shape) => [shape.id, shape.label]),
);
const solidNames = new Map<string, string>(
  SILHOUETTES.map((shape) => [shape.id, shape.label]),
);

export function silhouetteLabel(mode: PlayMode, id: SilhouetteId | FlatSilhouetteId) {
  const table = mode === "flat" ? flatNames : solidNames;
  return table.get(id) ?? String(id);
}

/** One polite announcement for the current mode, silhouette and mood. */
export function statusLine(
  mode: PlayMode,
  silhouette: SilhouetteId | FlatSilhouetteId,
  mood: EyeMood | FlatEyeMood,
) {
  return `Режим: ${mode === "flat" ? "Flat" : "3D"}. Силуэт: ${silhouetteLabel(
    mode,
    silhouette,
  )}. Настроение: ${MOOD_LABELS[mood]}.`;
}
