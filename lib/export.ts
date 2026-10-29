import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { avatarComponentSource, packReadme } from "./projectPack";
import type { IdleId, SilhouetteId } from "./types";
import { createZip } from "./zip";

export const PNG_EXPORT_PIXEL_RATIO = 2;

type TransformSnapshot = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
};

export function prepareAvatarPngRestPose(root: THREE.Object3D) {
  const snapshots: TransformSnapshot[] = [];
  root.traverse((object) => {
    if (object === root || object.name === "squish-eye") {
      snapshots.push({
        object,
        position: object.position.clone(),
        quaternion: object.quaternion.clone(),
        scale: object.scale.clone(),
      });
    }
  });

  root.position.set(0, 0.02, 0);
  root.rotation.set(0, 0.38, 0);
  root.scale.set(1, 1, 1);
  root.traverse((object) => {
    if (object.name !== "squish-eye") return;
    const restPosition = object.userData.restPosition as [number, number, number] | undefined;
    const restScale = object.userData.restScale as [number, number, number] | undefined;
    if (restPosition) object.position.set(...restPosition);
    if (restScale) object.scale.set(...restScale);
  });

  return () => {
    snapshots.forEach(({ object, position, quaternion, scale }) => {
      object.position.copy(position);
      object.quaternion.copy(quaternion);
      object.scale.copy(scale);
    });
  };
}

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
  root?: THREE.Object3D,
) {
  const restoreRestPose = root ? prepareAvatarPngRestPose(root) : () => undefined;
  const previousPixelRatio = gl.getPixelRatio();
  const previousSize = gl.getSize(new THREE.Vector2());
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
  gl.setPixelRatio(PNG_EXPORT_PIXEL_RATIO);
  gl.setSize(previousSize.x, previousSize.y, false);
  gl.render(scene, camera);

  const dataUrl = gl.domElement.toDataURL("image/png");

  for (const object of hidden) object.visible = true;
  scene.background = previousBackground;
  gl.setPixelRatio(previousPixelRatio);
  gl.setSize(previousSize.x, previousSize.y, false);
  restoreRestPose();
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
