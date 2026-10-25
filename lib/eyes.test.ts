import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  EYE_INSET_DEFAULT,
  eyeMoodShape,
  eyeProtrusion,
  eyeQuaternion,
  eyeTilt,
  placeEyesOnSilhouette,
  seatEyePosition,
} from "./eyes";
import { createSilhouetteGeometry, SILHOUETTES } from "./silhouettes";
import type { EyeMood, SilhouetteId } from "./types";

const ids = SILHOUETTES.map((item) => item.id);
const moods: EyeMood[] = ["calm", "joy", "sleep", "wow"];

function hullSize(id: SilhouetteId) {
  const geometry = createSilhouetteGeometry(id, "smooth");
  geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new THREE.Vector3());
  geometry.dispose();
  return size;
}

describe("eye anchors", () => {
  it.each(ids)("%s gets a symmetric, front-facing pair", (id) => {
    const placed = placeEyesOnSilhouette(id);
    const [left, right] = placed.eyes;

    expect(left.point.x).toBeLessThan(0);
    expect(right.point.x).toBeGreaterThan(0);
    expect(left.point.x).toBeCloseTo(-right.point.x, 6);
    expect(left.point.y).toBeCloseTo(right.point.y, 6);
    expect(left.point.z).toBeCloseTo(right.point.z, 6);
    expect(left.normal.x).toBeCloseTo(-right.normal.x, 6);
    expect(left.normal.y).toBeCloseTo(right.normal.y, 6);
    expect(left.normal.z).toBeCloseTo(right.normal.z, 6);
    expect(left.point.z).toBeGreaterThan(0);
    expect(left.normal.z).toBeGreaterThan(0.2);
    expect(left.normal.length()).toBeCloseTo(1, 6);
    expect(placed.radius).toBeGreaterThan(0);
  });

  it.each(ids)("%s anchors stay inside the hull bounds", (id) => {
    const placed = placeEyesOnSilhouette(id);
    const size = hullSize(id);
    for (const eye of placed.eyes) {
      expect(Math.abs(eye.point.x)).toBeLessThan(size.x / 2 + 0.01);
      expect(Math.abs(eye.point.y)).toBeLessThan(size.y / 2 + 0.01);
      expect(eye.point.z).toBeLessThan(size.z / 2 + 0.01);
    }
  });

  it.each(ids)("%s eye pair is deterministic", (id) => {
    const a = placeEyesOnSilhouette(id);
    const b = placeEyesOnSilhouette(id);
    a.eyes.forEach((eye, index) => {
      expect(eye.point.distanceTo(b.eyes[index].point)).toBeLessThan(1e-9);
      expect(eye.normal.distanceTo(b.eyes[index].normal)).toBeLessThan(1e-9);
    });
    expect(a.radius).toBe(b.radius);
  });
});

describe("eye fitting", () => {
  it.each(ids)("%s eyes fit their mood budget", (id) => {
    const placed = placeEyesOnSilhouette(id);
    const size = hullSize(id);
    for (const mood of moods) {
      for (const oval of [false, true]) {
        const shape = eyeMoodShape(mood, oval);
        const halfX = placed.radius * shape.sx;
        const halfY = placed.radius * shape.sy;
        expect(halfX).toBeLessThan(size.x * 0.22);
        expect(halfY).toBeLessThan(size.y * 0.26);
      }
    }
  });

  it("default protrusion stays in the visible band", () => {
    for (const id of ids) {
      const placed = placeEyesOnSilhouette(id);
      const value = eyeProtrusion(EYE_INSET_DEFAULT, placed.sink);
      expect(value).toBeGreaterThan(-0.35);
      expect(value).toBeLessThan(0.15);
    }
  });

  it("protrusion decreases as the inset grows", () => {
    const samples = [0, 0.25, 0.5, 0.75, 1].map((inset) => eyeProtrusion(inset, 0));
    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]).toBeLessThan(samples[i - 1]);
    }
    expect(samples[0]).toBeCloseTo(0.45, 6);
    expect(samples[4]).toBeCloseTo(-0.3, 6);
  });

  it("seats the eye along the surface normal", () => {
    const anchor = {
      point: new THREE.Vector3(0.1, 0.2, 0.3),
      normal: new THREE.Vector3(0, 0.6, 0.8).normalize(),
    };
    const depth = 0.1;
    const protrusion = 0.4;
    const lift = 0.02;
    const seated = seatEyePosition(anchor, depth, protrusion, lift);

    const expected = anchor.point
      .clone()
      .addScaledVector(anchor.normal, depth * protrusion);
    expected.y += lift;
    expect(seated.distanceTo(expected)).toBeLessThan(1e-9);
  });
});

describe("eye orientation", () => {
  it.each(ids)("%s keeps the eye mostly upright", (id) => {
    const placed = placeEyesOnSilhouette(id);
    for (const eye of placed.eyes) {
      const quaternion = eyeQuaternion(eye, 0);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
      expect(up.y).toBeGreaterThan(0.7);
    }
  });

  it("applies opposite tilt to the two eyes", () => {
    const shape = eyeMoodShape("joy", false);
    expect(eyeTilt(shape, 0)).toBe(-shape.tilt);
    expect(eyeTilt(shape, 1)).toBe(shape.tilt);
  });
});
