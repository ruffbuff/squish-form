"use client";

import type { PlayMode } from "@/lib/flatTypes";

const MODES: { id: PlayMode; label: string }[] = [
  { id: "3d", label: "3D" },
  { id: "flat", label: "Flat" },
];

type ModeSwitchProps = {
  value: PlayMode;
  onChange: (mode: PlayMode) => void;
};

export function ModeSwitch({ value, onChange }: ModeSwitchProps) {
  return (
    <div>
      <h2 className="card-title">Режим</h2>
      <div className="segment mt-2" role="group" aria-label="Режим">
        {MODES.map((mode) => {
          const active = mode.id === value;
          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(mode.id)}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
