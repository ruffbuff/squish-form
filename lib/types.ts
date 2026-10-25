export type SilhouetteId = "blob" | "bean" | "squircle" | "pear" | "pill" | "bun" | "mochi" | "bud";

export type MaterialId = "matte" | "jelly" | "clay" | "gloss" | "pearl";

export type IdleId = "none" | "breathe" | "sway" | "bounce" | "spin" | "float";

export type EyeStyle = "dots" | "ovals";

export type EyeMood = "calm" | "joy" | "sleep" | "wow";

export type SurfaceMode = "smooth" | "poly";

export type ColorMode = "solid" | "gradient";

export type BackdropId = "empty" | "studio" | "grid";

export type QualityTier = 0 | 1 | 2;

export type AvatarParams = {
  silhouette: SilhouetteId;
  color: string;
  material: MaterialId;
  idle: IdleId;
  eyes: EyeStyle;
  mood: EyeMood;
  /** Multiplier on the black-dot size. */
  eyeSize: number;
  /** 0–1. Higher presses the eyes into the mesh. */
  eyeInset: number;
  surface: SurfaceMode;
  colorMode: ColorMode;
  colorB: string;
  /** 0–1, full turn of the gradient axis. */
  gradientAngle: number;
  gradientSoft: boolean;
  /** 0–1 fresnel rim. Zero is off. */
  rim: number;
  /** 0–1 playback rate for every motion. */
  speed: number;
  /** 0–1 ease. Low is snappy, high is soft. */
  smoothness: number;
  backdrop: BackdropId;
  lightOn: boolean;
  /** 0–1, highlight point light from left to right. */
  lightX: number;
  /** 0–1, highlight point light from low to high. */
  lightY: number;
  /** 0–1, highlight strength while the light is on. */
  lightIntensity: number;
  /** 0–1 mesh density, pixel ratio, and contact shadow. */
  quality: number;
  /** Contact shadow under the avatar in the viewport. */
  shadowOn: boolean;
  follow: boolean;
  tap: boolean;
};

export function qualityTier(value: number): QualityTier {
  if (value < 0.34) return 0;
  if (value < 0.67) return 1;
  return 2;
}
