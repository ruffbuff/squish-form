import * as THREE from "three";
import type { ColorMode } from "./types";

/** Paints a two-stop gradient into vertex colors. Solid fills every vertex with the first stop. */
export function paintGradient(
  geometry: THREE.BufferGeometry,
  mode: ColorMode,
  colorA: string,
  colorB: string,
  angle: number,
  soft: boolean,
) {
  const position = geometry.attributes.position;
  // Reuse the existing buffer: randomizing colours must not allocate and
  // re-upload a fresh 90k-float array on every click.
  const existing = geometry.getAttribute("color") as THREE.BufferAttribute | undefined;
  const colors =
    existing && existing.array.length === position.count * 3
      ? (existing.array as Float32Array)
      : new Float32Array(position.count * 3);
  const first = new THREE.Color(colorA);
  const second = new THREE.Color(colorB);
  const axis = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
  const point = new THREE.Vector3();
  const mixed = new THREE.Color();
  let min = Infinity;
  let max = -Infinity;
  const projection = new Float32Array(position.count);

  for (let index = 0; index < position.count; index++) {
    point.fromBufferAttribute(position, index);
    const dot = point.dot(axis);
    projection[index] = dot;
    if (dot < min) min = dot;
    if (dot > max) max = dot;
  }

  const span = max - min || 1;
  for (let index = 0; index < position.count; index++) {
    let unit = (projection[index] - min) / span;
    if (mode === "solid") unit = 0;
    else if (!soft) unit = unit < 0.5 ? 0 : 1;
    else unit = unit * unit * (3 - 2 * unit);
    mixed.copy(first).lerp(second, unit);
    colors[index * 3] = mixed.r;
    colors[index * 3 + 1] = mixed.g;
    colors[index * 3 + 2] = mixed.b;
  }

  if (existing) {
    existing.needsUpdate = true;
  } else {
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
}
