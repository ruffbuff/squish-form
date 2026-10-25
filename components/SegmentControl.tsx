"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type SegmentOption<T extends string> = { id: T; label: string };

type SegmentControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Multi-row material/motion chips use softer corners than two-option pill tracks. */
  layout?: "pill" | "chips";
  "aria-label"?: string;
  className?: string;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  layout = "pill",
  "aria-label": ariaLabel,
  className,
}: SegmentControlProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef(new Map<string, HTMLButtonElement>());
  const [thumb, setThumb] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const updateThumb = useCallback(() => {
    const root = rootRef.current;
    const btn = btnRefs.current.get(value);
    if (!root || !btn) return;
    const rootBox = root.getBoundingClientRect();
    const btnBox = btn.getBoundingClientRect();
    setThumb({
      x: btnBox.left - rootBox.left,
      y: btnBox.top - rootBox.top,
      w: btnBox.width,
      h: btnBox.height,
    });
  }, [value]);

  useLayoutEffect(() => {
    updateThumb();
  }, [updateThumb, options.length]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => updateThumb());
    ro.observe(root);
    for (const btn of btnRefs.current.values()) ro.observe(btn);
    return () => ro.disconnect();
  }, [updateThumb, value]);

  const rootClass = ["segment", layout === "chips" ? "segment--chips" : "", className].filter(Boolean).join(" ");

  return (
    <div ref={rootRef} className={rootClass} role="group" aria-label={ariaLabel}>
      {thumb ? (
        <span
          className="segment-thumb"
          aria-hidden
          style={{
            width: thumb.w,
            height: thumb.h,
            transform: `translate(${thumb.x}px, ${thumb.y}px)`,
            transition: reducedMotion ? "none" : undefined,
          }}
        />
      ) : null}
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            ref={(el) => {
              if (el) btnRefs.current.set(option.id, el);
              else btnRefs.current.delete(option.id);
            }}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
