import { describe, expect, it } from "vitest";
import {
  FLAT_EYE_MULTIPLIER,
  FLAT_MAX_DURATION,
  FLAT_MIN_DURATION,
  flatDuration,
  flatDurationSeconds,
  flatEyeDuration,
} from "./flatMotion";
import { flatLayers } from "./flatSvg";
import { FLAT_INITIAL } from "./flatTypes";
import type { FlatEyeMood } from "./flatTypes";

const moods: FlatEyeMood[] = ["calm", "joy", "sleep", "wow"];

describe("flat motion clock", () => {
  it("clamps speed to the documented duration range", () => {
    expect(flatDurationSeconds(-1)).toBeCloseTo(FLAT_MAX_DURATION, 6);
    expect(flatDurationSeconds(0)).toBeCloseTo(FLAT_MAX_DURATION, 6);
    expect(flatDurationSeconds(1)).toBeCloseTo(FLAT_MIN_DURATION, 6);
    expect(flatDurationSeconds(2)).toBeCloseTo(FLAT_MIN_DURATION, 6);
  });

  it("gets faster as speed grows", () => {
    let previous = Infinity;
    for (let speed = 0; speed <= 1; speed += 0.1) {
      const seconds = flatDurationSeconds(speed);
      expect(seconds).toBeLessThan(previous);
      previous = seconds;
    }
  });

  it("formats durations for CSS", () => {
    expect(flatDuration(0)).toBe("4.40s");
    expect(flatDuration(1)).toBe("1.80s");
    expect(flatDuration(0.5)).toBe("3.10s");
  });

  it("keeps mood pacing relative at every speed", () => {
    for (const speed of [0, 0.35, 0.5, 1]) {
      const base = flatDurationSeconds(speed);
      for (const mood of moods) {
        const seconds = parseFloat(flatEyeDuration(speed, mood));
        expect(seconds).toBeCloseTo(base * FLAT_EYE_MULTIPLIER[mood], 2);
      }
    }
  });

  it("uses the same clock in flatLayers", () => {
    for (const speed of [0, 0.5, 1]) {
      const layers = flatLayers({ ...FLAT_INITIAL, speed }, "test");
      expect(layers.duration).toBe(flatDuration(speed));
    }
  });
});
