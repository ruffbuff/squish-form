import * as THREE from "three";
import type { EyeMood } from "./types";

export type EyeAnchor = {
  point: THREE.Vector3;
  normal: THREE.Vector3;
};

export type EyeMoodShape = {
  sx: number;
  sy: number;
  sz: number;
  lift: number;
};

/** Scale factors on top of the eye-size radius. Lift is in radii. */
export function eyeMoodShape(mood: EyeMood, oval: boolean): EyeMoodShape {
  const base: EyeMoodShape = {
    sx: oval ? 1.55 : 0.82,
    sy: oval ? 0.72 : 0.82,
    sz: oval ? 0.9 : 0.82,
    lift: 0,
  };
  if (mood === "joy") {
    return { sx: base.sx * 1.28, sy: base.sy * 0.36, sz: base.sz, lift: 0.42 };
  }
  if (mood === "sleep") {
    return { sx: base.sx * 1.12, sy: Math.max(base.sy * 0.14, 0.1), sz: base.sz * 0.8, lift: -0.06 };
  }
  if (mood === "wow") {
    return { sx: oval ? 1.15 : 1.2, sy: oval ? 1.25 : 1.28, sz: oval ? 1.05 : 1.2, lift: 0.3 };
  }
  return base;
}

export function placeEyes(geometry: THREE.BufferGeometry): { eyes: [EyeAnchor, EyeAnchor]; radius: number } {
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  const box = geometry.boundingBox ?? new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const spread = THREE.MathUtils.clamp(size.x * 0.16, 0.12, 0.32);
  const y = center.y + size.y * 0.05;
  const radius = THREE.MathUtils.clamp(Math.min(size.x, size.y, size.z) * 0.055, 0.038, 0.062);
  const probe = new THREE.Mesh(geometry);
  const raycaster = new THREE.Raycaster();

  const seek = (x: number): EyeAnchor => {
    const heights = [y, y + size.y * 0.1, y - size.y * 0.12, center.y];
    for (const yTry of heights) {
      raycaster.set(new THREE.Vector3(x, yTry, box.max.z + 2), new THREE.Vector3(0, 0, -1));
      for (const hit of raycaster.intersectObject(probe)) {
        const normal = (hit.normal ?? hit.face?.normal ?? new THREE.Vector3(0, 0, 1)).clone().normalize();
        if (normal.z < 0.4) continue;
        return { point: hit.point.clone(), normal };
      }
    }
    return { point: new THREE.Vector3(x, y, box.max.z), normal: new THREE.Vector3(0, 0, 1) };
  };

  return { eyes: [seek(-spread), seek(spread)], radius };
}
