import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createSilhouetteGeometry, SILHOUETTES } from "./silhouettes";
import type { SilhouetteId } from "./types";

const ids = SILHOUETTES.map((item) => item.id);

function bbox(id: SilhouetteId) {
  const geometry = createSilhouetteGeometry(id, "smooth");
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const position = geometry.attributes.position;
  return { geometry, box, position };
}

describe("silhouette cache", () => {
  it("hands out independent clones that survive disposal", () => {
    const first = createSilhouetteGeometry("bud", "smooth");
    const second = createSilhouetteGeometry("bud", "smooth");
    expect(first).not.toBe(second);
    first.computeBoundingBox();
    second.computeBoundingBox();
    expect(first.boundingBox!.getSize(new THREE.Vector3()).toArray()).toEqual(
      second.boundingBox!.getSize(new THREE.Vector3()).toArray(),
    );
    first.dispose();
    const third = createSilhouetteGeometry("bud", "smooth");
    expect(third.attributes.position.count).toBeGreaterThan(0);
    third.dispose();
    second.dispose();
  });
});

describe("silhouette geometry", () => {
  it.each(ids)("%s is centered, unit-fit and free of NaN", (id) => {
    const { geometry, box, position } = bbox(id);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    expect(Math.abs(center.x)).toBeLessThan(0.01);
    expect(Math.abs(center.y)).toBeLessThan(0.01);
    expect(Math.abs(center.z)).toBeLessThan(0.01);
    expect(Math.max(size.x, size.y, size.z)).toBeCloseTo(2, 1);
    for (let i = 0; i < position.count; i += 1) {
      expect(Number.isFinite(position.getX(i))).toBe(true);
      expect(Number.isFinite(position.getY(i))).toBe(true);
      expect(Number.isFinite(position.getZ(i))).toBe(true);
    }
    geometry.dispose();
  });

  it.each(ids.filter((id) => id !== "blob"))("%s is mirrored around the Y axis", (id) => {
    const { geometry, position } = bbox(id);
    const key = (x: number, y: number, z: number) =>
      `${Math.round(x * 1000)}|${Math.round(y * 1000)}|${Math.round(z * 1000)}`;
    const seen = new Set<string>();
    for (let i = 0; i < position.count; i += 1) {
      seen.add(key(position.getX(i), position.getY(i), position.getZ(i)));
    }
    let missing = 0;
    for (let i = 0; i < position.count; i += 1) {
      const mirrored = key(-position.getX(i), position.getY(i), position.getZ(i));
      if (!seen.has(mirrored)) missing += 1;
    }
    // A handful of seam vertices may round differently; a real asymmetry is
    // hundreds of missing mirrors.
    expect(missing / position.count).toBeLessThan(0.01);
    geometry.dispose();
  });

  it("blob wobble stays a subtle organic offset, not an asymmetric shape", () => {
    const { geometry, position } = bbox("blob");
    const cell = 0.04;
    const key = (x: number, y: number, z: number) =>
      `${Math.round(x / cell)}|${Math.round(y / cell)}|${Math.round(z / cell)}`;
    const cells = new Map<string, THREE.Vector3[]>();
    for (let i = 0; i < position.count; i += 1) {
      const p = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i));
      const k = key(p.x, p.y, p.z);
      const list = cells.get(k) ?? [];
      list.push(p);
      cells.set(k, list);
    }
    const target = new THREE.Vector3();
    let unsupported = 0;
    for (let i = 0; i < position.count; i += 1) {
      target.set(-position.getX(i), position.getY(i), position.getZ(i));
      const cx = Math.round(target.x / cell);
      const cy = Math.round(target.y / cell);
      const cz = Math.round(target.z / cell);
      let found = false;
      for (let dx = -1; dx <= 1 && !found; dx += 1) {
        for (let dy = -1; dy <= 1 && !found; dy += 1) {
          for (let dz = -1; dz <= 1 && !found; dz += 1) {
            const list = cells.get(`${cx + dx}|${cy + dy}|${cz + dz}`) ?? [];
            found = list.some((p) => p.distanceTo(target) < 0.05);
          }
        }
      }
      if (!found) unsupported += 1;
    }
    expect(unsupported / position.count).toBeLessThan(0.02);
    geometry.dispose();
  });

  it.each(["pear", "bud"] as const)("%s has no horizontal collar at eye height", (id) => {
    const { geometry, position } = bbox(id);
    const buckets = new Map<number, number>();
    for (let i = 0; i < position.count; i += 1) {
      const y = position.getY(i);
      const radial = Math.hypot(position.getX(i), position.getZ(i));
      const bucket = Math.round(y / 0.05);
      buckets.set(bucket, Math.max(buckets.get(bucket) ?? 0, radial));
    }
    const rows = [...buckets.entries()]
      .filter(([bucket]) => Math.abs(bucket * 0.05) < 0.45)
      .sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < rows.length; i += 1) {
      const [prevY, prev] = rows[i - 1];
      const [nextY, next] = rows[i];
      if (nextY !== prevY + 1) continue;
      // A collar shows up as a sharp step in the widest radius between two
      // neighbouring height slices.
      expect(Math.abs(next - prev)).toBeLessThan(0.08);
    }
    geometry.dispose();
  });
});
