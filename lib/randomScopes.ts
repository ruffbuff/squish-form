export type RandomScope3d = {
  silhouette: boolean;
  color: boolean;
  material: boolean;
  eyes: boolean;
};

export type RandomScopeFlat = {
  silhouette: boolean;
  color: boolean;
  fill: boolean;
  eyes: boolean;
};

export const DEFAULT_RANDOM_SCOPE_3D: RandomScope3d = {
  silhouette: true,
  color: true,
  material: true,
  eyes: true,
};

export const DEFAULT_RANDOM_SCOPE_FLAT: RandomScopeFlat = {
  silhouette: true,
  color: true,
  fill: true,
  eyes: true,
};

export const RANDOM_SCOPE_LABELS_3D: { key: keyof RandomScope3d; label: string }[] = [
  { key: "silhouette", label: "Силуэт" },
  { key: "color", label: "Цвет" },
  { key: "material", label: "Материал" },
  { key: "eyes", label: "Глаза" },
];

export const RANDOM_SCOPE_LABELS_FLAT: { key: keyof RandomScopeFlat; label: string }[] = [
  { key: "silhouette", label: "Силуэт" },
  { key: "color", label: "Цвет" },
  { key: "fill", label: "Заливка" },
  { key: "eyes", label: "Глаза" },
];
