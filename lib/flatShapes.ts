import { FLAT_VIEW, type FlatSilhouetteId } from "./flatTypes";

/**
 * Original soft silhouettes for Flat mode.
 * Outlines are generated here (unions, polars, stadiums, rounded polygons),
 * then a fixed perspective pose tilts them. Nothing is traced from a brand set.
 */

export type Pt = [number, number];

export type SilhouetteGeometry = {
  id: FlatSilhouetteId;
  label: string;
  body: Pt[];
  gloss: Pt[];
  glossHot: Pt[];
  shade: Pt[];
  /** Fitted local-space eye line (y up) and half-gap before perspective. */
  eyeY: number;
  eyeGap: number;
  eyeScale: number;
};

const ROT_Y = (-20 * Math.PI) / 180;
const ROT_X = (-20 * Math.PI) / 180;
const YAW = (-11 * Math.PI) / 180;
const FOCAL = 300;
const FIT_RADIUS = 64;

const COS_Y = Math.cos(ROT_Y);
const SIN_Y = Math.sin(ROT_Y);
const COS_X = Math.cos(ROT_X);
const SIN_X = Math.sin(ROT_X);
const COS_YAW = Math.cos(YAW);
const SIN_YAW = Math.sin(YAW);

/** Local y-up point → SVG pixel, with in-plane yaw and a mild perspective tilt. */
export function projectLocal(x: number, y: number): Pt {
  const x0 = x * COS_YAW - y * SIN_YAW;
  const y0 = x * SIN_YAW + y * COS_YAW;
  const x1 = x0 * COS_Y;
  const y1 = y0;
  const z1 = -x0 * SIN_Y;
  const y2 = y1 * COS_X - z1 * SIN_X;
  const z2 = y1 * SIN_X + z1 * COS_X;
  const scale = FOCAL / (FOCAL - z2);
  return [FLAT_VIEW.cx + x1 * scale, FLAT_VIEW.cy - y2 * scale];
}

type Circle = { x: number; y: number; r: number };

type ShapeDraft = {
  id: FlatSilhouetteId;
  label: string;
  points: Pt[];
  /** Fraction down from the top of the fitted bounds. */
  eyeDrop: number;
  eyeGap: number;
  eyeScale: number;
};

const SHAPE_DRAFTS: ShapeDraft[] = [
  {
    id: "cloud",
    label: "Облако",
    points: smooth(rayUnion([
      { x: -24, y: 2, r: 42 },
      { x: 26, y: 5, r: 40 },
      { x: 0, y: -4, r: 30 },
    ]), 1),
    eyeDrop: 0.48,
    eyeGap: 15,
    eyeScale: 0.9,
  },
  {
    id: "blob",
    label: "Клякса",
    points: smooth(rayUnion([
      { x: -4, y: 2, r: 50 },
      { x: 22, y: -12, r: 34 },
      { x: -22, y: -6, r: 32 },
      { x: 6, y: 22, r: 30 },
      { x: -2, y: -22, r: 28 },
    ]), 1),
    eyeDrop: 0.42,
    eyeGap: 16,
    eyeScale: 1,
  },
  {
    id: "squircle",
    label: "Квадрат",
    points: superellipse(4.4, 58, 54, 96),
    eyeDrop: 0.42,
    eyeGap: 16,
    eyeScale: 1,
  },
  {
    id: "star",
    label: "Звезда",
    points: polar((t) => {
      const lobe = 0.5 + 0.5 * Math.cos(4 * t);
      return 16 + 50 * lobe * lobe;
    }, 140),
    eyeDrop: 0.5,
    eyeGap: 11,
    eyeScale: 0.7,
  },
  {
    id: "flower",
    label: "Цветок",
    points: polar((t) => {
      const lobe = 0.5 + 0.5 * Math.cos(6 * (t - Math.PI / 2));
      return 24 + 40 * Math.pow(lobe, 1.35);
    }, 160),
    eyeDrop: 0.5,
    eyeGap: 11,
    eyeScale: 0.68,
  },
  {
    id: "drop",
    label: "Капля",
    points: sampleChain([
      [[0, 76], [-12, 46], [-60, 8], [-48, -26]],
      [[-48, -26], [-36, -68], [-16, -74], [0, -74]],
      [[0, -74], [16, -74], [36, -68], [48, -26]],
      [[48, -26], [60, 8], [12, 46], [0, 76]],
    ], 20),
    eyeDrop: 0.58,
    eyeGap: 14,
    eyeScale: 0.84,
  },
  {
    id: "capsule",
    label: "Капсула",
    points: stadium(30, 36, 72),
    eyeDrop: 0.4,
    eyeGap: 14,
    eyeScale: 0.9,
  },
  {
    id: "triangle",
    label: "Треугольник",
    points: roundedPoly(
      [
        [0, 70],
        [-62, -48],
        [62, -48],
      ],
      [12, 20, 20],
    ),
    eyeDrop: 0.64,
    eyeGap: 14,
    eyeScale: 0.72,
  },
  {
    id: "pentagon",
    label: "Пятиугольник",
    points: roundedPoly(regular(5, 62, Math.PI / 2), 16),
    eyeDrop: 0.46,
    eyeGap: 15,
    eyeScale: 0.9,
  },
  {
    id: "heart",
    label: "Сердце",
    points: heart(120),
    eyeDrop: 0.4,
    eyeGap: 15,
    eyeScale: 0.88,
  },
  {
    id: "hex",
    label: "Шестиугольник",
    points: roundedPoly(regular(6, 60, Math.PI / 2), 14),
    eyeDrop: 0.44,
    eyeGap: 15,
    eyeScale: 0.92,
  },
  {
    id: "cottage",
    label: "Домик",
    points: roundedPoly(
      [
        [0, 72],
        [-56, 16],
        [-56, -52],
        [56, -52],
        [56, 16],
      ],
      [10, 16, 18, 18, 16],
    ),
    eyeDrop: 0.62,
    eyeGap: 15,
    eyeScale: 0.8,
  },
];

export const FLAT_SILHOUETTES: SilhouetteGeometry[] = SHAPE_DRAFTS.map(bake);

const BY_ID = new Map(FLAT_SILHOUETTES.map((shape) => [shape.id, shape]));

export function flatSilhouette(id: FlatSilhouetteId) {
  const shape = BY_ID.get(id);
  if (!shape) throw new Error(`Нет силуэта ${id}`);
  return shape;
}

function bake(draft: ShapeDraft): SilhouetteGeometry {
  const fitted = fit(draft.points, FIT_RADIUS);
  assertPoints(fitted, draft.id);
  const box = bounds(fitted);
  const eyeY = box.maxY - box.h * draft.eyeDrop;
  const gloss = project(ellipse(box.minX + box.w * 0.34, box.maxY - box.h * 0.28, box.w * 0.28, box.h * 0.17, 40));
  const glossHot = project(ellipse(box.minX + box.w * 0.3, box.maxY - box.h * 0.24, box.w * 0.14, box.h * 0.09, 28));
  const shade = project(ellipse(box.cx + box.w * 0.02, box.minY + box.h * 0.22, box.w * 0.48, box.h * 0.28, 40));
  return {
    id: draft.id,
    label: draft.label,
    body: project(fitted),
    gloss,
    glossHot,
    shade,
    eyeY,
    eyeGap: draft.eyeGap,
    eyeScale: draft.eyeScale,
  };
}

function project(pts: Pt[]) {
  return pts.map(([x, y]) => projectLocal(x, y));
}

function assertPoints(pts: Pt[], id: string) {
  if (pts.length < 24) throw new Error(`${id}: мало точек`);
  for (const [x, y] of pts) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`${id}: нечисловой контур`);
  }
}

type Bounds = { minX: number; maxX: number; minY: number; maxY: number; w: number; h: number; cx: number; cy: number };

function bounds(pts: Pt[]): Bounds {
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
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

function fit(pts: Pt[], radius: number): Pt[] {
  const box = bounds(pts);
  const half = Math.max(box.w, box.h) / 2 || 1;
  const scale = radius / half;
  return pts.map(([x, y]) => [(x - box.cx) * scale, (y - box.cy) * scale]);
}

function smooth(pts: Pt[], passes: number): Pt[] {
  let current = pts;
  for (let pass = 0; pass < passes; pass++) {
    const n = current.length;
    current = current.map((pt, index) => {
      const prev = current[(index - 1 + n) % n];
      const next = current[(index + 1) % n];
      return [(prev[0] + pt[0] * 2 + next[0]) / 4, (prev[1] + pt[1] * 2 + next[1]) / 4] as Pt;
    });
  }
  return current;
}

function rayUnion(circles: Circle[], samples = 140): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * Math.PI * 2;
    const radius = rayExit(Math.cos(angle), Math.sin(angle), circles);
    pts.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  return pts;
}

function rayExit(dx: number, dy: number, circles: Circle[]) {
  let best = 0;
  for (const circle of circles) {
    const b = circle.x * dx + circle.y * dy;
    const c = circle.x * circle.x + circle.y * circle.y - circle.r * circle.r;
    const disc = b * b - c;
    if (disc <= 0) continue;
    const t = b + Math.sqrt(disc);
    if (t > best) best = t;
  }
  return best;
}

function polar(radiusAt: (angle: number) => number, samples: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * Math.PI * 2;
    const radius = radiusAt(angle);
    pts.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  return pts;
}

function superellipse(n: number, rx: number, ry: number, samples: number): Pt[] {
  const exp = 2 / n;
  const pts: Pt[] = [];
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * Math.PI * 2;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    pts.push([Math.sign(c) * rx * Math.abs(c) ** exp, Math.sign(s) * ry * Math.abs(s) ** exp]);
  }
  return pts;
}

function regular(sides: number, radius: number, rotation: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = rotation + (i / sides) * Math.PI * 2;
    pts.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  return pts;
}

/** Vertical stadium. `straight` is the half-length of the flat sides. */
function stadium(radius: number, straight: number, samples: number): Pt[] {
  const cap = Math.floor(samples / 2);
  const pts: Pt[] = [];
  for (let i = 0; i < cap; i++) {
    const angle = (i / cap) * Math.PI;
    pts.push([Math.cos(angle) * radius, straight + Math.sin(angle) * radius]);
  }
  for (let i = 0; i < cap; i++) {
    const angle = Math.PI + (i / cap) * Math.PI;
    pts.push([Math.cos(angle) * radius, -straight + Math.sin(angle) * radius]);
  }
  return pts;
}

function heart(samples: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push([x, y]);
  }
  return pts;
}

function ellipse(cx: number, cy: number, rx: number, ry: number, samples: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * Math.PI * 2;
    pts.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
  }
  return pts;
}

function roundedPoly(vertices: Pt[], radius: number | number[], edgeSamples = 8, cornerSamples = 10): Pt[] {
  const n = vertices.length;
  const radii = Array.isArray(radius) ? radius : vertices.map(() => radius);
  const corners = vertices.map((vertex, index) => {
    const prev = vertices[(index - 1 + n) % n];
    const next = vertices[(index + 1) % n];
    const inX = prev[0] - vertex[0];
    const inY = prev[1] - vertex[1];
    const outX = next[0] - vertex[0];
    const outY = next[1] - vertex[1];
    const inLen = Math.hypot(inX, inY) || 1;
    const outLen = Math.hypot(outX, outY) || 1;
    const inUx = inX / inLen;
    const inUy = inY / inLen;
    const outUx = outX / outLen;
    const outUy = outY / outLen;
    const dot = clamp(inUx * outUx + inUy * outUy, -1, 1);
    const interior = Math.acos(dot);
    let trim = (radii[index] ?? 12) / Math.tan(Math.max(interior, 0.2) / 2);
    trim = Math.min(trim, inLen / 2 - 0.5, outLen / 2 - 0.5);
    if (!Number.isFinite(trim) || trim < 0.5) trim = Math.min(inLen, outLen) / 4;
    return {
      vertex,
      start: [vertex[0] + inUx * trim, vertex[1] + inUy * trim] as Pt,
      end: [vertex[0] + outUx * trim, vertex[1] + outUy * trim] as Pt,
    };
  });

  const pts: Pt[] = [];
  for (let index = 0; index < n; index++) {
    const prev = corners[(index - 1 + n) % n];
    const corner = corners[index];
    for (let step = 0; step < edgeSamples; step++) {
      pts.push(lerp(prev.end, corner.start, step / edgeSamples));
    }
    for (let step = 0; step < cornerSamples; step++) {
      pts.push(quad(corner.start, corner.vertex, corner.end, step / cornerSamples));
    }
  }
  return pts;
}

function sampleChain(segments: [Pt, Pt, Pt, Pt][], perSegment: number): Pt[] {
  const pts: Pt[] = [];
  for (const [a, b, c, d] of segments) {
    for (let step = 0; step < perSegment; step++) pts.push(cubic(a, b, c, d, step / perSegment));
  }
  return pts;
}

function cubic(a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
}

function quad(a: Pt, b: Pt, c: Pt, t: number): Pt {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]];
}

function lerp(a: Pt, b: Pt, t: number): Pt {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
