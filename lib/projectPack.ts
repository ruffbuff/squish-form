import type { IdleId } from "./types";

export function avatarComponentSource(
  idle: IdleId,
  follow: boolean,
  tap: boolean,
  speed: number,
  smoothness: number,
) {
  return `"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group, Mesh } from "three";

export type SquishIdle = "none" | "breathe" | "sway" | "bounce" | "spin" | "float";

type SquishAvatarProps = {
  /** Put avatar.glb in public/ and pass "/avatar.glb". */
  url?: string;
  idle?: SquishIdle;
  /** 0–1 */
  speed?: number;
  /** 0–1, higher is softer. */
  smoothness?: number;
  follow?: boolean;
  tap?: boolean;
  blink?: boolean;
};

export function SquishAvatar({
  url = "/avatar.glb",
  idle = "${idle}",
  speed = ${speed},
  smoothness = ${smoothness},
  follow = ${follow},
  tap = ${tap},
  blink = true,
}: SquishAvatarProps) {
  const gltf = useGLTF(url);
  const rig = useRef<Group>(null);
  const blinkState = useRef({ next: 0.8, time: -1 });
  const squish = useRef({ mode: "idle" as "idle" | "hold" | "release", id: -1, x: 0, y: 0, amount: 0, releaseT: 0, releaseFrom: 0 });

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const state = squish.current;
      if (state.mode !== "hold" || event.pointerId !== state.id) return;
      const dx = event.clientX - state.x;
      const dy = event.clientY - state.y;
      if (dx * dx + dy * dy < 144) return;
      state.releaseFrom = state.amount;
      state.releaseT = 0;
      state.mode = "release";
    };
    const up = (event: PointerEvent) => {
      const state = squish.current;
      if (state.mode !== "hold" || event.pointerId !== state.id) return;
      state.releaseFrom = Math.max(state.amount, 0.42);
      state.releaseT = 0;
      state.mode = "release";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

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

    const pace = 0.35 + speed * 1.75;
    if (idle === "breathe") {
      const pulse = Math.sin(time * 2.1 * pace);
      height += pulse * 0.13;
      width -= pulse * 0.08;
    }
    if (idle === "sway") {
      yaw += Math.sin(time * 0.9 * pace) * 0.64;
      roll += Math.sin(time * 0.65 * pace) * 0.28;
      pitch += Math.cos(time * 0.54 * pace) * 0.2;
      bob += Math.sin(time * 0.9 * pace) * 0.12;
    }
    if (idle === "bounce") {
      const sample = Math.sin(time * 1.45 * pace);
      const hop = sample > 0 ? Math.pow(sample, 0.45 + smoothness * 1.4) : 0;
      const land = sample < 0 ? Math.pow(-sample, 0.45 + smoothness * 1.4) : 0;
      bob += hop * 0.5;
      height += hop * 0.1 - land * 0.2;
      width += -hop * 0.06 + land * 0.16;
    }
    if (idle === "spin") {
      const unit = (Math.sin(time * 0.55 * pace) + 1) / 2;
      const soft = unit * unit * (3 - 2 * unit);
      yaw += (unit + (soft - unit) * smoothness) * Math.PI * 2;
    }
    if (idle === "float") {
      bob += Math.sin(time * 1.15 * pace) * 0.28;
    }

    let lookX = 0;
    let lookY = 0;
    if (follow) {
      lookX = Math.max(-1, Math.min(1, state.pointer.x * 1.2));
      lookY = Math.max(-1, Math.min(1, state.pointer.y * 0.95));
    } else if (idle !== "none" && idle !== "float") {
      lookX = Math.sin(time * 0.7) * 0.9;
      lookY = Math.sin(time * 0.46) * 0.42;
    }
    yaw += lookX * 0.28;
    roll -= lookX * 0.16;
    pitch -= lookY * 0.1;

    const press = squish.current;
    if (press.mode === "hold") {
      press.amount += (1 - press.amount) * (1 - Math.exp(-delta * 14));
      const jelly = Math.sin(time * 16) * 0.028 * Math.min(1, press.amount);
      width *= 1 + press.amount * 0.28 + jelly;
      height *= 1 - press.amount * 0.34 - jelly * 0.45;
    } else if (press.mode === "release") {
      press.releaseT += delta;
      const decay = Math.exp(-4.3 * press.releaseT);
      const spring = press.releaseFrom * decay * Math.cos(11.2 * press.releaseT);
      if (decay < 0.03) {
        press.mode = "idle";
        press.amount = 0;
      } else {
        press.amount = spring;
        width *= 1 + spring * 0.28;
        height *= 1 - spring * 0.34;
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
      mesh.position.set(rest.x + lookX * rest.scale[0] * 0.35, rest.y + lookY * rest.scale[1] * 0.28, rest.z);
    });
  });

  return (
    <group
      ref={rig}
      onPointerDown={(event) => {
        event.stopPropagation();
        const state = squish.current;
        if (!tap || state.mode === "hold") return;
        state.mode = "hold";
        state.id = event.pointerId;
        state.x = event.nativeEvent.clientX;
        state.y = event.nativeEvent.clientY;
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

- \`idle\` — \`none\`, \`breathe\`, \`sway\`, \`bounce\`, \`spin\` или \`float\`. Spin turns all the way around and back without a jump. Float moves only up and down.
- \`speed\` и \`smoothness\` — скорость и плавность, от 0 до 1.
- \`follow\` — глаза и корпус следят за курсором.
- \`tap\` — зажатие сжимает форму, отпускание пружинит обратно. Сдвиг указателя отдаёт жест камере.
- \`blink\` — моргание чёрных глаз.

Файл экспортирован в покое, с глазами. Свет сцены задайте у себя в Canvas.
`;
}
