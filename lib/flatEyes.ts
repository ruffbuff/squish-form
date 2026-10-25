import type { FlatEyeMood, FlatEyeStyle } from "./flatTypes";
import type { Pt } from "./flatShapes";

export type FlatEyeSize = number;

/**
 * Local-space eye outline (y up) before silhouette perspective projection.
 * `size` matches Flat `eyeSize` (0.55–1.7), already multiplied by silhouette `eyeScale` when called.
 */
export function flatEyeOutline(
  x: number,
  y: number,
  style: FlatEyeStyle,
  mood: FlatEyeMood,
  size: FlatEyeSize,
): Pt[] {
  const scale = clamp(size, 0.55, 1.7);
  if (mood === "joy") {
    const w = (style === "capsules" ? 11.4 : 9.6) * scale;
    const h = (style === "capsules" ? 10.2 : 8.4) * scale;
    return crescent(x, y + h * 0.12, w, h);
  }
  if (mood === "sleep") {
    const w = (style === "capsules" ? 10.8 : 9.2) * scale;
    const h = Math.max(2.2, 2.5 * scale);
    return ellipsePts(x, y - h * 0.15, w, h, 28);
  }
  if (mood === "wow") {
    if (style === "capsules") {
      // Mirror 3D surprise ovals: tall capsule, not a round dot.
      return stadiumPts(x, y, 5.6 * scale, 18.8 * scale, 36);
    }
    const r = 10.2 * scale;
    return ellipsePts(x, y, r, r * 1.06, 32);
  }
  if (style === "capsules") {
    return stadiumPts(x, y, 6.2 * scale, 16.4 * scale, 36);
  }
  const r = 8.6 * scale;
  return ellipsePts(x, y, r, r, 32);
}

function crescent(cx: number, cy: number, w: number, h: number): Pt[] {
  const n = 14;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * 2 - 1;
    const arch = 1 - u * u;
    pts.push([cx + u * w, cy + h * arch]);
  }
  for (let i = n; i >= 0; i--) {
    const u = (i / n) * 2 - 1;
    const arch = 1 - u * u;
    pts.push([cx + u * w, cy + h * 0.34 * arch]);
  }
  return pts;
}

function stadiumPts(cx: number, cy: number, rx: number, ry: number, samples: number): Pt[] {
  const r = Math.min(rx, ry);
  const straight = Math.max(0, ry - r);
  const cap = Math.max(8, Math.floor(samples / 2));
  const pts: Pt[] = [];
  for (let i = 0; i < cap; i++) {
    const angle = (i / cap) * Math.PI;
    pts.push([cx + Math.cos(angle) * r, cy + straight + Math.sin(angle) * r]);
  }
  for (let i = 0; i < cap; i++) {
    const angle = Math.PI + (i / cap) * Math.PI;
    pts.push([cx + Math.cos(angle) * r, cy - straight + Math.sin(angle) * r]);
  }
  return pts;
}

function ellipsePts(cx: number, cy: number, rx: number, ry: number, samples: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * Math.PI * 2;
    pts.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
  }
  return pts;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
