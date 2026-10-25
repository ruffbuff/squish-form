import * as THREE from "three";
import { EYE_INSET_DEFAULT, eyeMoodShape, eyeProtrusion, eyeQuaternion, eyeTilt, placeEyes, seatEyePosition } from "./eyes";
import { createAvatarMaterial, type MaterialFinish } from "./materials";
import { createSilhouetteGeometry, SILHOUETTES } from "./silhouettes";
import type { MaterialId, SilhouetteId } from "./types";

const SHOWCASE: Record<SilhouetteId, { color: string; material: MaterialId }> = {
  blob: { color: "#ec0dff", material: "jelly" },
  bean: { color: "#40ea34", material: "matte" },
  squircle: { color: "#7ec8ff", material: "gloss" },
  pear: { color: "#ffd166", material: "jelly" },
  pill: { color: "#f08a78", material: "matte" },
  bun: { color: "#c084fc", material: "gloss" },
  mochi: { color: "#fb7185", material: "jelly" },
  bud: { color: "#34d399", material: "matte" },
};

let pending: Promise<Record<SilhouetteId, string>> | null = null;

/** Each silhouette in its own color and material, with eyes. Shared camera and lights. */
export function renderSilhouetteIcons() {
  if (pending) return pending;
  pending = Promise.resolve().then(() => {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(180, 156);
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight("#fff8f2", "#3a332c", 1.2));
    const key = new THREE.DirectionalLight("#fff6ee", 1.8);
    key.position.set(2.2, 3.2, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight("#d7e4ff", 0.55);
    fill.position.set(-3, 1.2, 2);
    scene.add(fill);
    const camera = new THREE.PerspectiveCamera(30, 180 / 156, 0.1, 20);
    camera.position.set(0.55, 0.28, 3.7);
    camera.lookAt(0, 0, 0);
    const eyeGeometry = new THREE.SphereGeometry(1, 14, 12);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: "#100e0c", roughness: 0.35 });
    const images = {} as Record<SilhouetteId, string>;
    const finish: MaterialFinish = { flat: false, vertexColors: false, secondary: "#ffffff", rim: 0.12 };

    for (const { id } of SILHOUETTES) {
      const showcase = SHOWCASE[id];
      const geometry = createSilhouetteGeometry(id, "smooth");
      const material = createAvatarMaterial(showcase.material, showcase.color, {
        ...finish,
        secondary: showcase.color,
      });
      if (material.transmission > 0.4) {
        material.transmission = 0.32;
        material.thickness = 0.7;
      }
      const body = new THREE.Mesh(geometry, material);
      body.rotation.y = 0.45;
      const anchors = placeEyes(geometry, id);
      const radius = anchors.radius * 1.25;
      const shape = eyeMoodShape("calm", false);
      const protrusion = eyeProtrusion(EYE_INSET_DEFAULT, anchors.sink);
      anchors.eyes.forEach((anchor, index) => {
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        const depth = radius * shape.sz;
        eye.position.copy(seatEyePosition(anchor, depth, protrusion, radius * shape.lift));
        eye.scale.set(radius * shape.sx, radius * shape.sy, radius * shape.sz);
        eye.quaternion.copy(eyeQuaternion(anchor, eyeTilt(shape, index)));
        body.add(eye);
      });
      scene.add(body);
      renderer.render(scene, camera);
      images[id] = renderer.domElement.toDataURL("image/png");
      scene.remove(body);
      geometry.dispose();
      material.dispose();
    }

    eyeGeometry.dispose();
    eyeMaterial.dispose();
    renderer.dispose();
    return images;
  });
  return pending;
}
