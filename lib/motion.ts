import type { IdleId } from "./types";

export type MotionPose = {
  width: number;
  height: number;
  yaw: number;
  roll: number;
  pitch: number;
  bob: number;
};

/** speed and smoothness are both 0–1. */
export function idlePose(idle: IdleId, time: number, speed: number, smoothness: number): MotionPose {
  const pose: MotionPose = { width: 1, height: 1, yaw: 0, roll: 0, pitch: 0, bob: 0 };
  if (idle === "breathe") {
    const pulse = wave(time * rate(speed, 2.1), smoothness);
    pose.height = 1 + pulse * 0.13;
    pose.width = 1 - pulse * 0.08;
  }
  if (idle === "sway") {
    const step = rate(speed, 0.9);
    pose.yaw = wave(time * step, smoothness) * 0.64;
    pose.roll = wave(time * step * 0.72, smoothness) * 0.28;
    pose.pitch = wave(time * step * 0.6 + 1.1, smoothness) * 0.2;
    pose.bob = wave(time * step, smoothness) * 0.12;
  }
  if (idle === "bounce") {
    const cycle = time * rate(speed, 1.45);
    const sample = Math.sin(cycle);
    const exponent = 0.42 + smoothness * 1.5;
    const hop = sample > 0 ? Math.pow(sample, exponent) : 0;
    const land = sample < 0 ? Math.pow(-sample, exponent) : 0;
    pose.bob = hop * 0.5;
    pose.height = 1 + hop * 0.1 - land * 0.2;
    pose.width = 1 - hop * 0.06 + land * 0.16;
  }
  if (idle === "spin") {
    const unit = (Math.sin(time * rate(speed, 0.55)) + 1) / 2;
    const soft = unit * unit * (3 - 2 * unit);
    const turn = unit + (soft - unit) * smoothness;
    pose.yaw = turn * Math.PI * 2;
  }
  if (idle === "float") {
    pose.bob = wave(time * rate(speed, 1.15), smoothness) * 0.28;
  }
  return pose;
}

function rate(speed: number, base: number) {
  return base * (0.35 + speed * 1.75);
}

function wave(phase: number, smoothness: number) {
  const sample = Math.sin(phase);
  const exponent = 0.38 + smoothness * 1.9;
  return Math.sign(sample) * Math.pow(Math.abs(sample), exponent);
}
