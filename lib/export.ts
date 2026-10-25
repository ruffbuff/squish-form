import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { SilhouetteId } from "./types";

export function fileStamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

export function squishFilename(kind: "glb" | "png", silhouette: SilhouetteId, date = new Date()) {
  return `squish-${silhouette}-${fileStamp(date)}.${kind}`;
}

export async function exportAvatarGlb(root: THREE.Object3D, silhouette: SilhouetteId) {
  const exporter = new GLTFExporter();
  const clone = root.clone(true);
  clone.name = "squish";
  clone.position.set(0, 0, 0);
  clone.rotation.set(0, 0, 0);
  clone.scale.set(1, 1, 1);

  clone.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (object.name === "squish-pupil") {
      object.position.x = 0;
      object.position.y = 0;
    }
    if (object.name === "squish-eye") {
      const rest = object.userData.restScale as [number, number, number] | undefined;
      if (rest) object.scale.set(rest[0], rest[1], rest[2]);
    }
    if (!mesh.isMesh) return;
    mesh.geometry = mesh.geometry.clone();
    const source = mesh.material as THREE.MeshPhysicalMaterial;
    const material = source.clone();
    if (source.bumpMap) {
      material.bumpMap = source.bumpMap.clone();
      material.bumpMap.needsUpdate = true;
    }
    mesh.material = material;
  });

  const result = await exporter.parseAsync(clone, { binary: true });
  clone.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    const material = mesh.material as THREE.MeshPhysicalMaterial;
    material.bumpMap?.dispose();
    material.dispose();
  });
  const bytes = result instanceof ArrayBuffer ? result : new TextEncoder().encode(JSON.stringify(result));
  const blob = new Blob([bytes], { type: "model/gltf-binary" });
  downloadBlob(blob, squishFilename("glb", silhouette));
}

export function captureAvatarPng(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  silhouette: SilhouetteId,
) {
  const previousBackground = scene.background;
  const previousAlpha = gl.getClearAlpha();
  const previousColor = gl.getClearColor(new THREE.Color());

  scene.background = null;
  gl.setClearColor(0x000000, 0);
  gl.render(scene, camera);

  const dataUrl = gl.domElement.toDataURL("image/png");

  scene.background = previousBackground;
  gl.setClearColor(previousColor, previousAlpha);
  gl.render(scene, camera);

  downloadDataUrl(dataUrl, squishFilename("png", silhouette));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadDataUrl(url: string, filename: string) {
  triggerDownload(url, filename);
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
