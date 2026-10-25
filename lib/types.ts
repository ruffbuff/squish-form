export type SilhouetteId = "blob" | "bean" | "squircle" | "pear" | "pill" | "bun";

export type MaterialId = "matte" | "jelly" | "clay" | "gloss" | "pearl";

export type IdleId = "breathe" | "sway" | "both";

export type EyeStyle = "dots" | "ovals";

export type QualityTier = 0 | 1 | 2;

export type AvatarParams = {
  silhouette: SilhouetteId;
  color: string;
  material: MaterialId;
  idle: IdleId;
  eyes: EyeStyle;
  /** 0–1, moves the highlight point light from left to right. */
  light: number;
  /** 0–1 mesh density, pixel ratio, and contact shadow. */
  quality: number;
  follow: boolean;
};

export function qualityTier(value: number): QualityTier {
  if (value < 0.34) return 0;
  if (value < 0.67) return 1;
  return 2;
}
