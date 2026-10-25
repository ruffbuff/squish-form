import { FLAT_SILHOUETTES } from "./flatShapes";
import type { FlatColorMode, FlatEyeMood, FlatEyeStyle, FlatFillId, FlatParams } from "./flatTypes";

const FILLS: FlatFillId[] = ["flat", "gloss", "matte", "jelly"];
const EYES: FlatEyeStyle[] = ["dots", "capsules"];
const MOODS: FlatEyeMood[] = ["calm", "joy", "sleep", "wow"];
const MODES: FlatColorMode[] = ["solid", "gradient"];
const PRESETS = ["#ff8a1f", "#40ea34", "#f08a78", "#7ec8ff", "#ffd166", "#e879f9", "#fb7185", "#f4efe8", "#38bdf8", "#c084fc", "#34d399", "#fb923c"];

/** New silhouette, colors, fill, and eyes. Leaves idle and speed alone. */
export function randomizeFlat(current: FlatParams): FlatParams {
  return {
    ...current,
    silhouette: pick(FLAT_SILHOUETTES).id,
    color: Math.random() < 0.85 ? pick(PRESETS) : randomHex(),
    colorB: Math.random() < 0.85 ? pick(PRESETS) : randomHex(),
    colorMode: pick(MODES),
    fill: pick(FILLS),
    eyes: pick(EYES),
    mood: pick(MOODS),
    eyeSize: 0.7 + Math.random() * 0.75,
  };
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomHex() {
  const hue = Math.random() * 360;
  const sat = 0.55 + Math.random() * 0.35;
  const value = 0.72 + Math.random() * 0.22;
  return hsvToHex(hue, sat, value);
}

function hsvToHex(h: number, s: number, v: number) {
  const sector = (((h % 360) + 360) % 360) / 60;
  const index = Math.floor(sector);
  const fraction = sector - index;
  const p = v * (1 - s);
  const q = v * (1 - fraction * s);
  const t = v * (1 - (1 - fraction) * s);
  const channels = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ][index % 6];
  const byte = (channel: number) => Math.round(channel * 255).toString(16).padStart(2, "0");
  return `#${byte(channels[0])}${byte(channels[1])}${byte(channels[2])}`;
}
