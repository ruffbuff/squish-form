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
  const motion =
    params.idle === "breathe" ? "squish-flat-breathe" : params.idle === "float" ? "squish-flat-float" : "";
  const shade =
    params.idle === "breathe" ? "squish-flat-shade-breathe" : params.idle === "float" ? "squish-flat-shade-float" : "";
  const blink = params.mood === "calm" ? "squish-flat-blink" : "";

  return (
    <div className="flat-stage flex h-full w-full items-center justify-center">
      <FlatMotionStyle />
      <div
        role="img"
        aria-label={layers.label}
        className="relative h-[min(82%,680px)] w-[min(78%,520px)]"
        style={{ "--squish-flat-dur": layers.duration } as CSSProperties}
      >
        <div
          className={`absolute inset-0 ${shade}`}
          style={{ transformOrigin: layers.motionOrigin }}
          dangerouslySetInnerHTML={{ __html: layers.shadow }}
        />
        <div className={`absolute inset-0 ${motion}`} style={{ transformOrigin: layers.motionOrigin }}>
          <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: layers.body }} />
          <div
            className={`absolute inset-0 ${blink}`}
            style={{ transformOrigin: layers.eyeOrigin }}
            dangerouslySetInnerHTML={{ __html: layers.eyes }}
          />
        </div>
      </div>
    </div>
  );
}

function FlatMotionStyle() {
  return (
    <style>{`
      .squish-flat-breathe,
      .squish-flat-float,
      .squish-flat-shade-breathe,
      .squish-flat-shade-float,
      .squish-flat-blink {
        animation-duration: var(--squish-flat-dur, 3.2s);
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
      }
      .squish-flat-breathe { animation-name: squish-flat-breathe; }
      .squish-flat-float { animation-name: squish-flat-float; }
      .squish-flat-shade-breathe { animation-name: squish-flat-shade-breathe; }
      .squish-flat-shade-float { animation-name: squish-flat-shade-float; }
      .squish-flat-blink { animation-duration: calc(var(--squish-flat-dur, 3.2s) * 1.45); animation-name: squish-flat-blink; }
      .absolute > svg { display: block; width: 100%; height: 100%; }
      @keyframes squish-flat-breathe {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.06); }
      }
      @keyframes squish-flat-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-28px); }
      }
      @keyframes squish-flat-shade-breathe {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); }
      }
      @keyframes squish-flat-shade-float {
        0%, 100% { transform: scaleX(1); opacity: 1; }
        50% { transform: scaleX(0.78); opacity: 0.45; }
      }
      @keyframes squish-flat-blink {
        0%, 82%, 100% { transform: scaleY(1); }
        90% { transform: scaleY(0.08); }
      }
      @media (prefers-reduced-motion: reduce) {
        .squish-flat-breathe,
        .squish-flat-float,
        .squish-flat-shade-breathe,
        .squish-flat-shade-float,
        .squish-flat-blink { animation: none; }
      }
    `}</style>
  );
}
