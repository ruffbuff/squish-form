"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { captureAvatarPng, exportAvatarGlb } from "@/lib/export";
import { qualityTier, type AvatarParams } from "@/lib/types";
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
  const tier = qualityTier(props.quality);
  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, tier === 0 ? 1 : tier === 1 ? 1.35 : 1.75]}
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
      <directionalLight position={[3.4, 4.8, 2.6]} intensity={1.7} color="#fff6ee" />
      <directionalLight position={[-4.2, 1.4, 2.2]} intensity={0.55} color="#c5d4ff" />
      <directionalLight position={[0.4, 2.2, -4.2]} intensity={0.85} color="#ffd8c8" />
      <Highlight amount={props.light} />
      <Suspense fallback={null}>
        <StudioEnvironment />
      </Suspense>
      <AvatarMesh
        silhouette={props.silhouette}
        color={props.color}
        material={props.material}
        idle={props.idle}
        eyes={props.eyes}
        quality={props.quality}
        follow={props.follow}
      />
      {tier > 0 ? <SoftShadow /> : null}
      <QualityBinder quality={props.quality} />
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

function QualityBinder({ quality }: { quality: number }) {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);

  useEffect(() => {
    const level = qualityTier(quality);
    const cap = [1, 1.35, 1.75][level];
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    gl.setSize(size.width, size.height);
  }, [gl, quality, size.height, size.width]);

  return null;
}

function Highlight({ amount }: { amount: number }) {
  const x = -1.35 + amount * 2.7;
  return (
    <group name="squish-light" position={[x, 1.05, 1.65]}>
      <pointLight intensity={26} distance={5.5} decay={2} color="#fff8f2" />
      <mesh>
        <sphereGeometry args={[0.055, 20, 16]} />
        <meshBasicMaterial color="#fff7ee" toneMapped={false} />
      </mesh>
    </group>
  );
}

function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={2.4} position={[0, 3.2, 1.6]} scale={[7, 3.2, 1]} color="#fffaf6" />
      <Lightformer form="rect" intensity={1} position={[-3.4, 1.2, -1.5]} scale={[3.5, 3.5, 1]} color="#d5e4ff" />
      <Lightformer form="rect" intensity={0.8} position={[3.2, 0.4, -1.2]} scale={[2.4, 3.2, 1]} color="#ffd2c2" />
      <Lightformer form="circle" intensity={1.2} position={[0.2, -2.6, 1.4]} scale={[3.5, 3.5, 1]} color="#ffffff" />
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
        const root = scene.getObjectByName("squish-avatar");
        if (!root) throw new Error("Форма ещё не готова");
        await exportAvatarGlb(root, silhouette);
      },
      downloadPng: () => {
        captureAvatarPng(gl, scene, camera, silhouette);
      },
    });
    return () => onReady(null);
  }, [camera, gl, onReady, scene, silhouette]);

  return null;
}
