"use client";

import { useId, useMemo, type CSSProperties } from "react";
import { flatLayers } from "@/lib/flatSvg";
import type { FlatParams } from "@/lib/flatTypes";

type FlatStageProps = {
  params: FlatParams;
};

export function FlatStage({ params }: FlatStageProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const layers = useMemo(() => flatLayers(params, `live${reactId}`), [params, reactId]);
  const motion = motionClass(params.idle);
  const shade = shadeClass(params.idle);
  const eyes = moodEyeClass(params.mood);
  const zoom = clamp(params.zoom, 0.82, 1.18);

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
            transform: `scale(${zoom})`,
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
        <div className={`absolute inset-0 ${motion}`} style={{ transformOrigin: layers.motionOrigin }}>
          <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: layers.body }} />
          <div
            className={`absolute inset-0 ${eyes}`}
            style={{ transformOrigin: layers.eyeOrigin }}
            dangerouslySetInnerHTML={{ __html: layers.eyes }}
          />
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
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
      }
      .squish-flat-breathe { animation-name: squish-flat-breathe; }
      .squish-flat-float { animation-name: squish-flat-float; }
      .squish-flat-spin { animation-name: squish-flat-spin; }
      .squish-flat-bounce { animation-name: squish-flat-bounce; }
      .squish-flat-shade-breathe { animation-name: squish-flat-shade-breathe; }
      .squish-flat-shade-float { animation-name: squish-flat-shade-float; }
      .squish-flat-shade-spin { animation-name: squish-flat-shade-spin; }
      .squish-flat-shade-bounce { animation-name: squish-flat-shade-bounce; }
      .squish-flat-blink { animation-duration: calc(var(--squish-flat-dur, 3.2s) * 1.45); animation-name: squish-flat-blink; }
      .squish-flat-joy-eyes { animation-name: squish-flat-joy-eyes; }
      .squish-flat-sleep-eyes { animation-duration: calc(var(--squish-flat-dur, 3.2s) * 1.2); animation-name: squish-flat-sleep-eyes; }
      .squish-flat-wow-eyes { animation-duration: calc(var(--squish-flat-dur, 3.2s) * 0.72); animation-name: squish-flat-wow-eyes; }
      .absolute > svg { display: block; width: 100%; height: 100%; }
      @keyframes squish-flat-breathe {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.06); }
      }
      @keyframes squish-flat-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-28px); }
      }
      @keyframes squish-flat-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes squish-flat-bounce {
        0%, 100% { transform: translateY(0) scale(1, 1); }
        35% { transform: translateY(-36px) scale(0.96, 1.05); }
        55% { transform: translateY(-8px) scale(1.02, 0.98); }
      }
      @keyframes squish-flat-shade-breathe {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.03); opacity: 0.85; }
      }
      @keyframes squish-flat-shade-float {
        0%, 100% { transform: scaleX(1); opacity: 0.9; }
        50% { transform: scaleX(0.82); opacity: 0.5; }
      }
      @keyframes squish-flat-shade-spin {
        from { transform: rotate(0deg) scale(0.96); }
        to { transform: rotate(360deg) scale(0.96); }
      }
      @keyframes squish-flat-shade-bounce {
        0%, 100% { transform: scale(1); opacity: 0.85; }
        35% { transform: scale(0.88, 0.92) translateY(6px); opacity: 0.55; }
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
        .squish-flat-wow-eyes { animation: none; }
      }
    `}</style>
  );
}
