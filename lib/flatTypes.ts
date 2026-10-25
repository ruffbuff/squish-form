export type FlatSilhouetteId =
  | "cloud"
  | "blob"
  | "squircle"
  | "star"
  | "flower"
  | "drop"
  | "capsule"
  | "triangle"
  | "pentagon"
  | "heart"
  | "hex"
  | "cottage";

export type FlatFillId = "flat" | "gloss" | "matte" | "jelly";

export type FlatEyeStyle = "dots" | "capsules";

export type FlatEyeMood = "calm" | "joy" | "sleep" | "wow";

export type FlatIdleId = "none" | "breathe" | "float" | "spin" | "bounce";

export type FlatColorMode = "solid" | "gradient";

export type FlatParams = {
  silhouette: FlatSilhouetteId;
  color: string;
  colorB: string;
  colorMode: FlatColorMode;
  fill: FlatFillId;
  eyes: FlatEyeStyle;
  mood: FlatEyeMood;
  /** 0.55–1.7, same range the 3D slider uses. */
  eyeSize: number;
  idle: FlatIdleId;
  /** 0–1 playback rate for breathe, float, and the calm blink. */
  speed: number;
  /** 0–1 gradient focal point for two-color fills. */
  gradientCenterX: number;
  gradientCenterY: number;
  /** 0.82–1.18 viewport scale in the playground. Export uses 1. */
  zoom: number;
  shadowOn: boolean;
};

export type PlayMode = "3d" | "flat";

export const MODE_STORAGE_KEY = "squishform-mode";

export const FLAT_INITIAL: FlatParams = {
  silhouette: "cloud",
  color: "#ff8a1f",
  colorB: "#ffd36a",
  colorMode: "solid",
  fill: "jelly",
  eyes: "capsules",
  mood: "calm",
  eyeSize: 1,
  idle: "breathe",
  speed: 0.5,
  gradientCenterX: 0.42,
  gradientCenterY: 0.32,
  zoom: 1,
  shadowOn: true,
};

/** viewBox origin plus size. cx/cy are the SVG position of the local origin. */
export const FLAT_VIEW = { x: 34, y: 46, w: 188, h: 204, cx: 120, cy: 126 };

export const FLAT_EXPORT_PX = { w: 940, h: 1020 };
