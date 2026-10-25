import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { avatarComponentSource, packReadme } from "./projectPack";
import type { IdleId, SilhouetteId } from "./types";
import { createZip } from "./zip";

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

export async function buildAvatarGlb(root: THREE.Object3D) {
  const exporter = new GLTFExporter();
  const clone = root.clone(true);
  clone.name = "squish";
  clone.position.set(0, 0, 0);
  clone.rotation.set(0, 0, 0);
  clone.scale.set(1, 1, 1);

  clone.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (object.name === "squish-eye") {
      const rest = object.userData.restScale as [number, number, number] | undefined;
      const origin = object.userData.restPosition as [number, number, number] | undefined;
      if (rest) object.scale.set(rest[0], rest[1], rest[2]);
      if (origin) object.position.set(origin[0], origin[1], origin[2]);
    }
    if (!mesh.isMesh) return;
    mesh.geometry = mesh.geometry.clone();
    const source = mesh.material as THREE.MeshStandardMaterial;
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
    const material = mesh.material as THREE.MeshStandardMaterial;
    material.bumpMap?.dispose();
    material.dispose();
  });
  return result instanceof ArrayBuffer ? new Uint8Array(result) : new TextEncoder().encode(JSON.stringify(result));
}

export async function exportAvatarGlb(root: THREE.Object3D, silhouette: SilhouetteId) {
  const bytes = await buildAvatarGlb(root);
  downloadBlob(new Blob([bytes], { type: "model/gltf-binary" }), squishFilename("glb", silhouette));
}

export async function exportProjectPack(
  root: THREE.Object3D,
  silhouette: SilhouetteId,
  idle: IdleId,
  follow: boolean,
  tap: boolean,
  speed: number,
  smoothness: number,
) {
  const glb = await buildAvatarGlb(root);
  const encoder = new TextEncoder();
  const zip = createZip([
    { name: "squish-avatar/avatar.glb", data: glb },
    {
      name: "squish-avatar/squish-avatar.tsx",
      data: encoder.encode(avatarComponentSource(idle, follow, tap, speed, smoothness)),
    },
    { name: "squish-avatar/README.md", data: encoder.encode(packReadme()) },
  ]);
  downloadBlob(new Blob([zip], { type: "application/zip" }), `squish-pack-${silhouette}-${fileStamp()}.zip`);
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
  const hidden: THREE.Object3D[] = [];

  scene.traverse((object) => {
    if (!object.visible) return;
    if (object.name === "squish-backdrop" || object.name === "squish-shadow") {
      object.visible = false;
      hidden.push(object);
    }
  });

  scene.background = null;
  gl.setClearColor(0x000000, 0);
  gl.render(scene, camera);

  const dataUrl = gl.domElement.toDataURL("image/png");

  for (const object of hidden) object.visible = true;
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
