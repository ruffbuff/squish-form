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
