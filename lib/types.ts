export type SilhouetteId = "blob" | "bean" | "squircle";

export type MaterialId = "matte" | "jelly" | "clay";

export type IdleId = "breathe" | "sway" | "both";

export type AvatarParams = {
  silhouette: SilhouetteId;
  color: string;
  material: MaterialId;
  idle: IdleId;
};
