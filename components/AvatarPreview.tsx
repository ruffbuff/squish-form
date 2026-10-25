"use client";

import { Canvas } from "@react-three/fiber";
import { AvatarMesh } from "./AvatarMesh";
import type { AvatarParams } from "@/lib/types";

/** Frozen circle of the current avatar. No idle motion. */
export function AvatarPreview(props: AvatarParams) {
  return (
    <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border border-white/15 bg-[#1a1714] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      <Canvas
        className="h-full w-full"
        dpr={1}
        camera={{ position: [0.42, 0.2, 3.55], fov: 32, near: 0.1, far: 20 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#1a1714"]} />
        <hemisphereLight args={["#fff6ee", "#2a241f", 0.75]} />
        <directionalLight position={[2.4, 3.2, 3.6]} intensity={1.5} color="#fff8f2" />
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
          idle="none"
          speed={props.speed}
          smoothness={props.smoothness}
          eyes={props.eyes}
          eyeSize={props.eyeSize}
          follow={false}
          tap={false}
          frozen
        />
      </Canvas>
    </div>
  );
}
