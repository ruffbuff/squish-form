import { describe, expect, it } from "vitest";
import { flatLayers, flatSvg } from "./flatSvg";
import { flatSilhouette, FLAT_SILHOUETTES as shapes } from "./flatShapes";
import { FLAT_INITIAL, type FlatSilhouetteId } from "./flatTypes";

const ids = shapes.map((shape) => shape.id);

describe("flat edge wall", () => {
  it("builds a side wall for every silhouette", () => {
    for (const silhouette of ids as FlatSilhouetteId[]) {
      const layers = flatLayers({ ...FLAT_INITIAL, silhouette }, "edge");
      expect(layers.edge).toContain("<linearGradient");
      expect(layers.edge).toContain("stroke-linejoin=\"round\"");
      expect(layers.edge).not.toContain("NaN");
      const wallPath = layers.edge.match(/<path d="([^"]+)"/)?.[1] ?? "";
      expect(wallPath.length).toBeGreaterThan(500);
    }
  });

  it("draws the wall behind the body in exported SVG", () => {
    const svg = flatSvg({ ...FLAT_INITIAL, silhouette: "cloud" }, "export", "edge");
    const wall = svg.indexOf("fill=\"url(#edge-edge)\"");
    const body = svg.indexOf("clip-path=\"url(#edge-clip)\"");
    expect(wall).toBeGreaterThan(-1);
    expect(body).toBeGreaterThan(wall);
  });

  it("uses fill colours for the lit and shaded parts of the wall", () => {
    const warm = flatLayers({ ...FLAT_INITIAL, color: "#ff8a1f", colorB: "#ffd36a" }, "warm");
    const cool = flatLayers({ ...FLAT_INITIAL, color: "#2266ff", colorB: "#88ccff" }, "cool");
    expect(warm.edge).not.toBe(cool.edge);
    expect(warm.edge).toContain("#");
    expect(flatSilhouette("cloud").body.length).toBeGreaterThan(24);
  });
});
