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
    eyeInset,
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
          eyeInset,
          mood,
        }),
      );
      // Wait out a rapid randomize burst: only the last frame is rendered.
    }, 220);
    return () => window.clearTimeout(timer);
  }, [
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
    eyeInset,
    mood,
  ]);

  return (
    <div className="preview-ring">
      {src ? (
        <img src={src} alt="" width={128} height={128} style={{ display: "block", width: 128, height: 128 }} />
      ) : null}
    </div>
  );
}
