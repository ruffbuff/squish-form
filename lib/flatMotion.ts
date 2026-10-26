import type { FlatEyeMood } from "./flatTypes";

/** Slowest and fastest base loop, in seconds. Same range for 3D and Flat. */
export const FLAT_MAX_DURATION = 4.4;
export const FLAT_MIN_DURATION = 1.8;
const FLAT_RANGE = FLAT_MAX_DURATION - FLAT_MIN_DURATION;

/**
 * Every Flat motion (body, shadow, edge, mood eyes) starts from this base
 * duration. Eye moods use a multiplier so blink/sleep/surprise keep their
 * relative pace at every speed setting.
 */
export const FLAT_EYE_MULTIPLIER: Record<FlatEyeMood, number> = {
  calm: 1.45,
  joy: 1,
  sleep: 1.2,
  wow: 0.72,
};

export function clampSpeed(speed: number) {
  return Math.min(1, Math.max(0, speed));
}

export function flatDurationSeconds(speed: number) {
  return FLAT_MAX_DURATION - clampSpeed(speed) * FLAT_RANGE;
}

export function flatDuration(speed: number) {
  return `${flatDurationSeconds(speed).toFixed(2)}s`;
}

export function flatEyeDuration(speed: number, mood: FlatEyeMood) {
  return `${(flatDurationSeconds(speed) * FLAT_EYE_MULTIPLIER[mood]).toFixed(2)}s`;
}

/**
 * Easing for every non-spin Flat motion. Softness 0 is close to linear;
 * 1 adds a gentle overshoot. Spin stays linear so angular velocity is
 * constant, as the motion spec requires.
 */
export function flatEasing(smoothness: number) {
  const t = Math.min(1, Math.max(0, smoothness));
  const x1 = (0.18 + 0.2 * t).toFixed(2);
  const y1 = (0.06 + 0.48 * t).toFixed(2);
  const x2 = (0.32 - 0.04 * t).toFixed(2);
  const y2 = (0.94 + 0.06 * t).toFixed(2);
  return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
}
