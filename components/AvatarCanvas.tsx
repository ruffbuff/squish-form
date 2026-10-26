"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { captureAvatarPng, exportAvatarGlb, exportProjectPack } from "@/lib/export";
import { qualityTier, type AvatarParams } from "@/lib/types";
import { AvatarMesh } from "./AvatarMesh";
import { ContactShadow } from "./ContactShadow";

export type PlaygroundApi = {
  downloadGlb: () => Promise<void>;
  downloadPng: () => void;
  downloadPack: () => Promise<void>;
};

const HOME_POSITION: [number, number, number] = [0, 0.22, 4.6];
const HOME_TARGET: [number, number, number] = [0, 0.02, 0];

type AvatarCanvasProps = AvatarParams & {
  home: number;
  paused?: boolean;
  onReady: (api: PlaygroundApi | null) => void;
  onFpsSample?: (fps: number) => void;
};

export default function AvatarCanvas(props: AvatarCanvasProps) {
  const tier = qualityTier(props.quality);
  return (
    <Canvas
      className="h-full w-full"
      frameloop={props.paused ? "never" : "always"}
      dpr={[1, tier === 0 ? 1 : tier === 1 ? 1.35 : 1.75]}
      camera={{ position: HOME_POSITION, fov: 32, near: 0.1, far: 40 }}
      gl={{
        antialias: true,
        alpha: true,
        premultipliedAlpha: true,
        stencil: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0);
        scene.environmentIntensity = 1;
      }}
    >
      <color attach="background" args={[backdropColor(props.backdrop)]} />
      <Stage backdrop={props.backdrop} />
      {props.lightOn ? (
        <>
          {/* A soft base so the point light owns the shading. */}
          <hemisphereLight args={["#fff6ee", "#3a332c", 0.3]} />
          <directionalLight position={[2.6, 4.4, 3.4]} intensity={0.5} color="#fff8f2" />
          <directionalLight position={[-3.8, 1.8, 2.6]} intensity={0.24} color="#d7e4ff" />
          <directionalLight position={[0.4, 1.4, -3.6]} intensity={0.16} color="#ffd8c8" />
          <Highlight x={props.lightX} y={props.lightY} intensity={props.lightIntensity} />
          <Suspense fallback={null}>
            <StudioEnvironment />
          </Suspense>
        </>
      ) : (
        <>
          {/* No key light: a uniform sky and a uniform environment keep the
              surface nearly identical from every camera angle. */}
          <hemisphereLight args={["#fff6ee", "#8a8178", 0.9]} />
          <ambientLight intensity={0.28} color="#fff8f2" />
          <UniformEnvironment />
        </>
      )}
      <AvatarMesh
        silhouette={props.silhouette}
        color={props.color}
        colorB={props.colorB}
        colorMode={props.colorMode}
        gradientAngle={props.gradientAngle}
        gradientSoft={props.gradientSoft}
        material={props.material}
        surface={props.surface}
        rim={props.rim}
        idle={props.idle}
        speed={props.speed}
        smoothness={props.smoothness}
        eyes={props.eyes}
        mood={props.mood}
        eyeSize={props.eyeSize}
        eyeInset={props.eyeInset}
        follow={props.follow}
        tap={props.tap}
      />
      {tier > 0 && props.shadowOn ? (
        <ContactShadow idle={props.idle} speed={props.speed} smoothness={props.smoothness} />
      ) : null}
      {props.onFpsSample ? <FpsReporter onSample={props.onFpsSample} /> : null}
      <QualityBinder quality={props.quality} />
      <CameraHome home={props.home} />
      <ExportBinder
        silhouette={props.silhouette}
        idle={props.idle}
        speed={props.speed}
        smoothness={props.smoothness}
        follow={props.follow}
        tap={props.tap}
        onReady={props.onReady}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.7}
        minDistance={2.4}
        maxDistance={12}
        target={HOME_TARGET}
      />
    </Canvas>
  );
}

function backdropColor(backdrop: AvatarParams["backdrop"]) {
  if (backdrop === "studio") return "#1c1618";
  if (backdrop === "grid") return "#12100e";
  return "#141210";
}

function Stage({ backdrop }: { backdrop: AvatarParams["backdrop"] }) {
  const studio = useMemo(() => (backdrop === "studio" ? verticalGradient("#5a4548", "#1c1618", "#0c0b0a") : null), [backdrop]);
  const grid = useMemo(() => (backdrop === "grid" ? floorGrid() : null), [backdrop]);
  if (backdrop === "studio" && studio) {
    return (
      <mesh name="squish-backdrop" position={[0, 0.15, -2.6]} renderOrder={-1}>
        <planeGeometry args={[18, 12]} />
        <meshBasicMaterial map={studio} toneMapped={false} depthWrite={false} />
      </mesh>
    );
  }
  if (backdrop === "grid" && grid) {
    return (
      <mesh name="squish-backdrop" rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.08, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshBasicMaterial map={grid} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    );
  }
  return null;
}

function verticalGradient(top: string, mid: string, bottom: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.55, mid);
  gradient.addColorStop(1, bottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 16, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function floorGrid() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.clearRect(0, 0, size, size);
  context.strokeStyle = "rgba(255,244,236,0.16)";
  context.lineWidth = 1;
  const step = 32;
  for (let line = 0; line <= size; line += step) {
    context.beginPath();
    context.moveTo(line, 0);
    context.lineTo(line, size);
    context.stroke();
    context.beginPath();
    context.moveTo(0, line);
    context.lineTo(size, line);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function CameraHome({ home }: { home: number }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as { target: THREE.Vector3; update: () => void } | null;
  const size = useThree((state) => state.size);
  const aspect = size.width / Math.max(size.height, 1);

  useEffect(() => {
    if (!controls) return;
    // A portrait stage is narrower than the avatar. Pull the camera back so
    // wide silhouettes keep a margin instead of being cropped.
    const distance = HOME_POSITION[2] * THREE.MathUtils.clamp(1 / Math.max(aspect, 0.6), 1, 1.75);
    camera.position.set(HOME_POSITION[0], HOME_POSITION[1], distance);
    controls.target.set(HOME_TARGET[0], HOME_TARGET[1], HOME_TARGET[2]);
    controls.update();
  }, [aspect, camera, controls, home]);

  return null;
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

function Highlight({ x, y, intensity }: { x: number; y: number; intensity: number }) {
  const px = -1.55 + x * 3.1;
  const py = 0.15 + y * 1.55;
  const power = 20 + intensity * 60;
  return (
    <group name="squish-light" position={[px, py, 1.9]}>
      <pointLight intensity={power} distance={6.5} decay={2} color="#fff8f2" />
    </group>
  );
}

function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={0.55}>
      <Lightformer form="rect" intensity={1.5} position={[0, 3.2, 1.6]} scale={[7, 3.2, 1]} color="#fffaf6" />
      <Lightformer form="rect" intensity={0.6} position={[-3.4, 1.2, -1.5]} scale={[3.5, 3.5, 1]} color="#d5e4ff" />
      <Lightformer form="rect" intensity={0.5} position={[3.2, 0.4, -1.2]} scale={[2.4, 3.2, 1]} color="#ffd2c2" />
      {/* No lightformer below the avatar: a white disc under the bud mirrored
          into its smooth underside and read as a hole. */}
    </Environment>
  );
}

/**
 * Flat white environment. It removes the directional reflections that made
 * the unlit avatar change drastically while orbiting.
 */
function UniformEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const source = new THREE.Scene();
    source.background = new THREE.Color("#f4eee7");
    const texture = pmrem.fromScene(source, 0).texture;
    scene.environment = texture;
    scene.environmentIntensity = 0.9;
    pmrem.dispose();
    return () => {
      scene.environment = null;
      texture.dispose();
    };
  }, [gl, scene]);

  return null;
}

function FpsReporter({ onSample }: { onSample: (fps: number) => void }) {
  const frames = useRef(0);
  const last = useRef(performance.now());

  useFrame((_, delta) => {
    frames.current += 1;
    const now = performance.now();
    if (now - last.current >= 500) {
      onSample(Math.round(frames.current / ((now - last.current) / 1000)));
      frames.current = 0;
      last.current = now;
    }
    void delta;
  });

  return null;
}

function ExportBinder({
  silhouette,
  idle,
  speed,
  smoothness,
  follow,
  tap,
  onReady,
}: {
  silhouette: AvatarParams["silhouette"];
  idle: AvatarParams["idle"];
  speed: number;
  smoothness: number;
  follow: boolean;
  tap: boolean;
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
      downloadPack: async () => {
        const root = scene.getObjectByName("squish-avatar");
        if (!root) throw new Error("Форма ещё не готова");
        await exportProjectPack(root, silhouette, idle, follow, tap, speed, smoothness);
      },
    });
    return () => onReady(null);
  }, [camera, follow, gl, idle, onReady, scene, silhouette, smoothness, speed, tap]);

  return null;
}
