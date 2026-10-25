import { FLAT_EXPORT_PX, FLAT_VIEW, type FlatEyeMood, type FlatEyeStyle, type FlatParams } from "./flatTypes";
import { flatSilhouette, projectLocal, type Pt, type SilhouetteGeometry } from "./flatShapes";

export type FlatFrame = "stage" | "icon" | "medal" | "export";

type FrameStyle = {
  blur: number;
  shadow: number;
  width: string;
  height: string;
};

const FRAMES: Record<FlatFrame, FrameStyle> = {
  stage: { blur: 6.5, shadow: 1.05, width: "100%", height: "100%" },
  icon: { blur: 2.2, shadow: 0.7, width: "100%", height: "100%" },
  medal: { blur: 3.2, shadow: 0.85, width: "100%", height: "100%" },
  export: { blur: 6.5, shadow: 1.05, width: String(FLAT_EXPORT_PX.w), height: String(FLAT_EXPORT_PX.h) },
};

export type FlatLayers = {
  shadow: string;
  body: string;
  eyes: string;
  /** CSS transform-origin for breathe / float, as percentages of the frame. */
  motionOrigin: string;
  eyeOrigin: string;
  duration: string;
  label: string;
};

export function flatSvg(params: FlatParams, frame: FlatFrame, prefix: string) {
  const parts = renderParts(params, frame, prefix);
  return wrap(parts.defs, parts.shadow + parts.body + parts.eyes, frame, false, labelFor(params));
}

export function flatLayers(params: FlatParams, prefix: string): FlatLayers {
  const parts = renderParts(params, "stage", prefix);
  return {
    shadow: wrap(parts.shadowDefs, parts.shadow, "stage", true),
    body: wrap(parts.bodyDefs, parts.body, "stage", true),
    eyes: wrap("", parts.eyes, "stage", true),
    motionOrigin: parts.motionOrigin,
    eyeOrigin: parts.eyeOrigin,
    duration: durationOf(params.speed),
    label: labelFor(params),
  };
}

function renderParts(params: FlatParams, frame: FlatFrame, prefix: string) {
  const shape = flatSilhouette(params.silhouette);
  const style = FRAMES[frame];
  const safe = prefix.replace(/[^a-zA-Z0-9_-]/g, "") || "flat";
  const body = linePath(shape.body);
  const shadow = linePath(shape.body.map(([x, y]) => [x + 10 * style.shadow, y + 16 * style.shadow]));
  const eyes = eyePaths(shape, params.eyes, params.mood, params.eyeSize);
  const showGloss = params.fill === "gloss" || params.fill === "jelly";
  const showShade = params.fill === "matte" || params.fill === "jelly";
  const glossId = `${safe}-gloss`;
  const hotId = `${safe}-hot`;
  const shadeId = `${safe}-shade`;
  const fillId = `${safe}-fill`;
  const clipId = `${safe}-clip`;
  const blurId = `${safe}-blur`;
  const paint = fillAttrs(params, fillId);

  const defs = [
    `<filter id="${blurId}" filterUnits="userSpaceOnUse" x="${FLAT_VIEW.x}" y="${FLAT_VIEW.y}" width="${FLAT_VIEW.w}" height="${FLAT_VIEW.h}">`,
    `<feGaussianBlur stdDeviation="${style.blur}"/>`,
    `</filter>`,
    `<clipPath id="${clipId}"><path d="${body}"/></clipPath>`,
    paint.def,
    showGloss ? radial(glossId, "#ffffff", 0.72, 0) : "",
    showGloss ? radial(hotId, "#ffffff", 0.9, 0) : "",
    showShade ? radial(shadeId, "#000000", params.fill === "matte" ? 0.3 : 0.22, 0) : "",
  ].join("");

  const overlays = [
    showGloss ? `<path d="${linePath(shape.gloss)}" fill="url(#${glossId})"/>` : "",
    showGloss ? `<path d="${linePath(shape.glossHot)}" fill="url(#${hotId})"/>` : "",
    showShade ? `<path d="${linePath(shape.shade)}" fill="url(#${shadeId})"/>` : "",
  ].join("");

  const eyeCenter = projectLocal(0, shape.eyeY);
  const bodyCenter = centroid(shape.body);

  return {
    defs,
    shadowDefs: `<filter id="${blurId}" filterUnits="userSpaceOnUse" x="${FLAT_VIEW.x}" y="${FLAT_VIEW.y}" width="${FLAT_VIEW.w}" height="${FLAT_VIEW.h}"><feGaussianBlur stdDeviation="${style.blur}"/></filter>`,
    bodyDefs: [paint.def, `<clipPath id="${clipId}"><path d="${body}"/></clipPath>`, showGloss ? radial(glossId, "#ffffff", 0.72, 0) : "", showGloss ? radial(hotId, "#ffffff", 0.9, 0) : "", showShade ? radial(shadeId, "#000000", params.fill === "matte" ? 0.3 : 0.22, 0) : ""].join(""),
    shadow: `<path d="${shadow}" fill="#140e0c" opacity="0.5" filter="url(#${blurId})"/>`,
    body: `<g clip-path="url(#${clipId})"><path d="${body}" fill="${paint.fill}"/><g>${overlays}</g></g>`,
    eyes: eyes.map((d) => `<path d="${d}" fill="#0e0c0a"/>`).join(""),
    motionOrigin: origin(bodyCenter[0], bodyCenter[1]),
    eyeOrigin: origin(eyeCenter[0], eyeCenter[1]),
  };
}

function wrap(defs: string, inner: string, frame: FlatFrame, hidden: boolean, label?: string) {
  const style = FRAMES[frame];
  const xml = frame === "export" ? `<?xml version="1.0" encoding="UTF-8"?>` : "";
  const labelled = label ? ` role="img" aria-label="${escapeAttr(label)}"` : hidden ? ` aria-hidden="true"` : "";
  return [
    xml,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FLAT_VIEW.x} ${FLAT_VIEW.y} ${FLAT_VIEW.w} ${FLAT_VIEW.h}" width="${style.width}" height="${style.height}"${labelled}>`,
    defs ? `<defs>${defs}</defs>` : "",
    inner,
    `</svg>`,
  ].join("");
}

function labelFor(params: FlatParams) {
  const shape = flatSilhouette(params.silhouette);
  return `Плоский аватар, ${shape.label.toLowerCase()}`;
}

function fillAttrs(params: FlatParams, id: string): { fill: string; def: string } {
  const primary = paintHex(params.color);
  const secondary = params.colorMode === "gradient" ? paintHex(params.colorB) : primary;
  if (params.fill === "jelly") {
    const top = mix(primary, "#ffffff", 0.34);
    const bottom = params.colorMode === "gradient" ? secondary : mix(secondary, "#000000", 0.16);
    return {
      fill: `url(#${id})`,
      def: `<radialGradient id="${id}" cx="40%" cy="32%" r="76%"><stop offset="0%" stop-color="${top}"/><stop offset="48%" stop-color="${primary}"/><stop offset="100%" stop-color="${bottom}"/></radialGradient>`,
    };
  }
  if (params.fill === "matte") {
    const bottom = mix(secondary, "#000000", 0.2);
    return {
      fill: `url(#${id})`,
      def: `<linearGradient id="${id}" x1="0" y1="0" x2="0.15" y2="1"><stop offset="0%" stop-color="${primary}"/><stop offset="100%" stop-color="${bottom}"/></linearGradient>`,
    };
  }
  if (params.colorMode === "gradient") {
    const top = params.fill === "gloss" ? mix(primary, "#ffffff", 0.08) : primary;
    return {
      fill: `url(#${id})`,
      def: `<linearGradient id="${id}" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0%" stop-color="${top}"/><stop offset="100%" stop-color="${secondary}"/></linearGradient>`,
    };
  }
  return { fill: primary, def: "" };
}

function radial(id: string, color: string, start: number, end: number) {
  return `<radialGradient id="${id}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${color}" stop-opacity="${start}"/><stop offset="55%" stop-color="${color}" stop-opacity="${(start * 0.35).toFixed(2)}"/><stop offset="100%" stop-color="${color}" stop-opacity="${end}"/></radialGradient>`;
}

function eyePaths(shape: SilhouetteGeometry, style: FlatEyeStyle, mood: FlatEyeMood, eyeSize: number) {
  const scale = clamp(eyeSize, 0.55, 1.7) * shape.eyeScale;
  const left = eyeOutline(-shape.eyeGap, shape.eyeY, style, mood, scale);
  const right = eyeOutline(shape.eyeGap, shape.eyeY, style, mood, scale);
  return [linePath(left.map(([x, y]) => projectLocal(x, y))), linePath(right.map(([x, y]) => projectLocal(x, y)))];
}

function eyeOutline(x: number, y: number, style: FlatEyeStyle, mood: FlatEyeMood, scale: number): Pt[] {
  if (mood === "joy") {
    const w = (style === "capsules" ? 10.2 : 8.8) * scale;
    const h = (style === "capsules" ? 9 : 7.6) * scale;
    return crescent(x, y + h * 0.1, w, h);
  }
  if (mood === "sleep") {
    const w = (style === "capsules" ? 10 : 8.6) * scale;
    const h = Math.max(2.6, 3.1 * scale);
    return ellipsePts(x, y, w, h, 28);
  }
  if (mood === "wow") {
    const r = (style === "capsules" ? 9.4 : 10.2) * scale;
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

function linePath(pts: Pt[]) {
  return `M ${pts.map((pt) => `${fmt(pt[0])} ${fmt(pt[1])}`).join(" L ")} Z`;
}

function centroid(pts: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const pt of pts) {
    x += pt[0];
    y += pt[1];
  }
  return [x / pts.length, y / pts.length];
}

function origin(x: number, y: number) {
  const px = ((x - FLAT_VIEW.x) / FLAT_VIEW.w) * 100;
  const py = ((y - FLAT_VIEW.y) / FLAT_VIEW.h) * 100;
  return `${px.toFixed(2)}% ${py.toFixed(2)}%`;
}

function durationOf(speed: number) {
  const seconds = 4.4 - clamp(speed, 0, 1) * 2.6;
  return `${seconds.toFixed(2)}s`;
}

function paintHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : "#ff8a1f";
}

function mix(a: string, b: string, t: number) {
  const from = rgb(paintHex(a));
  const to = rgb(paintHex(b));
  const channel = (index: number) => Math.round(from[index] + (to[index] - from[index]) * t);
  return `#${hex(channel(0))}${hex(channel(1))}${hex(channel(2))}`;
}

function rgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function hex(channel: number) {
  return Math.min(255, Math.max(0, channel)).toString(16).padStart(2, "0");
}

function fmt(value: number) {
  return (Math.round(value * 100) / 100).toString();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
