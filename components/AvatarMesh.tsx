"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { BufferGeometry, Material, Mesh } from "three";
import { eyeMoodShape, placeEyes } from "@/lib/eyes";
import { paintGradient } from "@/lib/gradient";
import { createAvatarMaterial } from "@/lib/materials";
import { idlePose } from "@/lib/motion";
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
  follow: boolean;
  tap: boolean;
  frozen?: boolean;
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
  follow,
  tap,
  frozen = false,
}: AvatarMeshProps) {
  const rig = useRef<THREE.Group>(null);
  const eyeMeshes = useRef<(Mesh | null)[]>([null, null]);
  const look = useRef(new THREE.Vector2());
  const hovering = useRef(false);
  const reaction = useRef(0);
  const blink = useRef({ next: 0.6, time: -1 });
  const gl = useThree((state) => state.gl);

  const geometry = useMemo(() => {
    const next = createSilhouetteGeometry(silhouette, surface);
    paintGradient(next, colorMode, color, colorB, gradientAngle * Math.PI * 2, gradientSoft);
    return next;
  }, [silhouette, surface, colorMode, color, colorB, gradientAngle, gradientSoft]);
  const surfaceMaterial = useMemo(
    () =>
      createAvatarMaterial(material, color, {
        flat: surface === "poly",
        vertexColors: true,
        secondary: colorB,
        rim,
      }),
    [material, color, colorB, surface, rim],
  );
  const anchors = useMemo(() => placeEyes(geometry), [geometry]);
  const eyeGeometry = useMemo(() => new THREE.SphereGeometry(1, 18, 14), []);
  const eyeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#100e0c",
        roughness: 0.4,
        metalness: 0,
        name: "squish-eye",
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

  const radius = anchors.radius * eyeSize;
  const moodShape = eyeMoodShape(mood, eyes === "ovals");
  const restScale: [number, number, number] = [
    radius * moodShape.sx,
    radius * moodShape.sy,
    radius * moodShape.sz,
  ];
  const eyeLift = radius * moodShape.lift;
  const eyePositions = anchors.eyes.map((anchor) =>
    anchor.point.clone().addScaledVector(anchor.normal, radius * 1.05),
  );

  useFrame((state, delta) => {
    const current = rig.current;
    if (!current) return;

    if (frozen) return;

    const time = state.clock.elapsedTime;
    const pace = 0.35 + speed * 1.75;
    const wander = idle !== "none" && idle !== "float";
    let targetX = 0;
    let targetY = 0;
    if (follow && hovering.current) {
      targetX = THREE.MathUtils.clamp(state.pointer.x * 1.2, -1, 1);
      targetY = THREE.MathUtils.clamp(state.pointer.y * 0.95, -1, 1);
    } else if (wander) {
      targetX = Math.sin(time * 0.7 * pace) * 0.9;
      targetY = Math.sin(time * 0.46 * pace + 0.8) * 0.42;
    }
    look.current.x = THREE.MathUtils.damp(look.current.x, targetX, 8, delta);
    look.current.y = THREE.MathUtils.damp(look.current.y, targetY, 8, delta);

    const open = mood === "calm" ? blinkOpen(blink.current, time, delta) : 1;
    const pose = idlePose(idle, time, speed, smoothness);
    let { width, height, yaw, roll, pitch, bob } = pose;

    yaw += look.current.x * 0.28;
    roll += -look.current.x * 0.16;
    pitch += -look.current.y * 0.1;

    if (reaction.current > 0) {
      reaction.current += delta;
      const unit = reaction.current / 0.64;
      if (unit >= 1) {
        reaction.current = 0;
      } else {
        const envelope = Math.sin(Math.min(unit, 1) * Math.PI) * (1 - unit * 0.3);
        width *= 1 + envelope * 0.24;
        height *= 1 - envelope * 0.36;
        bob += envelope * 0.18;
        roll += Math.sin(unit * Math.PI * 2) * envelope * 0.28;
      }
    }

    current.scale.set(width, height, width);
    current.rotation.set(pitch, REST_YAW + yaw, roll);
    current.position.y = REST_Y + bob;

    eyeMeshes.current.forEach((eye) => {
      if (!eye) return;
      const rest = eye.userData.restScale as [number, number, number] | undefined;
      const origin = eye.userData.restPosition as [number, number, number] | undefined;
      if (!rest || !origin) return;
      eye.scale.set(rest[0], Math.max(rest[1] * open, radius * 0.08), rest[2]);
      eye.position.set(
        origin[0] + look.current.x * radius * 1.15,
        origin[1] + eyeLift + look.current.y * radius * 0.9,
        origin[2],
      );
    });
  });

  const poke = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!tap) return;
    reaction.current = 0.001;
  };

  return (
    <group ref={rig} name="squish-avatar" position={[0, REST_Y, 0]} rotation={[0, REST_YAW, 0]}>
      <mesh
        name="squish-body"
        geometry={geometry}
        material={surfaceMaterial}
        castShadow={false}
        receiveShadow={false}
        onClick={poke}
        onPointerOver={() => {
          document.body.style.cursor = tap ? "pointer" : "";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      />
      {eyePositions.map((position, index) => (
        <mesh
          key={index}
          name="squish-eye"
          geometry={eyeGeometry}
          material={eyeMaterial}
          position={position}
          scale={restScale}
          userData={{
            restScale,
            restPosition: [position.x, position.y, position.z],
          }}
          ref={(node) => {
            eyeMeshes.current[index] = node;
          }}
          onClick={poke}
        />
      ))}
    </group>
  );
}

function blinkOpen(state: { next: number; time: number }, time: number, delta: number) {
  if (state.time < 0 && time >= state.next) state.time = 0;
  if (state.time < 0) return 1;
  state.time += delta;
  const unit = state.time / 0.16;
  if (unit >= 1) {
    state.time = -1;
    state.next = time + 1.4 + Math.random() * 2.2;
    return 1;
  }
  return 1 - Math.sin(Math.min(unit, 1) * Math.PI) * 0.92;
}

