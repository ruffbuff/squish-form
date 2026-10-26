import { flatEyeOutline } from "./flatEyes";
import { flatDuration } from "./flatMotion";
import { FLAT_EXPORT_PX, FLAT_VIEW, type FlatParams } from "./flatTypes";
import { flatSilhouette, projectLocal, type Pt, type SilhouetteGeometry } from "./flatShapes";

export type FlatFrame = "stage" | "icon" | "medal" | "export";

type FrameStyle = {
  blur: number;
  shadow: number;
  width: string;
  height: string;
};

const FRAMES: Record<FlatFrame, FrameStyle> = {
  stage: { blur: 4.2, shadow: 0.85, width: "100%", height: "100%" },
  icon: { blur: 1.8, shadow: 0.55, width: "100%", height: "100%" },
  medal: { blur: 3.2, shadow: 0.75, width: "100%", height: "100%" },
  export: { blur: 4.2, shadow: 0.85, width: String(FLAT_EXPORT_PX.w), height: String(FLAT_EXPORT_PX.h) },
};

export type FlatLayers = {
  shadow: string;
  /** Extruded side wall behind the card, so quarter turns read as 2.5D. */
  edge: string;
  body: string;
  eyes: string;
  /** CSS transform-origin for breathe / float, as percentages of the frame. */
  motionOrigin: string;
  eyeOrigin: string;
  duration: string;
  label: string;
};

export type FlatRenderOptions = {
  /** Playground export framing ignores zoom; stage honors it. */
  ignoreZoom?: boolean;
};

export function flatSvg(params: FlatParams, frame: FlatFrame, prefix: string, options?: FlatRenderOptions) {
  const parts = renderParts(params, frame, prefix, options);
  return wrap(parts.defs, parts.shadow + parts.edge + parts.body + parts.eyes, frame, false, labelFor(params));
}

export function flatLayers(params: FlatParams, prefix: string): FlatLayers {
  const parts = renderParts(params, "stage", prefix);
  return {
    shadow: wrap(parts.shadowDefs, parts.shadow, "stage", true),
    edge: wrap(parts.edgeDefs, parts.edge, "stage", true),
    body: wrap(parts.bodyDefs, parts.body, "stage", true),
    eyes: wrap("", parts.eyes, "stage", true),
    motionOrigin: parts.motionOrigin,
    eyeOrigin: parts.eyeOrigin,
    duration: flatDuration(params.speed),
    label: labelFor(params),
  };
}

function renderParts(params: FlatParams, frame: FlatFrame, prefix: string, _options?: FlatRenderOptions) {
  const shape = flatSilhouette(params.silhouette);
  const style = FRAMES[frame];
  const safe = prefix.replace(/[^a-zA-Z0-9_-]/g, "") || "flat";
  const body = linePath(shape.body);
  const shadowLift = 5.5 * style.shadow;
  const shadowSkew = 2.8 * style.shadow;
  const shadowPath = linePath(shape.body.map(([x, y]) => [x + shadowSkew, y + shadowLift]));
  const eyes = eyePaths(shape, params.eyes, params.mood, params.eyeSize);
  const frameShift = centerShift(shape.body);
  const showGloss = params.fill === "gloss" || params.fill === "jelly";
  const showShade = params.fill === "matte" || params.fill === "jelly" || params.fill === "duo" || params.fill === "speckled";
  const showSpeckle = params.fill === "speckled";
  const glossId = `${safe}-gloss`;
  const hotId = `${safe}-hot`;
  const shadeId = `${safe}-shade`;
  const fillId = `${safe}-fill`;
  const clipId = `${safe}-clip`;
  const blurId = `${safe}-blur`;
  const speckId = `${safe}-speck`;
  const edgeId = `${safe}-edge`;
  const paint = fillAttrs(params, fillId);
  const edge = edgeLayer(shape.body, params, edgeId);

  const defs = [
    `<filter id="${blurId}" filterUnits="userSpaceOnUse" x="${FLAT_VIEW.x}" y="${FLAT_VIEW.y}" width="${FLAT_VIEW.w}" height="${FLAT_VIEW.h}">`,
    `<feGaussianBlur stdDeviation="${style.blur}"/>`,
    `</filter>`,
    `<clipPath id="${clipId}"><path d="${body}"/></clipPath>`,
    paint.def,
    showGloss ? radial(glossId, "#ffffff", 0.72, 0) : "",
    showGloss ? radial(hotId, "#ffffff", 0.9, 0) : "",
    showShade ? radial(shadeId, "#000000", params.fill === "matte" ? 0.3 : 0.22, 0) : "",
    showSpeckle ? specklePattern(speckId, paintHex(params.colorB)) : "",
    edge.def,
  ].join("");

  const overlays = [    showGloss ? `<path d="${linePath(shape.gloss)}" fill="url(#${glossId})"/>` : "",
    showGloss ? `<path d="${linePath(shape.glossHot)}" fill="url(#${hotId})"/>` : "",
    showShade ? `<path d="${linePath(shape.shade)}" fill="url(#${shadeId})"/>` : "",
    showSpeckle ? `<rect x="${FLAT_VIEW.x}" y="${FLAT_VIEW.y}" width="${FLAT_VIEW.w}" height="${FLAT_VIEW.h}" fill="url(#${speckId})" opacity="0.42"/>` : "",
  ].join("");

  const eyeCenter = projectLocal(0, shape.eyeY);
  const bodyCenter = centroid(shape.body);

  return {
    defs,
    shadowDefs: `<filter id="${blurId}" filterUnits="userSpaceOnUse" x="${FLAT_VIEW.x}" y="${FLAT_VIEW.y}" width="${FLAT_VIEW.w}" height="${FLAT_VIEW.h}"><feGaussianBlur stdDeviation="${style.blur}"/></filter>`,
    edgeDefs: edge.def,
    bodyDefs: [
      paint.def,
      `<clipPath id="${clipId}"><path d="${body}"/></clipPath>`,
      showGloss ? radial(glossId, "#ffffff", 0.72, 0) : "",
      showGloss ? radial(hotId, "#ffffff", 0.9, 0) : "",
      showShade ? radial(shadeId, "#000000", params.fill === "matte" ? 0.3 : 0.22, 0) : "",
      showSpeckle ? specklePattern(speckId, paintHex(params.colorB)) : "",
    ].join(""),
    shadow: params.shadowOn
      ? framed(frameShift, `<path d="${shadowPath}" fill="#120c0a" opacity="0.28" filter="url(#${blurId})"/>`)
      : "",
    edge: framed(frameShift, edge.svg),
    body: framed(
      frameShift,
      `<g clip-path="url(#${clipId})"><path d="${body}" fill="${paint.fill}"/><g>${overlays}</g></g>`,
    ),
    eyes: framed(frameShift, eyes.map((d) => `<path d="${d}" fill="#0e0c0a"/>`).join("")),
    motionOrigin: origin(bodyCenter[0] + frameShift[0], bodyCenter[1] + frameShift[1]),
    eyeOrigin: origin(eyeCenter[0] + frameShift[0], eyeCenter[1] + frameShift[1]),
  };
}

/** Thickness in viewBox units. Offset points away from the light, so the
 * wall sits on the lower-right and the body keeps a lit top-left face. */
const EDGE_DX = 3.6;
const EDGE_DY = 4.6;

/**
 * A shallow extrusion of the silhouette: the whole outline is drawn again,
 * shifted away from the light. The body hides it at rest except for a thin
 * lit rim; when the turntable narrows the face at quarter turns the same
 * plate fills the gap and reads as a solid side wall.
 */
function edgeLayer(body: Pt[], params: FlatParams, id: string) {
  const primary = paintHex(params.color);
  const secondary = params.colorMode === "gradient" ? paintHex(params.colorB) : primary;
  const lit = mix(primary, "#ffffff", 0.32);
  const base = mix(mix(primary, secondary, 0.5), "#000000", 0.34);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of body) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const shift = ([x, y]: Pt): Pt => [x + EDGE_DX, y + EDGE_DY];
  const outer = linePath(body.map(shift));
  const def = [
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${fmt(minX)}" y1="${fmt(minY)}" x2="${fmt(maxX + EDGE_DX)}" y2="${fmt(maxY + EDGE_DY)}">`,
    `<stop offset="0%" stop-color="${lit}"/>`,
    `<stop offset="55%" stop-color="${base}"/>`,
    `<stop offset="100%" stop-color="${mix(base, "#000000", 0.22)}"/>`,
    `</linearGradient>`,
  ].join("");
  const svg = [
    `<path d="${outer}" fill="url(#${id})"/>`,
    `<path d="${outer}" fill="none" stroke="${lit}" stroke-opacity="0.42" stroke-width="1.1" stroke-linejoin="round"/>`,
  ].join("");
  return { def, svg };
}

function wrap(defs: string, inner: string, frame: FlatFrame, hidden: boolean, label?: string) {  const style = FRAMES[frame];
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
  const gx = Math.round(clamp(params.gradientCenterX, 0, 1) * 100);
  const gy = Math.round(clamp(params.gradientCenterY, 0, 1) * 100);
  if (params.fill === "duo") {
    const inner = mix(primary, secondary, 0.38);
    const edge = mix(secondary, "#000000", 0.12);
    return {
      fill: `url(#${id})`,
      def: `<radialGradient id="${id}" cx="${gx}%" cy="${gy}%" r="82%"><stop offset="0%" stop-color="${mix(primary, "#ffffff", 0.2)}"/><stop offset="42%" stop-color="${inner}"/><stop offset="100%" stop-color="${edge}"/></radialGradient>`,
    };
  }
  if (params.fill === "speckled") {
    const speck = mix(secondary, "#ffffff", 0.35);
    return {
      fill: `url(#${id})`,
      def: `<radialGradient id="${id}" cx="${gx}%" cy="${gy}%" r="78%"><stop offset="0%" stop-color="${primary}"/><stop offset="55%" stop-color="${mix(primary, speck, 0.35)}"/><stop offset="100%" stop-color="${mix(secondary, "#000000", 0.1)}"/></radialGradient>`,
    };
  }
  if (params.fill === "jelly") {
    const top = mix(primary, "#ffffff", 0.34);
    const bottom = params.colorMode === "gradient" ? secondary : mix(secondary, "#000000", 0.16);
    return {
      fill: `url(#${id})`,
      def: `<radialGradient id="${id}" cx="${gx}%" cy="${gy}%" r="76%"><stop offset="0%" stop-color="${top}"/><stop offset="48%" stop-color="${primary}"/><stop offset="100%" stop-color="${bottom}"/></radialGradient>`,
    };
  }
  if (params.fill === "matte") {
    const bottom = mix(secondary, "#000000", 0.2);
    return {
      fill: `url(#${id})`,
      def: `<linearGradient id="${id}" x1="${gx}%" y1="${gy}%" x2="${gx + 8}%" y2="${gy + 72}%"><stop offset="0%" stop-color="${primary}"/><stop offset="100%" stop-color="${bottom}"/></linearGradient>`,
    };
  }
  if (params.colorMode === "gradient") {
    const top = params.fill === "gloss" ? mix(primary, "#ffffff", 0.08) : primary;
    const x2 = clamp(params.gradientCenterX + 0.48, 0, 1);
    const y2 = clamp(params.gradientCenterY + 0.55, 0, 1);
    return {
      fill: `url(#${id})`,
      def: `<linearGradient id="${id}" x1="${gx}%" y1="${gy}%" x2="${Math.round(x2 * 100)}%" y2="${Math.round(y2 * 100)}%"><stop offset="0%" stop-color="${top}"/><stop offset="100%" stop-color="${secondary}"/></linearGradient>`,
    };
  }
  return { fill: primary, def: "" };
}

function specklePattern(id: string, accent: string) {
  const dots = [
    [0.18, 0.22, 0.9],
    [0.42, 0.38, 0.7],
    [0.66, 0.28, 0.85],
    [0.32, 0.58, 0.65],
    [0.58, 0.62, 0.75],
    [0.74, 0.48, 0.55],
  ]
    .map(
      ([x, y, r]) =>
        `<circle cx="${Math.round(x * 100)}%" cy="${Math.round(y * 100)}%" r="${r}" fill="${accent}" opacity="0.35"/>`,
    )
    .join("");
  return `<pattern id="${id}" width="100%" height="100%" patternUnits="objectBoundingBox">${dots}</pattern>`;
}

function radial(id: string, color: string, start: number, end: number) {
  return `<radialGradient id="${id}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${color}" stop-opacity="${start}"/><stop offset="55%" stop-color="${color}" stop-opacity="${(start * 0.35).toFixed(2)}"/><stop offset="100%" stop-color="${color}" stop-opacity="${end}"/></radialGradient>`;
}

function eyePaths(shape: SilhouetteGeometry, style: FlatParams["eyes"], mood: FlatParams["mood"], eyeSize: number) {
  const scale = clamp(eyeSize, 0.55, 1.7) * shape.eyeScale;
  const left = flatEyeOutline(-shape.eyeGap, shape.eyeY, style, mood, scale);
  const right = flatEyeOutline(shape.eyeGap, shape.eyeY, style, mood, scale);
  return [linePath(left.map(([x, y]) => projectLocal(x, y))), linePath(right.map(([x, y]) => projectLocal(x, y)))];
}

function centerShift(body: Pt[]): Pt {
  const box = bounds(body);
  const targetX = FLAT_VIEW.x + FLAT_VIEW.w / 2;
  const targetY = FLAT_VIEW.y + FLAT_VIEW.h / 2;
  return [targetX - (box.minX + box.maxX) / 2, targetY - (box.minY + box.maxY) / 2];
}

function bounds(pts: Pt[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return { minX, maxX, minY, maxY };
}

function framed(shift: Pt, inner: string) {
  if (!inner) return "";
  if (Math.abs(shift[0]) < 0.01 && Math.abs(shift[1]) < 0.01) return inner;
  return `<g transform="translate(${fmt(shift[0])} ${fmt(shift[1])})">${inner}</g>`;
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
