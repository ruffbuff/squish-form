import { FLAT_INITIAL, type FlatParams } from "./flatTypes";

export type FlatPreset = {
  id: string;
  label: string;
  params: Partial<FlatParams>;
};

export const FLAT_PRESETS: FlatPreset[] = [
  {
    id: "neon",
    label: "Неон",
    params: {
      silhouette: "cloud",
      color: "#40ea34",
      colorB: "#0b3b22",
      colorMode: "gradient",
      fill: "jelly",
      eyes: "capsules",
      mood: "wow",
      idle: "float",
      speed: 0.6,
      smoothness: 0.8,
    },
  },
  {
    id: "jade",
    label: "Изумруд",
    params: {
      silhouette: "drop",
      color: "#34d399",
      colorB: "#065f46",
      colorMode: "gradient",
      fill: "gloss",
      eyes: "dots",
      mood: "calm",
      idle: "breathe",
      speed: 0.4,
      smoothness: 0.7,
    },
  },
  {
    id: "sunset",
    label: "Закат",
    params: {
      silhouette: "blob",
      color: "#ff8a1f",
      colorB: "#e879f9",
      colorMode: "gradient",
      fill: "duo",
      eyes: "capsules",
      mood: "joy",
      idle: "bounce",
      speed: 0.7,
      smoothness: 0.85,
    },
  },
  {
    id: "ice",
    label: "Лёд",
    params: {
      silhouette: "squircle",
      color: "#7ec8ff",
      colorB: "#e0f2fe",
      colorMode: "gradient",
      fill: "matte",
      eyes: "dots",
      mood: "wow",
      idle: "spin",
      speed: 0.55,
      smoothness: 0.9,
    },
  },
  {
    id: "mint",
    label: "Мята",
    params: {
      silhouette: "heart",
      color: "#a3e635",
      colorB: "#166534",
      colorMode: "gradient",
      fill: "speckled",
      eyes: "capsules",
      mood: "sleep",
      idle: "breathe",
      speed: 0.25,
      smoothness: 0.5,
    },
  },
  {
    id: "ember",
    label: "Уголь",
    params: {
      silhouette: "star",
      color: "#fb7185",
      colorB: "#3f1d2e",
      colorMode: "gradient",
      fill: "gloss",
      eyes: "dots",
      mood: "calm",
      idle: "float",
      speed: 0.5,
      smoothness: 0.75,
    },
  },
];

export function applyFlatPreset(params: FlatParams, preset: FlatPreset): FlatParams {
  return { ...params, ...preset.params };
}

/**
 * Compact URL-safe token. Keys are shortened so a full look fits in a
 * readable Telegram share link; zoom is omitted because it is viewport
 * specific and should not travel with the character.
 */
const KEY_CODES: Record<Exclude<keyof FlatParams, "zoom">, string> = {
  silhouette: "s",
  color: "c",
  colorB: "b",
  colorMode: "m",
  fill: "f",
  eyes: "e",
  mood: "o",
  eyeSize: "z",
  idle: "i",
  speed: "v",
  smoothness: "u",
  gradientCenterX: "x",
  gradientCenterY: "y",
  shadowOn: "h",
  follow: "g",
};

const CODE_KEYS = Object.fromEntries(
  Object.entries(KEY_CODES).map(([key, code]) => [code, key]),
) as Record<string, Exclude<keyof FlatParams, "zoom">>;

const HEX = /^#[0-9a-fA-F]{6}$/;
const SILHOUETTES = new Set(["cloud", "blob", "squircle", "star", "flower", "drop", "capsule", "triangle", "pentagon", "heart", "hex", "cottage"]);
const FILLS = new Set(["flat", "gloss", "matte", "jelly", "duo", "speckled"]);
const EYES = new Set(["dots", "capsules"]);
const MOODS = new Set(["calm", "joy", "sleep", "wow"]);
const IDLES = new Set(["none", "breathe", "float", "spin", "bounce"]);
const MODES = new Set(["solid", "gradient"]);

type Wire = Record<string, string | number | boolean>;

export function encodeFlatPreset(params: FlatParams): string {
  const wire: Wire = {};
  for (const [key, code] of Object.entries(KEY_CODES)) {
    const value = params[key as keyof FlatParams];
    if (value === undefined) continue;
    wire[code] = value;
  }
  const bytes = new TextEncoder().encode(JSON.stringify(wire));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeFlatPreset(token: string | null | undefined): Partial<FlatParams> | null {
  if (!token) return null;
  try {
    const padded = token.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const patch: Partial<FlatParams> = {};
    for (const [code, raw] of Object.entries(parsed as Wire)) {
      const key = CODE_KEYS[code];
      if (!key) continue;
      const value = coerce(key, raw);
      if (value !== undefined) (patch as Record<string, unknown>)[key] = value;
    }
    return Object.keys(patch).length > 0 ? patch : null;
  } catch {
    return null;
  }
}

function coerce(key: Exclude<keyof FlatParams, "zoom">, raw: unknown): unknown {
  if (key === "silhouette") return typeof raw === "string" && SILHOUETTES.has(raw) ? raw : undefined;
  if (key === "fill") return typeof raw === "string" && FILLS.has(raw) ? raw : undefined;
  if (key === "eyes") return typeof raw === "string" && EYES.has(raw) ? raw : undefined;
  if (key === "mood") return typeof raw === "string" && MOODS.has(raw) ? raw : undefined;
  if (key === "idle") return typeof raw === "string" && IDLES.has(raw) ? raw : undefined;
  if (key === "colorMode") return typeof raw === "string" && MODES.has(raw) ? raw : undefined;
  if (key === "color" || key === "colorB") return typeof raw === "string" && HEX.test(raw) ? raw : undefined;
  if (key === "shadowOn" || key === "follow") return typeof raw === "boolean" ? raw : undefined;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  if (key === "eyeSize") return clamp(raw, 0.55, 1.7);
  if (key === "speed" || key === "smoothness") return clamp(raw, 0, 1);
  if (key === "gradientCenterX" || key === "gradientCenterY") return clamp(raw, 0, 1);
  return undefined;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Full default with a preset applied, used by the UI and tests. */
export function presetParams(preset: FlatPreset): FlatParams {
  return applyFlatPreset(FLAT_INITIAL, preset);
}
