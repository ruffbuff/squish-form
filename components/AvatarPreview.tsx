"use client";

import { useEffect, useState } from "react";
import { renderAvatarStill } from "@/lib/avatarStill";
import type { AvatarParams } from "@/lib/types";

/** Fixed-size stop frame. The sidebar is a flex column, so this must not shrink. */
export function AvatarPreview(props: AvatarParams) {
  const [src, setSrc] = useState<string | null>(null);
  const {
    silhouette,
    color,
    colorB,
    colorMode,
    gradientAngle,
    gradientSoft,
    material,
    surface,
    rim,
    eyes,
    eyeSize,
    mood,
  } = props;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSrc(
        renderAvatarStill({
          silhouette,
          color,
          colorB,
          colorMode,
          gradientAngle,
          gradientSoft,
          material,
          surface,
          rim,
          eyes,
          eyeSize,
          mood,
        }),
      );
    }, 50);
    return () => window.clearTimeout(timer);
  }, [silhouette, color, colorB, colorMode, gradientAngle, gradientSoft, material, surface, rim, eyes, eyeSize, mood]);

  return (
    <div
      style={{
        width: 128,
        height: 128,
        flex: "0 0 128px",
        margin: "0 auto",
        borderRadius: 999,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "#1a1714",
      }}
    >
      {src ? (
        <img src={src} alt="" width={128} height={128} style={{ display: "block", width: 128, height: 128 }} />
      ) : null}
    </div>
  );
}
