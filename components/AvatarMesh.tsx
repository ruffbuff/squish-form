"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { BufferGeometry, Group, Material, Mesh } from "three";
import { createAvatarMaterial } from "@/lib/materials";
import { createSilhouetteGeometry } from "@/lib/silhouettes";
import { qualityTier, type EyeStyle, type IdleId, type MaterialId, type SilhouetteId } from "@/lib/types";

const REST_YAW = 0.42;
const REST_Y = 0.02;

type AvatarMeshProps = {
  silhouette: SilhouetteId;
  color: string;
  material: MaterialId;
  idle: IdleId;
  eyes: EyeStyle;
  quality: number;
  follow: boolean;
};

type EyeSpot = {
  points: [THREE.Vector3, THREE.Vector3];
  scale: number;
};

export function AvatarMesh({ silhouette, color, material, idle, eyes, quality, follow }: AvatarMeshProps) {
  const rig = useRef<Group>(null);
  const eyeGroups = useRef<(Group | null)[]>([null, null]);
  const pupils = useRef<(Mesh | null)[]>([null, null]);
  const look = useRef(new THREE.Vector2());
  const hovering = useRef(false);
  const reaction = useRef(0);
  const blink = useRef({ next: 0.6, time: -1 });
  const gl = useThree((state) => state.gl);

  const tier = qualityTier(quality);
  const geometry = useMemo(() => createSilhouetteGeometry(silhouette, tier), [silhouette, tier]);
  const surface = useMemo(() => createAvatarMaterial(material, color), [material, color]);
  const spots = useMemo(() => placeEyes(geometry), [geometry]);
  const eyeGeometry = useMemo(() => new THREE.SphereGeometry(1, 28, 20), []);
  const pupilGeometry = useMemo(() => new THREE.SphereGeometry(0.42, 18, 14), []);
  const sclera = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#f7f4ef",
        roughness: 0.42,
        clearcoat: 0.35,
        clearcoatRoughness: 0.2,
        name: "squish-sclera",
      }),
    [],
  );
  const pupilMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#1a1412",
        roughness: 0.22,
        clearcoat: 0.45,
        clearcoatRoughness: 0.12,
        name: "squish-pupil",
      }),
    [],
  );

  const liveGeometry = useRef<BufferGeometry>(geometry);
  const liveMaterial = useRef<Material>(surface);
  liveGeometry.current = geometry;
  liveMaterial.current = surface;

  useEffect(() => {
    const created = geometry;
    return () => {
      if (liveGeometry.current !== created) created.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    const created = surface;
    return () => {
      if (liveMaterial.current !== created) created.dispose();
    };
  }, [surface]);

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

  useFrame((state, delta) => {
    const current = rig.current;
    if (!current) return;

    const time = state.clock.elapsedTime;
    const wanderX = Math.sin(time * 0.7) * 0.9;
    const wanderY = Math.sin(time * 0.46 + 0.8) * 0.42;
    let targetX = wanderX;
    let targetY = wanderY;
    if (follow && hovering.current) {
      targetX = THREE.MathUtils.clamp(state.pointer.x * 1.2, -1, 1);
      targetY = THREE.MathUtils.clamp(state.pointer.y * 0.95, -1, 1);
    }
    look.current.x = THREE.MathUtils.damp(look.current.x, targetX, 8, delta);
    look.current.y = THREE.MathUtils.damp(look.current.y, targetY, 8, delta);

    const open = blinkOpen(blink.current, time, delta);
    const breathe = idle === "breathe" || idle === "both";
    const sway = idle === "sway" || idle === "both";
    const pulse = breathe ? Math.sin(time * 1.65) : 0;
    let width = 1 - (breathe ? pulse * 0.038 : 0);
    let height = 1 + (breathe ? pulse * 0.055 : 0);
    let yaw = sway ? Math.sin(time * 0.75) * 0.28 : 0;
    let roll = sway ? Math.sin(time * 0.52) * 0.07 : 0;
    let pitch = sway ? Math.cos(time * 0.46) * 0.06 : 0;
    let bob = sway ? Math.sin(time * 1.15) * 0.04 : 0;

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

    const shiftX = look.current.x * 0.36;
    const shiftY = look.current.y * 0.28;
    for (const pupil of pupils.current) {
      if (!pupil) continue;
      pupil.position.x = shiftX;
      pupil.position.y = shiftY;
    }
    for (const eye of eyeGroups.current) {
      if (!eye) continue;
      const rest = eye.userData.restScale as [number, number, number] | undefined;
      if (!rest) continue;
      eye.scale.set(rest[0], rest[1] * open, rest[2]);
    }
  });

  const poke = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    reaction.current = 0.001;
  };

  const oval = eyes === "ovals";
  const restScale: [number, number, number] = [
    spots.scale * (oval ? 1.34 : 1),
    spots.scale * (oval ? 0.68 : 1),
    spots.scale * (oval ? 0.9 : 1),
  ];

  return (
    <group ref={rig} name="squish-avatar">
      <mesh
        name="squish-body"
        geometry={geometry}
        material={surface}
        castShadow={false}
        receiveShadow={false}
        onClick={poke}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      />
      {spots.points.map((point, index) => (
        <group
          key={index}
          name="squish-eye"
          position={point}
          userData={{ restScale }}
          ref={(node) => {
            eyeGroups.current[index] = node;
          }}
          onClick={poke}
        >
          <mesh geometry={eyeGeometry} material={sclera} />
          <mesh
            name="squish-pupil"
            geometry={pupilGeometry}
            material={pupilMaterial}
            position={[0, 0, 0.62]}
            ref={(node) => {
              pupils.current[index] = node;
            }}
          />
        </group>
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

function placeEyes(geometry: THREE.BufferGeometry): EyeSpot {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox ?? new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const y = center.y + size.y * 0.12;
  const spread = THREE.MathUtils.clamp(size.x * 0.18, 0.16, 0.42);
  const scale = THREE.MathUtils.clamp(Math.min(size.y, size.z) * 0.11, 0.075, 0.14);
  const probe = new THREE.Mesh(geometry);
  const raycaster = new THREE.Raycaster();

  const hitAt = (x: number) => {
    raycaster.set(new THREE.Vector3(x, y, box.max.z + 2), new THREE.Vector3(0, 0, -1));
    const hit = raycaster.intersectObject(probe)[0];
    if (!hit) return new THREE.Vector3(x, y, box.max.z + scale * 0.25);
    const point = hit.point.clone();
    point.addScaledVector(hit.face?.normal ?? new THREE.Vector3(0, 0, 1), scale * 0.45);
    return point;
  };

  return { points: [hitAt(-spread), hitAt(spread)], scale };
}
