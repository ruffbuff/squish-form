import { describe, expect, it } from "vitest";
import { silhouetteLabel, statusLine } from "./a11yStatus";
import { FLAT_SILHOUETTES } from "./flatShapes";
import { SILHOUETTES } from "./silhouettes";

describe("live status text", () => {
  it("uses the Flat silhouette names in Flat mode", () => {
    for (const shape of FLAT_SILHOUETTES) {
      expect(silhouetteLabel("flat", shape.id)).toBe(shape.label);
    }
  });

  it("uses the 3D silhouette names in 3D mode", () => {
    for (const shape of SILHOUETTES) {
      expect(silhouetteLabel("3d", shape.id)).toBe(shape.label);
    }
  });

  it("announces mode, silhouette and mood", () => {
    expect(statusLine("flat", "blob", "joy")).toBe(
      "Режим: Flat. Силуэт: Клякса. Настроение: Радость.",
    );
    expect(statusLine("3d", "blob", "sleep")).toBe(
      "Режим: 3D. Силуэт: Капля. Настроение: Сон.",
    );
  });

  it("falls back to the raw id for an unknown silhouette", () => {
    expect(statusLine("flat", "unknown" as never, "calm")).toContain("unknown");
  });
});
