"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { BufferGeometry, Material, Mesh } from "three";
import {
  calmBlink,
  eyeMoodMotion,
  eyeMoodShape,
  eyeLookBounds,
  EYE_POLY_DEPTH_SCALE,
  EYE_POLY_LIFT,
  eyeProtrusion,
  eyeQuaternion,
  eyeTilt,
  placeEyesOnSilhouette,
  seatEyePosition,
} from "@/lib/eyes";
import { paintGradient } from "@/lib/gradient";
import { createAvatarMaterial } from "@/lib/materials";
import { idlePose, STILL_POSE } from "@/lib/motion";
import { createSilhouetteGeometry } from "@/lib/silhouettes";
import type {
  ColorMode,
  EyeMood,
  EyeStyle,
  IdleId,
  MaterialId,
  SilhouetteId,
  SurfaceMode,
} from "@/lib/types";

const REST_YAW = 0.38;
const REST_Y = 0.02;
const DRAG_SLOP = 12;

type AvatarMeshProps = {
  silhouette: SilhouetteId;
  color: string;
  colorB: string;
  colorMode: ColorMode;
  gradientAngle: number;
  gradientSoft: boolean;
  material: MaterialId;
  surface: SurfaceMode;
  rim: number;
  idle: IdleId;
  speed: number;
  smoothness: number;
  eyes: EyeStyle;
  mood: EyeMood;
  eyeSize: number;
  eyeInset: number;
  follow: boolean;
  tap: boolean;
  frozen?: boolean;
  /** Freeze looping idle and eye motion for prefers-reduced-motion. */
  reducedMotion?: boolean;
};

type Squish = {
  mode: "idle" | "hold" | "release";
  pointerId: number;
  x: number;
  y: number;
  amount: number;
  releaseT: number;
  releaseFrom: number;
};

export function AvatarMesh({
  silhouette,
  color,
  colorB,
  colorMode,
  gradientAngle,
  gradientSoft,
  material,
  surface,
  rim,
  idle,
  speed,
  smoothness,
  eyes,
  mood,
  eyeSize,
  eyeInset,
  follow,
  tap,
  frozen = false,
  reducedMotion = false,
}: AvatarMeshProps) {
  const rig = useRef<THREE.Group>(null);
  const eyeMeshes = useRef<(Mesh | null)[]>([null, null]);
  const look = useRef(new THREE.Vector2());
  const hovering = useRef(false);
  const blink = useRef({ next: 1.1, time: -1 });
  const displayed = useRef([new THREE.Vector3(), new THREE.Vector3()]);
  const seated = useRef(false);
  const squish = useRef<Squish>({
    mode: "idle",
    pointerId: -1,
    x: 0,
    y: 0,
    amount: 0,
    releaseT: 0,
    releaseFrom: 0,
  });
  const scratch = useRef({
    x: new THREE.Vector3(),
    y: new THREE.Vector3(),
    target: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
  });
  const gl = useThree((state) => state.gl);

  // Geometry only depends on the shape. Colours are painted into the existing
  // vertex buffer below, so a randomize click no longer rebuilds 30k faces.
  const geometry = useMemo(
    () => createSilhouetteGeometry(silhouette, surface),
    [silhouette, surface],
  );

  useLayoutEffect(() => {
    paintGradient(geometry, colorMode, color, colorB, gradientAngle * Math.PI * 2, gradientSoft);
  }, [geometry, colorMode, color, colorB, gradientAngle, gradientSoft]);
  const surfaceMaterial = useMemo(() => {
    const mat = createAvatarMaterial(material, color, {
      flat: surface === "poly",
      vertexColors: true,
      secondary: colorB,
      rim,
    });
    if (surface === "poly") {
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = 2;
      mat.polygonOffsetUnits = 2;
    }
    return mat;
  }, [material, color, colorB, surface, rim]);
  const anchors = useMemo(() => placeEyesOnSilhouette(silhouette), [silhouette]);
  const eyeGeometry = useMemo(() => new THREE.SphereGeometry(1, 18, 14), []);
  const eyeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#0e0c0a",
        name: "squish-eye",
        transparent: true,
        depthTest: true,
        depthWrite: false,
        side: THREE.FrontSide,
        // Only draw where the body silhouette was stamped into the stencil.
        // Without this, a proud eye peels off the outline at grazing angles.
        stencilWrite: true,
        stencilRef: 1,
        stencilFunc: THREE.EqualStencilFunc,
        stencilFail: THREE.KeepStencilOp,
        stencilZFail: THREE.KeepStencilOp,
        stencilZPass: THREE.KeepStencilOp,
      }),
    [],
  );
  // Invisible silhouette stamp. It runs before the body and eyes, writes no
  // color or depth, and clips the eyes to the avatar's projected outline.
  const silhouetteMask = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: false,
        depthTest: false,
        name: "squish-eye-mask",
        side: THREE.FrontSide,
        stencilWrite: true,
        stencilRef: 1,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilFail: THREE.KeepStencilOp,
        stencilZFail: THREE.KeepStencilOp,
        stencilZPass: THREE.ReplaceStencilOp,
      }),
    [],
  );

  const liveGeometry = useRef<BufferGeometry>(geometry);
  const liveMaterial = useRef<Material>(surfaceMaterial);
  liveGeometry.current = geometry;
  liveMaterial.current = surfaceMaterial;

  useEffect(() => {
    const created = geometry;
    return () => {
      if (liveGeometry.current !== created) created.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    const created = surfaceMaterial;
    return () => {
      if (liveMaterial.current !== created) created.dispose();
    };
  }, [surfaceMaterial]);

  useEffect(() => {
    const element = gl.domElement;
    const enter = () => {
      hovering.current = true;
    };
    const leave = () => {
      hovering.current = false;
    };
    element.addEventListener("pointerenter", enter);
    element.addEventListener("pointerleave", leave);
    return () => {
      element.removeEventListener("pointerenter", enter);
      element.removeEventListener("pointerleave", leave);
      document.body.style.cursor = "";
    };
  }, [gl]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const state = squish.current;
      if (state.mode !== "hold" || event.pointerId !== state.pointerId) return;
      const dx = event.clientX - state.x;
      const dy = event.clientY - state.y;
      if (dx * dx + dy * dy <= DRAG_SLOP * DRAG_SLOP) return;
      beginRelease(state, 0);
    };
    const up = (event: PointerEvent) => {
      const state = squish.current;
      if (state.mode !== "hold" || event.pointerId !== state.pointerId) return;
      beginRelease(state, 0.42);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  const radius = anchors.radius * eyeSize;
  const moodShape = eyeMoodShape(mood, eyes === "ovals");
  // Poly surfaces sit a little further forward than the smooth hull.
  const polyLift = surface === "poly" ? EYE_POLY_LIFT : 0;
  const protrusion = eyeProtrusion(eyeInset, anchors.sink) + polyLift;
  const depthScale = surface === "poly" ? EYE_POLY_DEPTH_SCALE : 1;
  const restScale: [number, number, number] = [
    radius * moodShape.sx,
    radius * moodShape.sy,
    radius * moodShape.sz * depthScale,
  ];
  const bases = anchors.eyes.map((anchor) =>
    seatEyePosition(anchor, restScale[2], protrusion, radius * moodShape.lift),
  );

  useLayoutEffect(() => {
    if (seated.current) return;
    bases.forEach((base, index) => displayed.current[index].copy(base));
    seated.current = true;
    eyeMeshes.current.forEach((eye, index) => {
      if (!eye) return;
      eye.position.copy(displayed.current[index]);
    });
  }, [bases]);

  useFrame((state, delta) => {
    const current = rig.current;
    if (!current) return;

    if (frozen) return;

    const time = reducedMotion ? 0 : state.clock.elapsedTime;
    const pace = 0.35 + speed * 1.75;
    const wander = !reducedMotion && idle !== "none" && idle !== "float";
    let targetX = 0;
    let targetY = 0;
    if (follow && !reducedMotion && hovering.current) {
      targetX = THREE.MathUtils.clamp(state.pointer.x * 1.2, -1, 1);
      targetY = THREE.MathUtils.clamp(state.pointer.y * 0.95, -1, 1);
    } else if (wander) {
      targetX = Math.sin(time * 0.7 * pace) * 0.9;
      targetY = Math.sin(time * 0.46 * pace + 0.8) * 0.42;
    }
    look.current.x = THREE.MathUtils.damp(look.current.x, targetX, 8, delta);
    look.current.y = THREE.MathUtils.damp(look.current.y, targetY, 8, delta);

    const pose = reducedMotion
      ? { ...STILL_POSE }
      : idlePose(idle, time, speed, smoothness);
    let { width, height, yaw, roll, pitch, bob } = pose;

    yaw += look.current.x * 0.28;
    roll += -look.current.x * 0.16;
    pitch += -look.current.y * 0.1;

    const press = squish.current;
    if (!tap && press.mode === "hold") beginRelease(press, 0);
    if (press.mode === "hold") {
      press.amount += (1 - press.amount) * (1 - Math.exp(-delta * 14));
      const jelly = Math.sin(time * 16) * 0.028 * Math.min(1, press.amount);
      width *= 1 + press.amount * 0.28 + jelly;
      height *= 1 - press.amount * 0.34 - jelly * 0.45;
      bob -= press.amount * 0.05;
    } else if (press.mode === "release") {
      press.releaseT += delta;
      const decay = Math.exp(-4.3 * press.releaseT);
      const spring = press.releaseFrom * decay * Math.cos(11.2 * press.releaseT);
      if (decay < 0.03) {
        press.mode = "idle";
        press.amount = 0;
      } else {
        press.amount = spring;
        width *= 1 + spring * 0.28;
        height *= 1 - spring * 0.34;
        bob -= Math.max(spring, 0) * 0.04;
      }
    }

    current.scale.set(width, Math.max(height, 0.35), width);
    current.rotation.set(pitch, REST_YAW + yaw, roll);
    current.position.y = REST_Y + bob;

    const floorPad = 0.08;
    const floorY = -1.12 + floorPad;
    current.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(current);
    if (bounds.min.y < floorY) {
      current.position.y += floorY - bounds.min.y;
    }

    const damp = follow ? 0.4 : 1;
    const motion = reducedMotion
      ? { scaleX: 1, scaleY: 1, scaleZ: 1, bob: 0 }
      : eyeMoodMotion(mood, time, damp);
    const open = !reducedMotion && mood === "calm" ? calmBlink(blink.current, time, delta, damp) : 1;
    const step = 1 - Math.exp(-delta * 12);
    const slide = scratch.current;

    const eyeList: Mesh[] = [];
    current.traverse((object) => {
      if (object.name === "squish-eye") eyeList.push(object as Mesh);
    });
    eyeList.sort((a, b) => (a.userData.eyeIndex as number) - (b.userData.eyeIndex as number));

    eyeList.forEach((eye, index) => {
      const anchor = anchors.eyes[index];
      const base = bases[index];
      if (!anchor || !base) return;
      const shown = displayed.current[index];
      if (!shown) return;
      if (!seated.current) shown.copy(base);
      else shown.lerp(base, step);

      slide.x.set(1, 0, 0).addScaledVector(anchor.normal, -anchor.normal.x);
      if (slide.x.lengthSq() < 1e-6) slide.x.set(1, 0, 0);
      else slide.x.normalize();
      slide.y.set(0, 1, 0).addScaledVector(anchor.normal, -anchor.normal.y);
      if (slide.y.lengthSq() < 1e-6) slide.y.set(0, 1, 0);
      else slide.y.normalize();

      slide.target.copy(shown);
      // A short slide on the tangent plane. A longer one walks off curved cheeks.
      slide.target.addScaledVector(slide.x, look.current.x * radius * 0.2);
      slide.target.addScaledVector(slide.y, look.current.y * radius * 0.14);
      const bounds = eyeLookBounds(anchors, moodShape);
      slide.target.x = THREE.MathUtils.clamp(slide.target.x, bounds.minX, bounds.maxX);
      slide.target.y = THREE.MathUtils.clamp(slide.target.y, bounds.minY, bounds.maxY);
      slide.target.y += motion.bob * radius;
      eye.position.copy(slide.target);
      eye.scale.set(
        restScale[0] * motion.scaleX,
        Math.max(restScale[1] * motion.scaleY * open, radius * 0.07),
        restScale[2] * motion.scaleZ,
      );
      eye.rotation.z = 0;
      eye.quaternion.copy(eyeQuaternion(anchor, eyeTilt(moodShape, index), slide.quaternion));
      eye.userData.restScale = restScale;
      eye.userData.restPosition = [base.x, base.y, base.z];
    });
    seated.current = true;
  });

  const pressDown = (event: ThreeEvent<PointerEvent>) => {
    if (!tap || frozen) return;
    const state = squish.current;
    if (state.mode === "hold") return;
    state.mode = "hold";
    state.pointerId = event.pointerId;
    state.x = event.nativeEvent.clientX;
    state.y = event.nativeEvent.clientY;
    state.releaseT = 0;
  };

  return (
    <group ref={rig} name="squish-avatar" position={[0, REST_Y, 0]} rotation={[0, REST_YAW, 0]}>
      <mesh
        name="squish-eye-mask"
        geometry={geometry}
        material={silhouetteMask}
        renderOrder={-2}
        castShadow={false}
        receiveShadow={false}
      />
      <mesh
        name="squish-body"
        geometry={geometry}
        material={surfaceMaterial}
        castShadow={false}
        receiveShadow={false}
        renderOrder={0}
        onPointerDown={pressDown}
        onPointerOver={() => {
          document.body.style.cursor = tap ? "pointer" : "";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      />
      {bases.map((position, index) => (
        <mesh
          key={index}
          name="squish-eye"
          geometry={eyeGeometry}
          material={eyeMaterial}
          renderOrder={3}
          rotation={[0, 0, eyeTilt(moodShape, index)]}
          userData={{
            eyeIndex: index,
            restScale,
            restPosition: [position.x, position.y, position.z],
          }}
          ref={(node) => {
            eyeMeshes.current[index] = node;
            if (!node) return;
            node.scale.set(restScale[0], restScale[1], restScale[2]);
            if (node.position.lengthSq() < 1e-8) node.position.copy(position);
          }}
          onPointerDown={pressDown}
        />
      ))}
    </group>
  );
}

function beginRelease(state: Squish, floor: number) {
  if (state.mode !== "hold") return;
  state.mode = "release";
  state.releaseT = 0;
  state.releaseFrom = Math.max(state.amount, floor);
}
