import * as THREE from "three";
import type { EyeMood, SilhouetteId } from "./types";

export type EyeAnchor = {
  point: THREE.Vector3;
  normal: THREE.Vector3;
};

export type EyeMoodShape = {
  sx: number;
  sy: number;
  sz: number;
  /** Static lift along Y, in eye radii. */
  lift: number;
  /**
   * Radians. Positive tilts the outer corners up (joy).
   * Negative droops them (sleep). Applied with opposite signs per eye.
   */
  tilt: number;
};

export type EyeMotion = {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  /** Extra hop along Y, in eye radii. */
  bob: number;
};

export type PlacedEyes = {
  eyes: [EyeAnchor, EyeAnchor];
  radius: number;
  /** Extra burial in radii. Curved silhouettes need more so the dome stays nested. */
  sink: number;
};

/** Slider default. 0 leaves the eyes proud, 1 sinks them. */
export const EYE_INSET_DEFAULT = 0.62;

/**
 * Fraction of this eye's own depth (radius × mood depth scale).
 * Positive sits the center proud of the skin. Negative sinks it.
 * The value is a fraction of the eye that is actually drawn, so a flat
 * sleep lid is not pushed completely behind the surface.
 */
export function eyeProtrusion(inset: number, sink: number) {
  const t = THREE.MathUtils.clamp(inset, 0, 1);
  // 0 is a dome on the skin. 1 leaves a shallow cap. Default is seated.
  return THREE.MathUtils.lerp(0.05, -0.58, t) - sink;
}

type EyeLayout = { y: number; spread: number; sink: number };

/**
 * y and spread are fractions of the fitted size.
 * sink is extra radii buried on top of the slider, for curvature.
 */
const LAYOUT: Record<SilhouetteId, EyeLayout> = {
  blob: { y: 0.08, spread: 0.16, sink: 0.05 },
  bean: { y: 0.08, spread: 0.16, sink: 0.02 },
  squircle: { y: 0.04, spread: 0.18, sink: 0.0 },
  pear: { y: 0.06, spread: 0.14, sink: 0.04 },
  pill: { y: 0.02, spread: 0.16, sink: 0.0 },
  bun: { y: 0.06, spread: 0.15, sink: 0.02 },
  mochi: { y: 0.04, spread: 0.18, sink: 0.0 },
  bud: { y: -0.02, spread: 0.15, sink: 0.08 },
};

/** Scale factors on top of the eye-size radius. The still pose has to read with no motion. */
export function eyeMoodShape(mood: EyeMood, oval: boolean): EyeMoodShape {
  if (mood === "joy") {
    return oval
      ? { sx: 1.72, sy: 0.4, sz: 0.72, lift: 0.12, tilt: 0.62 }
      : { sx: 1.38, sy: 0.32, sz: 0.66, lift: 0.14, tilt: 0.7 };
  }
  if (mood === "sleep") {
    return oval
      ? { sx: 1.62, sy: 0.16, sz: 0.48, lift: -0.22, tilt: -0.28 }
      : { sx: 1.22, sy: 0.14, sz: 0.46, lift: -0.2, tilt: -0.34 };
  }
  if (mood === "wow") {
    return oval
      ? { sx: 1.22, sy: 1.95, sz: 1.02, lift: 0.06, tilt: 0 }
      : { sx: 1.08, sy: 1.72, sz: 1.02, lift: 0.08, tilt: 0 };
  }
  return oval
    ? { sx: 1.48, sy: 0.86, sz: 0.8, lift: 0, tilt: 0 }
    : { sx: 0.9, sy: 0.9, sz: 0.78, lift: 0, tilt: 0 };
}

/**
 * Loop on top of the still pose.
 * `damp` is 1 in the viewport and lower while follow-cursor is on.
 */
export function eyeMoodMotion(mood: EyeMood, time: number, damp = 1): EyeMotion {
  const still: EyeMotion = { scaleX: 1, scaleY: 1, scaleZ: 1, bob: 0 };
  if (mood === "joy") {
    const wave = Math.sin(time * 5.4);
    const up = Math.max(wave, 0);
    return {
      scaleX: 1 + up * 0.24 * damp,
      scaleY: 1 - (0.5 + 0.5 * wave) * 0.7 * damp,
      scaleZ: 1,
      bob: up * up * 1.6 * damp,
    };
  }
  if (mood === "sleep") {
    const breath = 0.5 + 0.5 * Math.sin(time * 1.7);
    // The still pose is a slit. The open half of the breath reaches a calm eye.
    return {
      scaleX: 1 + breath * 0.05 * damp,
      scaleY: 2.1 + breath * 6.4 * damp,
      scaleZ: 1,
      bob: (breath - 0.5) * 0.35 * damp,
    };
  }
  if (mood === "wow") {
    const cycle = time % 2.15;
    let pop = 1;
    const amp = 0.55 * damp;
    if (cycle < 0.14) pop = 1 + (cycle / 0.14) * amp;
    else if (cycle < 0.52) pop = 1 + amp;
    else if (cycle < 0.92) {
      const u = (cycle - 0.52) / 0.4;
      pop = 1 + (1 - u * u * (3 - 2 * u)) * amp;
    }
    return { scaleX: pop, scaleY: pop, scaleZ: 1 + (pop - 1) * 0.25, bob: Math.max(pop - 1, 0) * 0.45 };
  }
  return still;
}

/** 1 is open. Calm only. */
export function calmBlink(
  state: { next: number; time: number },
  time: number,
  delta: number,
  damp = 1,
) {
  if (state.time < 0 && time >= state.next) state.time = 0;
  if (state.time < 0) return 1;
  state.time += delta;
  const unit = state.time / 0.18;
  if (unit >= 1) {
    state.time = -1;
    state.next = time + 2.4 + Math.random() * 2.6;
    return 1;
  }
  return 1 - Math.sin(Math.min(unit, 1) * Math.PI) * 0.94 * damp;
}

export function eyeTilt(shape: EyeMoodShape, index: number) {
  return (index === 0 ? -1 : 1) * shape.tilt;
}

/**
 * Seated center, before look-around and mood bob.
 * `depth` is how far this eye extends forward (its Z half-extent).
 * `protrusion` is a fraction of that depth, and `lift` is world units on Y.
 * Depth moves straight along the form's front axis. Sliding along a tilted
 * surface normal pushes the eyes off the cheek.
 */
export function seatEyePosition(anchor: EyeAnchor, depth: number, protrusion: number, lift: number) {
  const position = anchor.point.clone();
  position.z += depth * protrusion;
  position.y += lift;
  return position;
}

/**
 * Front-facing vertices near a per-silhouette target.
 * A ray along -Z used to land on the brow, and the old offset then
 * pushed a full sphere out along that tilted normal.
 */
export function placeEyes(geometry: THREE.BufferGeometry, id: SilhouetteId): PlacedEyes {
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  const box = geometry.boundingBox ?? new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const layout = LAYOUT[id];
  const spread = THREE.MathUtils.clamp(size.x * layout.spread, 0.1, 0.38);
  const y = center.y + size.y * layout.y;
  const profile = Math.sqrt(Math.max(size.x, 0.001) * Math.max(size.y, 0.001));
  const radius = THREE.MathUtils.clamp(profile * 0.036, 0.048, 0.066);
  const position = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();

  const seek = (x: number, minFacing: number): EyeAnchor => {
    let best = -Infinity;
    let point = new THREE.Vector3(x, y, box.max.z);
    let found = new THREE.Vector3(0, 0, 1);
    let hit = false;
    for (let i = 0; i < position.count; i++) {
      normal.fromBufferAttribute(normals, i);
      if (normal.z < minFacing) continue;
      vertex.fromBufferAttribute(position, i);
      const dx = (vertex.x - x) / Math.max(size.x * 0.32, 0.18);
      const dy = (vertex.y - y) / Math.max(size.y * 0.14, 0.1);
      const score = normal.z * 1.4 - dx * dx * 1.7 - dy * dy * 3.1 + vertex.z * 0.12;
      if (score > best) {
        best = score;
        point = vertex.clone();
        found = normal.clone();
        hit = true;
      }
    }
    if (!hit) {
      if (minFacing <= 0.2) return { point, normal: found };
      return seek(x, minFacing - 0.28);
    }
    return { point, normal: found.normalize() };
  };

  return { eyes: [seek(-spread, 0.62), seek(spread, 0.62)], radius, sink: layout.sink };
}
