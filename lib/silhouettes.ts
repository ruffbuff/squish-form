import * as THREE from "three";
import type { QualityTier, SilhouetteId } from "./types";

export const SILHOUETTES: { id: SilhouetteId; label: string }[] = [
  { id: "blob", label: "Капля" },
  { id: "bean", label: "Боб" },
  { id: "squircle", label: "Сквиркл" },
  { id: "pear", label: "Груша" },
  { id: "pill", label: "Капсула" },
  { id: "bun", label: "Пышка" },
];

/** Icosphere detail. No UV-sphere poles, so gloss and jelly do not pick up a meridian seam. */
const DETAIL: Record<QualityTier, number> = {
  0: 1,
  1: 3,
  2: 4,
};

/**
 * Closed icosphere, displaced into a soft silhouette.
 * Vertices are then recentered so every form frames the same way.
 */
export function createSilhouetteGeometry(id: SilhouetteId, tier: QualityTier = 2): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(1, DETAIL[tier]);
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const shaped = shapeVertex(id, vertex);
    position.setXYZ(i, shaped.x, shaped.y, shaped.z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  centerAndFit(geometry, 1);
  return geometry;
}

function shapeVertex(id: SilhouetteId, vertex: THREE.Vector3): THREE.Vector3 {
  if (id === "blob") return shapeBlob(vertex);
  if (id === "bean") return shapeBean(vertex);
  if (id === "squircle") return shapeSquircle(vertex);
  if (id === "pear") return shapePear(vertex);
  if (id === "pill") return shapePill(vertex);
  return shapeBun(vertex);
}

/** Rounded drop: full belly low, soft taper toward the top. */
function shapeBlob(vertex: THREE.Vector3): THREE.Vector3 {
  const dir = vertex.clone().normalize();
  const y = dir.y;
  const t = (y + 1) / 2;
  const circle = Math.sqrt(Math.max(0, 1 - y * y));
  const skewed = Math.sin(Math.PI * Math.pow(t, 0.42));
  const blend = THREE.MathUtils.smoothstep(y, -0.7, 0.2);
  let radius = circle * (1 - blend) + skewed * blend;
  if (y < -0.35) {
    const cap = Math.sqrt(Math.max(0, 1 - ((y + 0.05) / 0.95) ** 2));
    radius = Math.max(radius, cap * 0.96);
  }
  const wobble = fbm(dir.x * 1.7, dir.y * 1.6, dir.z * 1.7);
  radius *= 1 + wobble * 0.022;
  const horizontal = Math.hypot(dir.x, dir.z) || 1;
  return new THREE.Vector3((dir.x / horizontal) * radius, y * 1.22, (dir.z / horizontal) * radius);
}

/**
 * Bean: a flat ellipsoid with the ends lifted and a notch taken out of
 * the inner long edge, so the front view reads as a kidney rather than an egg.
 */
function shapeBean(vertex: THREE.Vector3): THREE.Vector3 {
  const dir = vertex.clone().normalize();
  const x = dir.x * 1.38;
  let y = dir.y * 0.7;
  const z = dir.z * 0.48;
  y += 0.28 * x * x;
  const middle = Math.exp(-(x * x) / 0.28);
  const innerEdge = THREE.MathUtils.smoothstep(y, 0.02, 0.55);
  y -= middle * innerEdge * 0.5;
  return new THREE.Vector3(x, y, z);
}

/**
 * Pear: round belly low, a gentle neck, and a dome tip.
 * Radius follows the hemisphere profile so the top closes instead of flattening into a cap.
 */
function shapePear(vertex: THREE.Vector3): THREE.Vector3 {
  const dir = vertex.clone().normalize();
  const y = dir.y;
  const round = Math.sqrt(Math.max(0, 1 - y * y));
  const belly = 1 + 0.34 * THREE.MathUtils.smoothstep(y, 0.15, -0.8);
  const neck = 1 - 0.4 * THREE.MathUtils.smoothstep(y, -0.02, 0.62);
  const radius = round * belly * neck;
  const horizontal = Math.hypot(dir.x, dir.z) || 1;
  return new THREE.Vector3((dir.x / horizontal) * radius, y * 1.2, (dir.z / horizontal) * radius);
}

/** Capsule lying on its side: round ends, straight soft middle. */
function shapePill(vertex: THREE.Vector3): THREE.Vector3 {
  const dir = vertex.clone().normalize();
  const along = dir.x;
  const cap = THREE.MathUtils.smoothstep(Math.abs(along), 0.25, 0.92);
  const x = along * (1.55 - cap * 0.72);
  const thickness = 0.58 + cap * 0.08;
  return new THREE.Vector3(x, dir.y * thickness, dir.z * thickness);
}

/** Plump bun. The top dip stays shallow so it never reads as a hole. */
function shapeBun(vertex: THREE.Vector3): THREE.Vector3 {
  const dir = vertex.clone().normalize();
  const radial = Math.hypot(dir.x, dir.z);
  let y = dir.y * 0.7;
  if (dir.y > 0.15) {
    const dent = Math.exp(-(radial * radial) / 0.28) * 0.07 * THREE.MathUtils.smoothstep(dir.y, 0.2, 0.7);
    y -= dent;
  } else if (dir.y < 0) {
    y *= 0.9;
  }
  return new THREE.Vector3(dir.x * 1.14, y, dir.z * 1.14);
}

/** Soft square: unit direction pulled onto an L4 superellipsoid, then pillowed. */
function shapeSquircle(vertex: THREE.Vector3): THREE.Vector3 {
  const dir = vertex.clone().normalize();
  const n = 3.5;
  const norm =
    Math.abs(dir.x) ** n + Math.abs(dir.y) ** n + Math.abs(dir.z) ** n;
  const point = dir.multiplyScalar(1 / Math.max(norm ** (1 / n), 1e-5));
  point.y *= 0.92;
  point.x *= 1.04;
  point.z *= 1.04;
  return point;
}

/** Match the longest axis so a drop, a bean, and a squircle share one frame. */
function centerAndFit(geometry: THREE.BufferGeometry, halfExtent: number) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;
  const center = box.getCenter(new THREE.Vector3());
  geometry.translate(-center.x, -center.y, -center.z);
  const size = box.getSize(new THREE.Vector3());
  const extent = Math.max(size.x, size.y, size.z) || 1;
  const fit = (halfExtent * 2) / extent;
  geometry.scale(fit, fit, fit);
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  const positions = geometry.attributes.position;
  const normal = new THREE.Vector3();
  const point = new THREE.Vector3();
  for (let i = 0; i < normals.count; i++) {
    normal.fromBufferAttribute(normals, i);
    if (normal.lengthSq() < 1e-6) {
      point.fromBufferAttribute(positions, i);
      if (point.lengthSq() < 1e-8) point.set(0, 1, 0);
      else point.normalize();
      normals.setXYZ(i, point.x, point.y, point.z);
    } else {
      normal.normalize();
      normals.setXYZ(i, normal.x, normal.y, normal.z);
    }
  }
  normals.needsUpdate = true;
  geometry.computeBoundingSphere();
}

function hash(ix: number, iy: number, iz: number) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(iz, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(x: number, y: number, z: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const xf = x - x0;
  const yf = y - y0;
  const zf = z - z0;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = zf * zf * (3 - 2 * zf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const sample = (dx: number, dy: number, dz: number) =>
    hash(x0 + dx, y0 + dy, z0 + dz);

  const x00 = lerp(sample(0, 0, 0), sample(1, 0, 0), u);
  const x10 = lerp(sample(0, 1, 0), sample(1, 1, 0), u);
  const x01 = lerp(sample(0, 0, 1), sample(1, 0, 1), u);
  const x11 = lerp(sample(0, 1, 1), sample(1, 1, 1), u);
  const y0v = lerp(x00, x10, v);
  const y1v = lerp(x01, x11, v);
  return lerp(y0v, y1v, w) * 2 - 1;
}

function fbm(x: number, y: number, z: number) {
  return (
    valueNoise(x, y, z) * 0.65 +
    valueNoise(x * 2.1, y * 2.1, z * 2.1) * 0.35
  );
}
