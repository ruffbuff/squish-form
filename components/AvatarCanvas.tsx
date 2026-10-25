"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import type { Mesh } from "three";
import { captureAvatarPng, exportAvatarGlb } from "@/lib/export";
import type { AvatarParams } from "@/lib/types";
import { AvatarMesh } from "./AvatarMesh";
import { SoftShadow } from "./SoftShadow";

export type PlaygroundApi = {
  downloadGlb: () => Promise<void>;
  downloadPng: () => void;
};

type AvatarCanvasProps = AvatarParams & {
  onReady: (api: PlaygroundApi | null) => void;
};

export default function AvatarCanvas(props: AvatarCanvasProps) {
  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.22, 4.15], fov: 32, near: 0.1, far: 40 }}
      gl={{
        antialias: true,
        alpha: true,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0);
        scene.environmentIntensity = 1;
      }}
    >
      <color attach="background" args={["#141210"]} />
      <hemisphereLight args={["#fff4ec", "#2a241f", 0.35]} />
      <directionalLight position={[3.4, 4.8, 2.6]} intensity={2.15} color="#fff6ee" />
      <directionalLight position={[-4.2, 1.4, 2.2]} intensity={0.72} color="#c5d4ff" />
      <directionalLight position={[0.4, 2.2, -4.2]} intensity={1.15} color="#ffd8c8" />
      <Suspense fallback={null}>
        <StudioEnvironment />
      </Suspense>
      <AvatarMesh
        silhouette={props.silhouette}
        color={props.color}
        material={props.material}
        idle={props.idle}
      />
      <SoftShadow />
      <ExportBinder silhouette={props.silhouette} onReady={props.onReady} />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.7}
        minDistance={2.4}
        maxDistance={7}
        target={[0, 0.02, 0]}
      />
    </Canvas>
  );
}

function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={3.2} position={[0, 3.2, 1.6]} scale={[7, 3.2, 1]} color="#fffaf6" />
      <Lightformer form="rect" intensity={1.3} position={[-3.4, 1.2, -1.5]} scale={[3.5, 3.5, 1]} color="#d5e4ff" />
      <Lightformer form="rect" intensity={1.1} position={[3.2, 0.4, -1.2]} scale={[2.4, 3.2, 1]} color="#ffd2c2" />
      <Lightformer form="circle" intensity={1.6} position={[0.2, -2.6, 1.4]} scale={[3.5, 3.5, 1]} color="#ffffff" />
    </Environment>
  );
}

function ExportBinder({
  silhouette,
  onReady,
}: {
  silhouette: AvatarParams["silhouette"];
  onReady: (api: PlaygroundApi | null) => void;
}) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    onReady({
      downloadGlb: async () => {
        const mesh = scene.getObjectByName("glina-avatar");
        if (!mesh || !(mesh as Mesh).isMesh) {
          throw new Error("Форма ещё не готова");
        }
        await exportAvatarGlb(mesh as Mesh, silhouette);
      },
      downloadPng: () => {
        captureAvatarPng(gl, scene, camera, silhouette);
      },
    });
    return () => onReady(null);
  }, [camera, gl, onReady, scene, silhouette]);

  return null;
}
