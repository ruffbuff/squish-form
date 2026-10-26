"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { idlePose, STILL_POSE } from "@/lib/motion";
import type { IdleId } from "@/lib/types";

const FLOOR_Y = -1.12;
const SHADOW_BASE = 3.4;

type ContactShadowProps = {
  idle: IdleId;
  speed: number;
  smoothness: number;
  reducedMotion?: boolean;
};

export function ContactShadow({ idle, speed, smoothness, reducedMotion = false }: ContactShadowProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => makeShadowTexture(), []);
  const box = useMemo(() => new THREE.Box3(), []);
  const clock = useRef(0);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    clock.current = state.clock.elapsedTime;
    const avatar = state.scene.getObjectByName("squish-avatar");
    if (!avatar) return;

    avatar.updateWorldMatrix(true, true);
    box.setFromObject(avatar);
    const bottom = box.min.y;
    const gap = Math.max(0, bottom - FLOOR_Y);
    const pose = reducedMotion ? STILL_POSE : idlePose(idle, clock.current, speed, smoothness);
    const lift = Math.max(gap, pose.bob * 0.35);
    const scale = THREE.MathUtils.clamp(1 - lift * 0.55, 0.42, 1);
    const fade = THREE.MathUtils.clamp(1 - lift * 0.38, 0.35, 0.95);

    mesh.position.set((box.min.x + box.max.x) / 2, FLOOR_Y, (box.min.z + box.max.z) / 2);
    mesh.scale.set(SHADOW_BASE * scale, SHADOW_BASE * scale, 1);
    const material = mesh.material as THREE.MeshBasicMaterial;
    material.opacity = 0.45 * fade;
  });

  if (!texture) return null;

  return (
    <mesh ref={meshRef} name="squish-shadow" rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} opacity={0.45} />
    </mesh>
  );
}

function makeShadowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size * 0.5);
  gradient.addColorStop(0, "rgba(0,0,0,0.45)");
  gradient.addColorStop(0.45, "rgba(0,0,0,0.16)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;
  return map;
}
