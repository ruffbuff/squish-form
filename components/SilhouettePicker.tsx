"use client";

import { useEffect, useState } from "react";
import { renderSilhouetteIcons } from "@/lib/silhouetteIcons";
import { SILHOUETTES } from "@/lib/silhouettes";
import type { SilhouetteId } from "@/lib/types";

type SilhouettePickerProps = {
  value: SilhouetteId;
  onChange: (id: SilhouetteId) => void;
};

export function SilhouettePicker({ value, onChange }: SilhouettePickerProps) {
  const [icons, setIcons] = useState<Record<SilhouetteId, string> | null>(null);

  useEffect(() => {
    let active = true;
    renderSilhouetteIcons().then((images) => {
      if (active) setIcons(images);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Силуэт">
      {SILHOUETTES.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-label={option.label}
            aria-pressed={active}
            title={option.label}
            onClick={() => onChange(option.id)}
            className={
              active
                ? "overflow-hidden rounded-2xl bg-black/40 p-1 ring-2 ring-[#f4efe8]"
                : "overflow-hidden rounded-2xl bg-black/25 p-1 ring-2 ring-transparent hover:bg-white/5"
            }
          >
            {icons ? (
              <img src={icons[option.id]} alt="" className="h-14 w-full object-contain" />
            ) : (
              <span className="block h-14" />
            )}
          </button>
        );
      })}
    </div>
  );
}
