"use client";

import { SegmentControl } from "@/components/SegmentControl";
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
      <SegmentControl
        aria-label="Режим"
        className="mt-2"
        options={MODES}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
