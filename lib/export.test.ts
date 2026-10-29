import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { PNG_EXPORT_PIXEL_RATIO, prepareAvatarPngRestPose } from "./export";

describe("3D PNG export", () => {
  it("uses a fixed pixel ratio", () => {
    expect(PNG_EXPORT_PIXEL_RATIO).toBe(2);
  });

  it("captures and restores the avatar rest pose", () => {
    const root = new THREE.Group();
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1));
    eye.name = "squish-eye";
    eye.userData.restPosition = [0.1, 0.2, 0.3];
    eye.userData.restScale = [0.4, 0.5, 0.6];
    root.add(eye);
    root.position.set(1, 2, 3);
    root.rotation.set(0.2, 0.3, 0.4);
    root.scale.setScalar(1.4);
    eye.position.set(2, 3, 4);
    eye.scale.setScalar(1.7);

    const restore = prepareAvatarPngRestPose(root);
    expect(root.position.toArray()).toEqual([0, 0.02, 0]);
    expect(root.rotation.toArray().slice(0, 3)).toEqual([0, 0.38, 0]);
    expect(eye.position.toArray()).toEqual([0.1, 0.2, 0.3]);
    expect(eye.scale.toArray()).toEqual([0.4, 0.5, 0.6]);

    restore();
    expect(root.position.toArray()).toEqual([1, 2, 3]);
    expect(eye.position.toArray()).toEqual([2, 3, 4]);
    expect(eye.scale.toArray()).toEqual([1.7, 1.7, 1.7]);
    eye.geometry.dispose();
  });
});
