import * as THREE from "three";
import { eyeMoodShape, eyeProtrusion, eyeTilt, placeEyes, seatEyePosition } from "./eyes";
import { paintGradient } from "./gradient";
import { createAvatarMaterial } from "./materials";
import { createSilhouetteGeometry } from "./silhouettes";
import type { AvatarParams } from "./types";

type StillShot = Pick<
  AvatarParams,
  | "silhouette"
  | "color"
  | "colorB"
  | "colorMode"
  | "gradientAngle"
  | "gradientSoft"
  | "material"
  | "surface"
  | "rim"
  | "eyes"
  | "eyeSize"
  | "eyeInset"
  | "mood"
>;

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
const eyeGeometry = new THREE.SphereGeometry(1, 16, 12);
const eyeMaterial = new THREE.MeshStandardMaterial({ color: "#100e0c", roughness: 0.35 });

/** One frozen frame of the current avatar, for the circular sidebar preview. */
export function renderAvatarStill(params: StillShot) {
  const gl = ensureRenderer();
  const stage = ensureScene();
  const view = ensureCamera();
  clear(stage);

  const geometry = createSilhouetteGeometry(params.silhouette, params.surface);
  paintGradient(geometry, params.colorMode, params.color, params.colorB, params.gradientAngle * Math.PI * 2, params.gradientSoft);
  const material = createAvatarMaterial(params.material, params.color, {
    flat: params.surface === "poly",
    vertexColors: true,
    secondary: params.colorB,
    rim: params.rim,
  });
  const body = new THREE.Mesh(geometry, material);
  body.rotation.y = 0.38;
  const anchors = placeEyes(geometry, params.silhouette);
  const radius = anchors.radius * params.eyeSize;
  const mood = eyeMoodShape(params.mood, params.eyes === "ovals");
  const protrusion = eyeProtrusion(params.eyeInset, anchors.sink);
  anchors.eyes.forEach((anchor, index) => {
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const depth = radius * mood.sz;
    eye.position.copy(seatEyePosition(anchor, depth, protrusion, radius * mood.lift));
    eye.scale.set(radius * mood.sx, radius * mood.sy, depth);
    eye.rotation.z = eyeTilt(mood, index);
    body.add(eye);
  });
  stage.add(body);
  gl.render(stage, view);
  const url = gl.domElement.toDataURL("image/png");
  stage.remove(body);
  geometry.dispose();
  material.dispose();
  return url;
}

function ensureRenderer() {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(256, 256);
    renderer.setClearColor(0x1a1714, 1);
  }
  return renderer;
}

function ensureScene() {
  if (!scene) {
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight("#fff6ee", "#2a241f", 0.8));
    const key = new THREE.DirectionalLight("#fff8f2", 1.55);
    key.position.set(2.4, 3.2, 3.6);
    scene.add(key);
    const fill = new THREE.DirectionalLight("#d7e4ff", 0.45);
    fill.position.set(-3, 1.4, 2);
    scene.add(fill);
  }
  return scene;
}

function ensureCamera() {
  if (!camera) {
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  }
  // One distance for every shape. Re-applied so a hot reload cannot keep
  // an older, closer camera that clips the disk and the squircle.
  camera.position.set(0.08, 0.06, 5.7);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return camera;
}

function clear(stage: THREE.Scene) {
  for (const child of [...stage.children]) {
    if (child instanceof THREE.Light) continue;
    stage.remove(child);
  }
}
