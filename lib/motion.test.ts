import { describe, expect, it } from "vitest";
import { idlePose, STILL_POSE } from "./motion";

describe("reduced-motion pose", () => {
  it("has no scale, turn or lift", () => {
    expect(STILL_POSE).toEqual({ width: 1, height: 1, yaw: 0, roll: 0, pitch: 0, bob: 0 });
  });

  it("is a real fallback for every moving idle", () => {
    for (const idle of ["breathe", "sway", "bounce", "spin", "float"] as const) {
      expect(idlePose(idle, 1.7, 0.5, 0.7)).not.toEqual(STILL_POSE);
    }
    expect(idlePose("none", 1.7, 0.5, 0.7)).toEqual(STILL_POSE);
  });
});
