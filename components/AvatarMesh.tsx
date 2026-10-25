"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { BufferGeometry, Material, Mesh, MeshPhysicalMaterial } from "three";
import { createAvatarMaterial } from "@/lib/materials";
import { createSilhouetteGeometry } from "@/lib/silhouettes";
import type { IdleId, MaterialId, SilhouetteId } from "@/lib/types";

const REST_YAW = 0.42;
const REST_Y = 0.02;

type AvatarMeshProps = {
  silhouette: SilhouetteId;
  color: string;
  material: MaterialId;
  idle: IdleId;
};

export function AvatarMesh({ silhouette, color, material, idle }: AvatarMeshProps) {
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => createSilhouetteGeometry(silhouette), [silhouette]);
  const surface = useMemo(() => createAvatarMaterial(material, color), [material, color]);
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

  useFrame(({ clock }) => {
    const current = mesh.current;
    if (!current) return;

    const t = clock.elapsedTime;
    const breathe = idle === "breathe" || idle === "both";
    const sway = idle === "sway" || idle === "both";
    const pulse = breathe ? Math.sin(t * 1.65) : 0;
    const vertical = 1 + pulse * 0.055;
    const horizontal = 1 - pulse * 0.038;
    current.scale.set(horizontal, vertical, horizontal);

    const yaw = sway ? Math.sin(t * 0.75) * 0.42 : 0;
    const roll = sway ? Math.sin(t * 0.52) * 0.09 : 0;
    const pitch = sway ? Math.cos(t * 0.46) * 0.07 : 0;
    const bob = sway ? Math.sin(t * 1.15) * 0.045 : 0;
    current.rotation.set(pitch, REST_YAW + yaw, roll);
    current.position.y = REST_Y + bob;
  });

  return (
    <mesh
      ref={mesh}
      name="glina-avatar"
      geometry={geometry}
      material={surface as MeshPhysicalMaterial}
      castShadow={false}
      receiveShadow={false}
    />
  );
}
