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

export function glinaFilename(kind: "glb" | "png", silhouette: SilhouetteId, date = new Date()) {
  return `glina-${silhouette}-${fileStamp(date)}.${kind}`;
}

export async function exportAvatarGlb(mesh: THREE.Mesh, silhouette: SilhouetteId) {
  const exporter = new GLTFExporter();
  const sourceMaterial = mesh.material as THREE.MeshPhysicalMaterial;
  const material = sourceMaterial.clone();
  if (sourceMaterial.bumpMap) {
    material.bumpMap = sourceMaterial.bumpMap.clone();
    material.bumpMap.needsUpdate = true;
  }
  const exportMesh = new THREE.Mesh(mesh.geometry.clone(), material);
  exportMesh.name = "glina";
  exportMesh.position.set(0, 0, 0);
  exportMesh.rotation.set(0, 0, 0);
  exportMesh.scale.set(1, 1, 1);

  const result = await exporter.parseAsync(exportMesh, { binary: true });
  exportMesh.geometry.dispose();
  material.bumpMap?.dispose();
  material.dispose();
  const bytes = result instanceof ArrayBuffer ? result : new TextEncoder().encode(JSON.stringify(result));
  const blob = new Blob([bytes], { type: "model/gltf-binary" });
  downloadBlob(blob, glinaFilename("glb", silhouette));
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

  downloadDataUrl(dataUrl, glinaFilename("png", silhouette));
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
