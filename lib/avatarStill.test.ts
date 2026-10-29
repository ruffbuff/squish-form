import { describe, expect, it } from "vitest";
import { EYE_POLY_DEPTH_SCALE, EYE_POLY_LIFT, eyeMoodShape, eyeProtrusion, placeEyesOnSilhouette, seatEyePosition } from "./eyes";
import { stillEyePositions, type StillShot } from "./avatarStill";

const base: StillShot = {
  silhouette: "blob",
  color: "#f0a",
  colorB: "#0af",
  colorMode: "solid",
  gradientAngle: 0,
  gradientSoft: false,
  material: "matte",
  surface: "smooth",
  rim: 0,
  eyes: "dots",
  eyeSize: 1,
  eyeInset: 0.62,
  mood: "calm",
};

function expectedPositions(params: StillShot) {
  const anchors = placeEyesOnSilhouette(params.silhouette);
  const radius = anchors.radius * params.eyeSize;
  const mood = eyeMoodShape(params.mood, params.eyes === "ovals");
  const poly = params.surface === "poly";
  const protrusion = eyeProtrusion(params.eyeInset, anchors.sink) + (poly ? EYE_POLY_LIFT : 0);
  const depth = radius * mood.sz * (poly ? EYE_POLY_DEPTH_SCALE : 1);
  return anchors.eyes.map((anchor) =>
    seatEyePosition(anchor, depth, protrusion, radius * mood.lift),
  );
}

describe("avatar still eye seating", () => {
  it.each(["smooth", "poly"] as const)("matches the stage rest seat for %s", (surface) => {
    const params = { ...base, surface };
    const actual = stillEyePositions(params);
    const expected = expectedPositions(params);
    actual.forEach((position, index) => {
      expect(position.distanceTo(expected[index])).toBeLessThan(1e-9);
    });
  });
});
