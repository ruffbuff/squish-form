import { MATERIALS } from "./materials";
import { SILHOUETTES } from "./silhouettes";
import type { AvatarParams, ColorMode, EyeMood, EyeStyle } from "./types";

const EYES: EyeStyle[] = ["dots", "ovals"];
const MOODS: EyeMood[] = ["calm", "joy", "sleep", "wow"];
const MODES: ColorMode[] = ["solid", "gradient"];
const PRESETS = ["#40ea34", "#f08a78", "#7ec8ff", "#ffd166", "#e879f9", "#fb7185", "#f4efe8", "#38bdf8", "#fb923c", "#a3e635", "#ec0dff"];

/**
 * New silhouette, colors, material, and eyes.
 * Leaves light, follow, tap, and motion alone.
 * Eye depth only jitters inside a narrow seated range.
 */
export function randomizeAvatar(current: AvatarParams): AvatarParams {
  return {
    ...current,
    silhouette: pick(SILHOUETTES).id,
    color: Math.random() < 0.8 ? pick(PRESETS) : randomHex(),
    colorB: Math.random() < 0.8 ? pick(PRESETS) : randomHex(),
    colorMode: pick(MODES),
    gradientAngle: Math.random(),
    gradientSoft: Math.random() < 0.75,
    material: pick(MATERIALS).id,
    eyes: pick(EYES),
    mood: pick(MOODS),
    eyeSize: 0.75 + Math.random() * 0.7,
    eyeInset: 0.54 + Math.random() * 0.16,
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
