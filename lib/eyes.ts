import * as THREE from "three";
import { createSilhouetteGeometry } from "./silhouettes";
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
  /** Eye center box used to keep look-around from walking off the hull. */
  spread: number;
  eyeY: number;
  verticalBudget: number;
};

/** Slider default. 0 leaves the eyes proud, 1 sinks them. */
export const EYE_INSET_DEFAULT = 0.62;
export const EYE_POLY_LIFT = 0.14;
export const EYE_POLY_DEPTH_SCALE = 0.86;

/**
 * Fraction of this eye's own depth (radius × mood depth scale).
 * Positive sits the center proud of the skin. Negative sinks it.
 * The value is a fraction of the eye that is actually drawn, so a flat
 * sleep lid is not pushed completely behind the surface.
 */
export function eyeProtrusion(inset: number, sink: number) {
  const t = THREE.MathUtils.clamp(inset, 0, 1);
  // 0 is a dome on the skin. 1 leaves a shallow cap. Default is seated.
  // Curved silhouettes bury the eye a little, but never enough to clip it.
  return THREE.MathUtils.lerp(0.45, -0.3, t) - sink * 0.15;
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
  bud: { y: 0.13, spread: 0.14, sink: 0.02 },
};

/** Scale factors on top of the eye-size radius. The still pose has to read with no motion. */
export function eyeMoodShape(mood: EyeMood, oval: boolean): EyeMoodShape {
  if (mood === "joy") {
    return oval
      ? { sx: 1.82, sy: 0.34, sz: 0.7, lift: 0, tilt: 0.78 }
      : { sx: 1.48, sy: 0.28, sz: 0.64, lift: 0, tilt: 0.82 };
  }
  if (mood === "sleep") {
    return oval
      ? { sx: 1.68, sy: 0.12, sz: 0.44, lift: -0.26, tilt: -0.38 }
      : { sx: 1.28, sy: 0.1, sz: 0.42, lift: -0.24, tilt: -0.44 };
  }
  if (mood === "wow") {
    return oval
      ? { sx: 1.22, sy: 1.95, sz: 1.02, lift: 0, tilt: 0 }
      : { sx: 1.08, sy: 1.72, sz: 1.02, lift: 0, tilt: 0 };
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
 * Offset along the local surface normal so a turned silhouette does not
 * swallow one eye while leaving the other proud.
 */
export function seatEyePosition(anchor: EyeAnchor, depth: number, protrusion: number, lift: number) {
  const position = anchor.point.clone().addScaledVector(anchor.normal, depth * protrusion);
  position.y += lift;
  return position;
}

export function eyeLookBounds(placed: PlacedEyes, shape: EyeMoodShape) {
  const halfX = placed.radius * shape.sx;
  const halfY = placed.radius * shape.sy;
  const horizontalRoom = Math.max(0, placed.spread - halfX);
  const verticalRoom = Math.max(0, placed.verticalBudget - halfY);
  return {
    minX: -horizontalRoom,
    maxX: horizontalRoom,
    minY: placed.eyeY - verticalRoom,
    maxY: placed.eyeY + verticalRoom,
  };
}

const FORWARD = new THREE.Vector3(0, 0, 1);
const alignScratch = new THREE.Quaternion();
const tiltScratch = new THREE.Quaternion();
const facingScratch = new THREE.Vector3();

/**
 * Eye local +Z follows the skin, but only partway. Fully following a rim
 * normal turns the eye broadside at the silhouette edge, where it reads as a
 * detached black oval. Keeping it mostly forward makes it edge-on there and
 * only slightly proud of the outline.
 */
export function eyeQuaternion(anchor: EyeAnchor, tilt: number, target = new THREE.Quaternion()) {
  facingScratch.copy(anchor.normal).multiplyScalar(0.45).addScaledVector(FORWARD, 0.7).normalize();
  alignScratch.setFromUnitVectors(FORWARD, facingScratch);
  tiltScratch.setFromAxisAngle(facingScratch, tilt);
  return target.copy(tiltScratch).multiply(alignScratch);
}

/**
 * Front-facing vertices near a per-silhouette target.
 * A ray along -Z used to land on the brow, and the old offset then
 * pushed a full sphere out along that tilted normal.
 */
// Anchors are immutable after placement. Smooth hull generation is expensive
// (144×108 sphere), and the stage, still preview and silhouette grid all ask
// for the same silhouette, so build each pair once per session.
const anchorCache = new Map<SilhouetteId, PlacedEyes>();

/** Eye anchors from the smooth hull so poly facets do not shove eyes sideways. */
export function placeEyesOnSilhouette(id: SilhouetteId): PlacedEyes {
  const cached = anchorCache.get(id);
  if (cached) return cached;
  const smooth = createSilhouetteGeometry(id, "smooth");
  const placed = placeEyes(smooth, id);
  smooth.dispose();
  anchorCache.set(id, placed);
  return placed;
}

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

  const seek = (x: number, minFacing: number): EyeAnchor | null => {
    let best = -Infinity;
    let anchor: EyeAnchor | null = null;
    for (let i = 0; i < position.count; i++) {
      normal.fromBufferAttribute(normals, i);
      if (normal.z < minFacing) continue;
      vertex.fromBufferAttribute(position, i);
      const dx = (vertex.x - x) / Math.max(size.x * 0.22, 0.14);
      const dy = (vertex.y - y) / Math.max(size.y * 0.12, 0.09);
      const score = normal.z * 2.1 - dx * dx * 2.4 - dy * dy * 4.2 + vertex.z * 0.08;
      if (score > best) {
        best = score;
        anchor = { point: vertex.clone(), normal: normal.clone() };
      }
    }
    if (anchor) anchor.normal.normalize();
    return anchor;
  };

  // Both eyes must use the same facing threshold. Searching each side
  // independently let one eye fall back a level while the other did not,
  // which produced a lopsided pair on flat shapes such as mochi.
  let pair: [EyeAnchor, EyeAnchor] | null = null;
  for (const minFacing of [0.62, 0.34, 0.06, -0.28, -1]) {
    const left = seek(-spread, minFacing);
    const right = seek(spread, minFacing);
    if (left && right && left.point.z > 0 && right.point.z > 0) {
      pair = [left, right];
      break;
    }
  }

  if (!pair) {
    const fallback: EyeAnchor = {
      point: new THREE.Vector3(-spread, y, box.max.z),
      normal: new THREE.Vector3(0, 0, 1),
    };
    pair = [fallback, mirrorAnchor(fallback)];
  }

  // Enforce an exact mirrored pair. The hull is symmetric, so keeping the
  // side that faces the camera best and mirroring it avoids small vertex
  // placement differences turning into visible lopsidedness.
  const [left, right] = pair;
  const keepLeft = left.normal.z >= right.normal.z;
  const eyes: [EyeAnchor, EyeAnchor] = keepLeft
    ? [left, mirrorAnchor(left)]
    : [mirrorAnchor(right), right];

  return {
    eyes,
    radius,
    sink: layout.sink,
    spread,
    eyeY: y,
    verticalBudget: size.y * 0.12,
  };
}

function mirrorAnchor(anchor: EyeAnchor): EyeAnchor {
  return {
    point: new THREE.Vector3(-anchor.point.x, anchor.point.y, anchor.point.z),
    normal: new THREE.Vector3(-anchor.normal.x, anchor.normal.y, anchor.normal.z),
  };
}
