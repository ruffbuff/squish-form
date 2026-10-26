"use client";

import { useEffect, useId, useMemo, useRef, type CSSProperties } from "react";
import { flatEasing, flatEyeDuration } from "@/lib/flatMotion";
import { flatLayers } from "@/lib/flatSvg";
import type { FlatParams } from "@/lib/flatTypes";

type FlatStageProps = {
  params: FlatParams;
  onFpsSample?: (fps: number) => void;
};

export function FlatStage({ params, onFpsSample }: FlatStageProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const layerKey = `${params.silhouette}|${params.color}|${params.colorB}|${params.colorMode}|${params.fill}|${params.eyes}|${params.mood}|${params.eyeSize}|${params.shadowOn}|${params.gradientCenterX}|${params.gradientCenterY}`;
  const layers = useMemo(() => flatLayers(params, `live${reactId}`), [layerKey, reactId, params]);
  // A separate prefix keeps gradient/filter ids unique on the back face.
  const backLayers = useMemo(() => flatLayers(params, `back${reactId}`), [layerKey, reactId, params]);
  const motion = motionClass(params.idle);
  const shade = shadeClass(params.idle);
  const eyes = moodEyeClass(params.mood);
  const zoom = clamp(params.zoom, 0.82, 1.18);
  const lookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = lookRef.current;
    if (!node) return;
    const reset = () => {
      node.style.setProperty("--look-x", "0deg");
      node.style.setProperty("--look-y", "0deg");
    };
    if (!params.follow) {
      reset();
      return;
    }
    const move = (event: PointerEvent) => {
      const x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const y = (event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
      node.style.setProperty("--look-x", `${(x * 11).toFixed(2)}deg`);
      node.style.setProperty("--look-y", `${(-y * 7).toFixed(2)}deg`);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", reset);
    };
  }, [params.follow]);

  useEffect(() => {
    if (!onFpsSample) return;
    let frames = 0;
    let last = performance.now();
    let id = 0;
    const tick = (now: number) => {
      frames += 1;
      if (now - last >= 500) {
        onFpsSample(Math.round(frames / ((now - last) / 1000)));
        frames = 0;
        last = now;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [onFpsSample]);

  return (
    <div className="flat-stage flex h-full w-full items-center justify-center">
      <FlatMotionStyle />
      <div
        role="img"
        aria-label={layers.label}
        className="relative h-[min(82%,680px)] w-[min(78%,520px)]"
        style={
          {
            "--squish-flat-dur": layers.duration,
            "--squish-flat-ease": flatEasing(params.smoothness),
            "--squish-flat-calm-dur": flatEyeDuration(params.speed, "calm"),
            "--squish-flat-joy-dur": flatEyeDuration(params.speed, "joy"),
            "--squish-flat-sleep-dur": flatEyeDuration(params.speed, "sleep"),
            "--squish-flat-wow-dur": flatEyeDuration(params.speed, "wow"),
            transform: `scale(${zoom})`,
            perspective: "1250px",
          } as CSSProperties
        }
      >
        {params.shadowOn ? (
          <div
            className={`absolute inset-0 ${shade}`}
            style={{ transformOrigin: layers.motionOrigin }}
            dangerouslySetInnerHTML={{ __html: layers.shadow }}
          />
        ) : null}
        <div ref={lookRef} className="squish-flat-look absolute inset-0">
          <div
            className={`squish-flat-card absolute inset-0 ${motion}`}
            style={{ transformOrigin: layers.motionOrigin }}
          >
            <div
              className="squish-flat-edge absolute inset-0"
              style={{ transformOrigin: layers.motionOrigin }}
              dangerouslySetInnerHTML={{ __html: layers.edge }}
            />
            <div className="squish-flat-face squish-flat-face--front">
              <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: layers.body }} />
              <div
                className={`squish-flat-eyes absolute inset-0 ${eyes} ${
                  params.idle === "spin" ? "squish-flat-spin-eyes" : ""
                }`}
                style={{ transformOrigin: layers.eyeOrigin }}
                dangerouslySetInnerHTML={{ __html: layers.eyes }}
              />
            </div>
            <div className="squish-flat-face squish-flat-face--back" aria-hidden="true">
              <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: backLayers.body }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function motionClass(idle: FlatParams["idle"]) {
  if (idle === "breathe") return "squish-flat-breathe";
  if (idle === "float") return "squish-flat-float";
  if (idle === "spin") return "squish-flat-spin";
  if (idle === "bounce") return "squish-flat-bounce";
  return "";
}

function shadeClass(idle: FlatParams["idle"]) {
  if (idle === "breathe") return "squish-flat-shade-breathe";
  if (idle === "float") return "squish-flat-shade-float";
  if (idle === "spin") return "squish-flat-shade-spin";
  if (idle === "bounce") return "squish-flat-shade-bounce";
  return "";
}

function moodEyeClass(mood: FlatParams["mood"]) {
  if (mood === "calm") return "squish-flat-blink";
  if (mood === "joy") return "squish-flat-joy-eyes";
  if (mood === "sleep") return "squish-flat-sleep-eyes";
  if (mood === "wow") return "squish-flat-wow-eyes";
  return "";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function FlatMotionStyle() {
  return (
    <style>{`
      .squish-flat-card,
      .squish-flat-face {
        transform-style: preserve-3d;
      }
      .squish-flat-card {
        will-change: transform;
        backface-visibility: visible;
      }
      .squish-flat-face {
        position: absolute;
        inset: 0;
        backface-visibility: hidden;
      }
      .squish-flat-face--back {
        transform: rotateY(180deg);
        filter: brightness(0.88) saturate(0.94);
      }
      .squish-flat-edge {
        transform: translateZ(-1px);
        will-change: transform, opacity;
      }
      .squish-flat-look {
        transform-style: preserve-3d;
        transform: rotateY(var(--look-x, 0deg)) rotateX(var(--look-y, 0deg));
        transition: transform 0.22s ease-out;
        will-change: transform;
      }
      .squish-flat-spin .squish-flat-face--front,
      .squish-flat-spin .squish-flat-face--back,
      .squish-flat-spin .squish-flat-edge,
      .squish-flat-spin-eyes {
        animation-duration: var(--squish-flat-dur, 3.2s);
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }
      .squish-flat-spin .squish-flat-face--front { animation-name: squish-flat-spin-front; }
      .squish-flat-spin .squish-flat-face--back {
        animation-name: squish-flat-spin-back;
        transform: scaleX(-1);
        backface-visibility: visible;
      }
      .squish-flat-spin .squish-flat-edge { animation-name: squish-flat-edge-spin; }
      .squish-flat-spin-eyes { animation-name: squish-flat-spin-eyes; }
      /* Keep the wall wider than the narrowed face at the quarter turns, so
         the card reads as a solid slab instead of a shrinking sticker. */
      @keyframes squish-flat-edge-spin {
        0%, 50%, 100% { transform: translateZ(-1px) translateX(0) scaleX(1); opacity: 0.92; }
        25% { transform: translateZ(-1px) translateX(13%) scaleX(0.62); opacity: 1; }
        75% { transform: translateZ(-1px) translateX(-13%) scaleX(0.62); opacity: 1; }
      }
      @keyframes squish-flat-spin-front {
        0%, 22% { opacity: 1; }
        28%, 72% { opacity: 0; }
        78%, 100% { opacity: 1; }
      }
      @keyframes squish-flat-spin-back {
        0%, 22% { opacity: 0; }
        28%, 72% { opacity: 1; }
        78%, 100% { opacity: 0; }
      }
      @keyframes squish-flat-spin-eyes {
        0%, 18% { opacity: 1; }
        24%, 76% { opacity: 0; }
        82%, 100% { opacity: 1; }
      }
      .squish-flat-breathe,
      .squish-flat-float,
      .squish-flat-spin,
      .squish-flat-bounce,
      .squish-flat-shade-breathe,
      .squish-flat-shade-float,
      .squish-flat-shade-spin,
      .squish-flat-shade-bounce,
      .squish-flat-blink,
      .squish-flat-joy-eyes,
      .squish-flat-sleep-eyes,
      .squish-flat-wow-eyes {
        animation-duration: var(--squish-flat-dur, 3.2s);
        animation-timing-function: var(--squish-flat-ease, ease-in-out);
        animation-iteration-count: infinite;
      }
      .squish-flat-breathe { animation-name: squish-flat-breathe; }
      .squish-flat-float { animation-name: squish-flat-float; }
      .squish-flat-spin { animation-name: squish-flat-spin; animation-timing-function: linear; }
      .squish-flat-bounce { animation-name: squish-flat-bounce; }
      .squish-flat-shade-breathe { animation-name: squish-flat-shade-breathe; }
      .squish-flat-shade-float { animation-name: squish-flat-shade-float; }
      .squish-flat-shade-spin { animation-name: squish-flat-shade-spin; }
      .squish-flat-shade-bounce { animation-name: squish-flat-shade-bounce; }
      .squish-flat-blink {
        animation-duration: var(--squish-flat-calm-dur, calc(var(--squish-flat-dur, 3.2s) * 1.45));
        animation-name: squish-flat-blink;
      }
      .squish-flat-joy-eyes {
        animation-duration: var(--squish-flat-joy-dur, var(--squish-flat-dur, 3.2s));
        animation-name: squish-flat-joy-eyes;
      }
      .squish-flat-sleep-eyes {
        animation-duration: var(--squish-flat-sleep-dur, calc(var(--squish-flat-dur, 3.2s) * 1.2));
        animation-name: squish-flat-sleep-eyes;
      }
      .squish-flat-wow-eyes {
        animation-duration: var(--squish-flat-wow-dur, calc(var(--squish-flat-dur, 3.2s) * 0.72));
        animation-name: squish-flat-wow-eyes;
      }
      .absolute > svg { display: block; width: 100%; height: 100%; }
      @keyframes squish-flat-breathe {
        0%, 100% { transform: rotateX(0deg) scale3d(1, 1, 1); }
        50% { transform: rotateX(-4deg) translateZ(10px) scale3d(1.05, 1.08, 1); }
      }
      @keyframes squish-flat-float {
        0%, 100% { transform: translate3d(0, 0, 0) rotateX(1.5deg) rotateZ(-1.2deg); }
        50% { transform: translate3d(0, -26px, 22px) rotateX(-4deg) rotateZ(1.2deg); }
      }
      /* A 2.5D turntable: the silhouette never collapses to a line. It narrows
         to 45% at the quarter turns, swaps to the mirrored back, and widens
         again. That reads as a full 360° while the shape stays visible. */
      @keyframes squish-flat-spin {
        0% { transform: rotateX(-6deg) rotateZ(0deg) translateX(0) scaleX(1); }
        25% { transform: rotateX(-4deg) rotateZ(-1.2deg) translateX(5px) scaleX(0.45); }
        50% { transform: rotateX(-3deg) rotateZ(0deg) translateX(0) scaleX(1); }
        75% { transform: rotateX(-4deg) rotateZ(1.2deg) translateX(-5px) scaleX(0.45); }
        100% { transform: rotateX(-6deg) rotateZ(0deg) translateX(0) scaleX(1); }
      }
      @keyframes squish-flat-bounce {
        0%, 100% { transform: translate3d(0, 0, 0) rotateX(-2deg) scale3d(1, 1, 1); }
        8% { transform: translate3d(0, 0, 0) rotateX(-1deg) scale3d(1.12, 0.86, 1); }
        16% { transform: translate3d(0, -20px, 10px) rotateX(-7deg) scale3d(0.94, 1.09, 1); }
        34% { transform: translate3d(0, -68px, 26px) rotateX(-5deg) scale3d(0.99, 1.02, 1); }
        46% { transform: translate3d(0, -80px, 30px) rotateX(-2deg) scale3d(1, 1, 1); }
        58% { transform: translate3d(0, -34px, 14px) rotateX(2deg) scale3d(1.02, 0.99, 1); }
        66% { transform: translate3d(0, 0, 0) rotateX(-1deg) scale3d(1.16, 0.82, 1); }
        76% { transform: translate3d(0, -9px, 4px) rotateX(1deg) scale3d(0.98, 1.03, 1); }
        86% { transform: translate3d(0, 0, 0) rotateX(-1deg) scale3d(1.05, 0.95, 1); }
      }
      @keyframes squish-flat-shade-breathe {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.04); opacity: 0.82; }
      }
      @keyframes squish-flat-shade-float {
        0%, 100% { transform: scaleX(1); opacity: 0.9; }
        50% { transform: translateY(10px) scaleX(0.8); opacity: 0.45; }
      }
      @keyframes squish-flat-shade-spin {
        0%, 100% { transform: scaleX(1); opacity: 0.85; }
        25% { transform: scaleX(0.6) translateX(4px); opacity: 0.62; }
        50% { transform: scaleX(0.96); opacity: 0.85; }
        75% { transform: scaleX(0.6) translateX(-4px); opacity: 0.62; }
      }
      @keyframes squish-flat-shade-bounce {
        0%, 8%, 100% { transform: scale(1); opacity: 0.85; }
        16% { transform: scale(0.96, 0.98); opacity: 0.8; }
        46% { transform: scale(0.68, 0.76) translateY(8px); opacity: 0.32; }
        66% { transform: scale(1.12, 0.86) translateY(2px); opacity: 0.9; }
        86% { transform: scale(1, 0.98); opacity: 0.84; }
      }
      @keyframes squish-flat-blink {
        0%, 82%, 100% { transform: scaleY(1); }
        90% { transform: scaleY(0.08); }
      }
      @keyframes squish-flat-joy-eyes {
        0%, 100% { transform: scale(1, 1); }
        50% { transform: scale(1.08, 0.55); }
      }
      @keyframes squish-flat-sleep-eyes {
        0%, 100% { transform: scaleY(0.22); }
        50% { transform: scaleY(0.95); }
      }
      @keyframes squish-flat-wow-eyes {
        0%, 14% { transform: scale(1); }
        28%, 52% { transform: scale(1.22); }
        70%, 100% { transform: scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .squish-flat-breathe,
        .squish-flat-float,
        .squish-flat-spin,
        .squish-flat-bounce,
        .squish-flat-shade-breathe,
        .squish-flat-shade-float,
        .squish-flat-shade-spin,
        .squish-flat-shade-bounce,
        .squish-flat-blink,
        .squish-flat-joy-eyes,
        .squish-flat-sleep-eyes,
        .squish-flat-wow-eyes,
        .squish-flat-spin .squish-flat-face--front,
        .squish-flat-spin .squish-flat-face--back,
        .squish-flat-spin .squish-flat-edge,
        .squish-flat-spin-eyes { animation: none; }
        .squish-flat-look { transition: none; transform: none; }
        .squish-flat-edge { transform: translateZ(-1px); opacity: 1; }
        .squish-flat-spin .squish-flat-face--front { opacity: 1; }
        .squish-flat-spin .squish-flat-face--back { opacity: 0; }
        /* Keep the 2.5D read without looping: a fixed three-quarter pose and
           an offset shadow replace breathe/float/spin/bounce. */
        .squish-flat-card { transform: rotateX(-5deg) rotateY(-14deg); }
        .squish-flat-shade-breathe,
        .squish-flat-shade-float,
        .squish-flat-shade-spin,
        .squish-flat-shade-bounce {
          transform: translate(-3%, 2%) scale(0.97);
          opacity: 0.8;
        }
      }
    `}</style>
  );
}
