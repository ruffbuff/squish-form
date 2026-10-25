"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const PRESETS = ["#40ea34", "#f08a78", "#7ec8ff", "#ffd166", "#e879f9", "#fb7185", "#f4efe8", "#38bdf8"];

type ColorPickerProps = {
  color: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const hsv = hexToHsv(color);
  const pad = useDrag((x, y) => {
    onChange(hsvToHex(hsv.h, x, 1 - y));
  });
  const hue = useDrag((x) => {
    onChange(hsvToHex(x * 360, Math.max(hsv.s, 0.02), hsv.v));
  });

  return (
    <div className="color-picker">
      <div className="color-picker__presets-wrap">
        <p className="color-picker__label">Пресеты</p>
        <div className="presets">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={preset}
              aria-pressed={preset.toLowerCase() === color.toLowerCase()}
              onClick={() => onChange(preset)}
              style={{ background: preset }}
            />
          ))}
        </div>
      </div>
      <div
        ref={pad.ref}
        className="color-pad relative h-[7.25rem] min-h-[7.25rem] w-full max-w-full cursor-crosshair"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
        }}
        onPointerDown={pad.onPointerDown}
        onPointerMove={pad.onPointerMove}
      >
        <span
          className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
        />
      </div>
      <div
        ref={hue.ref}
        className="hue-bar relative mt-0.5 w-full max-w-full cursor-ew-resize"
        style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
        onPointerDown={hue.onPointerDown}
        onPointerMove={hue.onPointerMove}
      >
        <span
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 90% 55%)` }}
        />
      </div>
      <div className="color-picker-footer">
        <span className="swatch-lg" style={{ background: color }} />
        <HexField color={color} onChange={onChange} />
      </div>
    </div>
  );
}

function HexField({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  const [draft, setDraft] = useState(color);

  useEffect(() => {
    setDraft(color);
  }, [color]);

  return (
    <input
      aria-label="Hex"
      value={draft}
      spellCheck={false}
      maxLength={7}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        const valid = normalizeHex(next);
        if (valid) onChange(valid);
      }}
      onBlur={() => setDraft(color)}
      className="hex-input"
    />
  );
}

function useDrag(onPick: (x: number, y: number) => void) {
  const ref = useRef<HTMLDivElement>(null);

  const pick = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = clamp((event.clientX - bounds.left) / bounds.width);
    const y = clamp((event.clientY - bounds.top) / bounds.height);
    onPick(x, y);
  };

  return {
    ref,
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      pick(event);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
      pick(event);
    },
  };
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function normalizeHex(value: string) {
  const trimmed = value.trim().toLowerCase();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#[0-9a-f]{6}$/.test(withHash) ? withHash : null;
}

function hexToHsv(hex: string) {
  const raw = normalizeHex(hex) ?? "#f08a78";
  const r = parseInt(raw.slice(1, 3), 16) / 255;
  const g = parseInt(raw.slice(3, 5), 16) / 255;
  const b = parseInt(raw.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

function hsvToHex(h: number, s: number, v: number) {
  const sector = ((((h % 360) + 360) % 360) / 60);
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
