import type { IdleId } from "./types";

export function avatarComponentSource(idle: IdleId, follow: boolean, tap: boolean) {
  return `"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group, Mesh } from "three";

export type SquishIdle = "none" | "breathe" | "sway" | "both";

type SquishAvatarProps = {
  /** Put avatar.glb in public/ and pass "/avatar.glb". */
  url?: string;
  idle?: SquishIdle;
  follow?: boolean;
  tap?: boolean;
  blink?: boolean;
};

export function SquishAvatar({
  url = "/avatar.glb",
  idle = "${idle}",
  follow = ${follow},
  tap = ${tap},
  blink = true,
}: SquishAvatarProps) {
  const gltf = useGLTF(url);
  const rig = useRef<Group>(null);
  const reaction = useRef(0);
  const blinkState = useRef({ next: 0.8, time: -1 });

  useFrame((state, delta) => {
    const current = rig.current;
    if (!current) return;
    const time = state.clock.elapsedTime;
    let width = 1;
    let height = 1;
    let yaw = 0.38;
    let roll = 0;
    let pitch = 0;
    let bob = 0;

    if (idle === "breathe" || idle === "both") {
      const pulse = Math.sin(time * 2.15);
      height += pulse * 0.12;
      width -= pulse * 0.075;
    }
    if (idle === "sway" || idle === "both") {
      yaw += Math.sin(time * 0.85) * 0.58;
      roll += Math.sin(time * 0.62) * 0.24;
      pitch += Math.cos(time * 0.54) * 0.18;
      bob += Math.sin(time * 0.85) * 0.11;
    }

    let lookX = 0;
    let lookY = 0;
    if (follow) {
      lookX = Math.max(-1, Math.min(1, state.pointer.x * 1.2));
      lookY = Math.max(-1, Math.min(1, state.pointer.y * 0.95));
    } else if (idle !== "none") {
      lookX = Math.sin(time * 0.7) * 0.9;
      lookY = Math.sin(time * 0.46) * 0.42;
    }
    yaw += lookX * 0.28;
    roll -= lookX * 0.16;
    pitch -= lookY * 0.1;

    if (reaction.current > 0) {
      reaction.current += delta;
      const unit = reaction.current / 0.64;
      if (unit >= 1) reaction.current = 0;
      else {
        const envelope = Math.sin(Math.min(unit, 1) * Math.PI) * (1 - unit * 0.3);
        width *= 1 + envelope * 0.24;
        height *= 1 - envelope * 0.36;
        bob += envelope * 0.18;
        roll += Math.sin(unit * Math.PI * 2) * envelope * 0.28;
      }
    }

    current.scale.set(width, height, width);
    current.rotation.set(pitch, yaw, roll);
    current.position.y = bob;

    const open = blink ? blinkOpen(blinkState.current, time, delta) : 1;
    current.traverse((object) => {
      const mesh = object as Mesh;
      if (mesh.name !== "squish-eye") return;
      if (!mesh.userData.rest) {
        mesh.userData.rest = {
          scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
        };
      }
      const rest = mesh.userData.rest as {
        scale: [number, number, number];
        x: number;
        y: number;
        z: number;
      };
      mesh.scale.set(rest.scale[0], rest.scale[1] * open, rest.scale[2]);
      mesh.position.set(rest.x + lookX * rest.scale[0] * 1.3, rest.y + lookY * rest.scale[1], rest.z);
    });
  });

  return (
    <group
      ref={rig}
      onClick={(event) => {
        event.stopPropagation();
        if (tap) reaction.current = 0.001;
      }}
    >
      <primitive object={gltf.scene} />
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

useGLTF.preload("/avatar.glb");
`;
}

export function packReadme() {
  return `# SquishForm — аватар для проекта

Мягкий 3D-аватар для бота или агента. Этот пакет бесплатный: модель, drop-in компонент и короткое описание. Расширенный платный пакет появится позже — без цен в этом файле.

## Как вставить

1. Положите \`avatar.glb\` в \`public/avatar.glb\`.
2. Скопируйте \`squish-avatar.tsx\` в проект.
3. Внутри \`<Canvas>\`:

\`\`\`tsx
import { SquishAvatar } from "./squish-avatar";

<SquishAvatar url="/avatar.glb" />
\`\`\`

Нужны \`three\`, \`@react-three/fiber\` и \`@react-three/drei\`.

## Props

- \`idle\` — \`none\`, \`breathe\`, \`sway\` или \`both\`. Дыхание меняет масштаб, покачивание — наклон.
- \`follow\` — глаза и корпус следят за курсором.
- \`tap\` — клик по форме коротко сжимает её.
- \`blink\` — моргание чёрных глаз.

Файл экспортирован в покое, с глазами. Свет сцены задайте у себя в Canvas.
`;
}
