import { renderAvatarStill } from "./avatarStill";
import { flatSvg } from "./flatSvg";
import type { FlatParams } from "./flatTypes";
import type { AvatarParams } from "./types";

export function thumbFor3d(params: AvatarParams) {
  return renderAvatarStill(params);
}

export function thumbForFlat(params: FlatParams) {
  return flatSvg(params, "medal", `hist-${params.silhouette}`);
}

/**
 * Thumbnails are generated off the randomize click. A single idle queue keeps
 * the 3D still renderer from competing with the live canvas: the click frame
 * is never blocked by a second WebGL scene.
 */
type Job = { run: () => void; cancel: () => void };

const QUEUE: Job[] = [];
const MAX_PENDING = 8;
let draining = false;

function requestIdle(callback: () => void) {
  type IdleWindow = Window & {
    requestIdleCallback?: (cb: IdleRequestCallback, options?: IdleRequestOptions) => number;
  };
  const idle = (window as IdleWindow).requestIdleCallback;
  if (idle) idle(() => callback(), { timeout: 500 });
  else window.setTimeout(callback, 70);
}

function drain() {
  if (draining) return;
  const job = QUEUE.shift();
  if (!job) return;
  draining = true;
  requestIdle(() => {
    try {
      job.run();
    } finally {
      draining = false;
      drain();
    }
  });
}

function enqueue(run: () => void, cancel: () => void) {
  if (QUEUE.length >= MAX_PENDING) QUEUE.shift()?.cancel();
  QUEUE.push({ run, cancel });
  drain();
}

/** Resolves with an empty string when the queue dropped the job. */
export function thumbFor3dAsync(params: AvatarParams) {
  return new Promise<string>((resolve) => enqueue(() => resolve(thumbFor3d(params)), () => resolve("")));
}

export function thumbForFlatAsync(params: FlatParams) {
  return new Promise<string>((resolve) => enqueue(() => resolve(thumbForFlat(params)), () => resolve("")));
}
