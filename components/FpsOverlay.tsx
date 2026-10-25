"use client";

import { useEffect, useRef, useState } from "react";

type FpsOverlayProps = {
  active: boolean;
  /** When true, samples from the parent preview rAF loop; when false, runs its own ticker. */
  sample?: () => number | null;
};

export function FpsOverlay({ active, sample }: FpsOverlayProps) {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useEffect(() => {
    if (!active) return;
    let id = 0;
    const tick = (now: number) => {
      frames.current += 1;
      const elapsed = now - last.current;
      if (elapsed >= 500) {
        const measured = sample?.();
        setFps(measured ?? Math.round((frames.current * 1000) / elapsed));
        frames.current = 0;
        last.current = now;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [active, sample]);

  if (!active) return null;

  return (
    <div className="fps-overlay" aria-live="polite">
      {fps} FPS
    </div>
  );
}
