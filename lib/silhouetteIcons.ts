import * as THREE from "three";
import { createSilhouetteGeometry } from "./silhouettes";
import type { SilhouetteId } from "./types";
import { SILHOUETTES } from "./silhouettes";

let pending: Promise<Record<SilhouetteId, string>> | null = null;

/** One shared matte material, no eyes, rendered once for the silhouette buttons. */
export function renderSilhouetteIcons() {
  if (pending) return pending;
  pending = Promise.resolve().then(() => {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(160, 140);
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight("#fff8f2", "#3a332c", 1.15));
    const key = new THREE.DirectionalLight("#fff6ee", 1.7);
    key.position.set(2.2, 3.2, 4);
    scene.add(key);
    const camera = new THREE.PerspectiveCamera(30, 160 / 140, 0.1, 20);
    camera.position.set(0.55, 0.28, 3.7);
    camera.lookAt(0, 0, 0);
    const material = new THREE.MeshPhysicalMaterial({
      color: "#e6d5cb",
      roughness: 0.62,
      clearcoat: 0.18,
      clearcoatRoughness: 0.4,
    });
    const images = {} as Record<SilhouetteId, string>;
    for (const { id } of SILHOUETTES) {
      const geometry = createSilhouetteGeometry(id, "smooth");
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.y = 0.45;
      scene.add(mesh);
      renderer.render(scene, camera);
      images[id] = renderer.domElement.toDataURL("image/png");
      scene.remove(mesh);
      geometry.dispose();
    }
    material.dispose();
    renderer.dispose();
    return images;
  });
  return pending;
}
