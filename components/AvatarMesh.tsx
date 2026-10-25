"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { BufferGeometry, Material, Mesh } from "three";
import { paintGradient } from "@/lib/gradient";
import { createAvatarMaterial } from "@/lib/materials";
import { idlePose } from "@/lib/motion";
import { createSilhouetteGeometry } from "@/lib/silhouettes";
import type {
  ColorMode,
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
  eyeSize: number;
  follow: boolean;
  tap: boolean;
  frozen?: boolean;
};

type EyeAnchor = {
  point: THREE.Vector3;
  normal: THREE.Vector3;
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
  const oval = eyes === "ovals";
  const restScale: [number, number, number] = [
    radius * (oval ? 1.55 : 0.82),
    radius * (oval ? 0.72 : 0.82),
    radius * (oval ? 0.9 : 0.82),
  ];
  const eyePositions = anchors.eyes.map((anchor) =>
    anchor.point.clone().addScaledVector(anchor.normal, radius * 1.05),
  );

  useFrame((state, delta) => {
    const current = rig.current;
    if (!current) return;

    if (frozen) return;

    const time = state.clock.elapsedTime;
    const pace = 0.35 + speed * 1.75;
    const wander = idle !== "none";
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

    const open = blinkOpen(blink.current, time, delta);
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
      eye.scale.set(rest[0], rest[1] * open, rest[2]);
      eye.position.set(
        origin[0] + look.current.x * radius * 1.15,
        origin[1] + look.current.y * radius * 0.9,
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

function placeEyes(geometry: THREE.BufferGeometry): { eyes: [EyeAnchor, EyeAnchor]; radius: number } {
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  const box = geometry.boundingBox ?? new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const spread = THREE.MathUtils.clamp(size.x * 0.16, 0.12, 0.32);
  const y = center.y + size.y * 0.05;
  const radius = THREE.MathUtils.clamp(Math.min(size.x, size.y, size.z) * 0.055, 0.038, 0.062);
  const probe = new THREE.Mesh(geometry);
  const raycaster = new THREE.Raycaster();

  const seek = (x: number): EyeAnchor => {
    const heights = [y, y + size.y * 0.1, y - size.y * 0.12, center.y];
    for (const yTry of heights) {
      raycaster.set(new THREE.Vector3(x, yTry, box.max.z + 2), new THREE.Vector3(0, 0, -1));
      for (const hit of raycaster.intersectObject(probe)) {
        const normal = (hit.normal ?? hit.face?.normal ?? new THREE.Vector3(0, 0, 1)).clone().normalize();
        if (normal.z < 0.4) continue;
        return { point: hit.point.clone(), normal };
      }
    }
    return { point: new THREE.Vector3(x, y, box.max.z), normal: new THREE.Vector3(0, 0, 1) };
  };

  return { eyes: [seek(-spread), seek(spread)], radius };
}
