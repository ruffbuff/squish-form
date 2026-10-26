import { describe, expect, it } from "vitest";
import {
  FLAT_PRESETS,
  applyFlatPreset,
  decodeFlatPreset,
  encodeFlatPreset,
  presetParams,
} from "./flatPresets";
import { FLAT_INITIAL, type FlatParams } from "./flatTypes";

const sample: FlatParams = {
  ...FLAT_INITIAL,
  silhouette: "heart",
  color: "#40ea34",
  colorB: "#123456",
  colorMode: "gradient",
  fill: "jelly",
  eyes: "capsules",
  mood: "joy",
  eyeSize: 1.35,
  idle: "spin",
  speed: 0.2,
  smoothness: 0.9,
  gradientCenterX: 0.7,
  gradientCenterY: 0.25,
  shadowOn: false,
  follow: true,
};

describe("flat preset links", () => {
  it("round-trips every editable field except zoom", () => {
    const token = encodeFlatPreset(sample);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    const decoded = decodeFlatPreset(token);
    expect(decoded).toMatchObject({
      silhouette: "heart",
      color: "#40ea34",
      colorB: "#123456",
      colorMode: "gradient",
      fill: "jelly",
      eyes: "capsules",
      mood: "joy",
      eyeSize: 1.35,
      idle: "spin",
      speed: 0.2,
      smoothness: 0.9,
      gradientCenterX: 0.7,
      gradientCenterY: 0.25,
      shadowOn: false,
      follow: true,
    });
    expect(decoded).not.toHaveProperty("zoom");
  });

  it("keeps presets inside the valid ranges", () => {
    for (const preset of FLAT_PRESETS) {
      const params = presetParams(preset);
      expect(params.eyeSize).toBeGreaterThanOrEqual(0.55);
      expect(params.eyeSize).toBeLessThanOrEqual(1.7);
      for (const value of [params.speed, params.smoothness, params.gradientCenterX, params.gradientCenterY]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
      expect(decodeFlatPreset(encodeFlatPreset(params))).not.toBeNull();
    }
  });

  it("rejects broken tokens", () => {
    expect(decodeFlatPreset("")).toBeNull();
    expect(decodeFlatPreset("not base64 !!!")).toBeNull();
    expect(decodeFlatPreset(null)).toBeNull();
  });

  it("ignores unknown keys and invalid values", () => {
    const token = btoa(JSON.stringify({ q: "nope", s: "rocket", v: 9, u: -3, h: "yes" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const decoded = decodeFlatPreset(token);
    expect(decoded).toEqual({ speed: 1, smoothness: 0 });
  });

  it("applies a preset over the current params", () => {
    const next = applyFlatPreset(sample, FLAT_PRESETS[0]);
    expect(next.silhouette).toBe(FLAT_PRESETS[0].params.silhouette);
    expect(next.zoom).toBe(sample.zoom);
  });
});
