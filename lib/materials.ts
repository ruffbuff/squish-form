import * as THREE from "three";
import type { MaterialId } from "./types";

export const MATERIALS: { id: MaterialId; label: string }[] = [
  { id: "matte", label: "Матовый" },
  { id: "jelly", label: "Желе" },
  { id: "clay", label: "Глина" },
];

const CLAY_SIZE = 128;
let clayGrain: THREE.CanvasTexture | null = null;

export function createAvatarMaterial(id: MaterialId, hex: string) {
  const color = new THREE.Color(hex);
  const material = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0,
    name: `glina-${id}`,
  });

  if (id === "matte") {
    material.roughness = 0.94;
    material.specularIntensity = 0.18;
    material.clearcoat = 0.04;
    material.clearcoatRoughness = 0.9;
    material.envMapIntensity = 0.55;
    return material;
  }

  if (id === "jelly") {
    const attenuation = color.clone().lerp(new THREE.Color("#ffffff"), 0.12);
    material.roughness = 0.07;
    material.transmission = 0.78;
    material.thickness = 1.55;
    material.ior = 1.28;
    material.attenuationColor = attenuation;
    material.attenuationDistance = 0.62;
    material.clearcoat = 1;
    material.clearcoatRoughness = 0.08;
    material.specularIntensity = 1;
    material.envMapIntensity = 1.25;
    material.transparent = true;
    material.opacity = 1;
    return material;
  }

  const sheen = color.clone().lerp(new THREE.Color("#fff6ee"), 0.42);
  material.roughness = 0.84;
  material.sheen = 0.82;
  material.sheenRoughness = 0.62;
  material.sheenColor = sheen;
  material.specularIntensity = 0.3;
  material.clearcoat = 0.04;
  material.clearcoatRoughness = 0.8;
  material.envMapIntensity = 0.42;
  material.transmission = 0.04;
  material.thickness = 0.7;
  material.attenuationColor = color.clone().lerp(new THREE.Color("#ffd9c8"), 0.25);
  material.attenuationDistance = 1.5;
  const grain = getClayGrain();
  if (grain) {
    material.bumpMap = grain;
    material.bumpScale = 0.11;
  }
  return material;
}

function getClayGrain() {
  if (clayGrain) return clayGrain;
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = CLAY_SIZE;
  canvas.height = CLAY_SIZE;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const image = context.createImageData(CLAY_SIZE, CLAY_SIZE);
  const period = 4;
  for (let y = 0; y < CLAY_SIZE; y++) {
    for (let x = 0; x < CLAY_SIZE; x++) {
      const u = (x / CLAY_SIZE) * period;
      const v = (y / CLAY_SIZE) * period;
      const n =
        noise(u, v, period) * 0.6 +
        noise(u * 2, v * 2, period * 2) * 0.3 +
        noise(u * 4, v * 4, period * 4) * 0.1;
      const value = Math.max(0, Math.min(255, Math.round(128 + n * 108)));
      const offset = (y * CLAY_SIZE + x) * 4;
      image.data[offset] = value;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  clayGrain = texture;
  return texture;
}

function noise(x: number, y: number, period: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xf = x - x0;
  const yf = y - y0;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const wrap = (value: number) => ((value % period) + period) % period;
  const sample = (ix: number, iy: number) => {
    let n = Math.imul(wrap(ix), 374761393) + Math.imul(wrap(iy), 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const x1 = lerp(sample(x0, y0), sample(x0 + 1, y0), u);
  const x2 = lerp(sample(x0, y0 + 1), sample(x0 + 1, y0 + 1), u);
  return lerp(x1, x2, v) * 2 - 1;
}
