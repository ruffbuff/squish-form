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
    <div className="sil-grid" role="group" aria-label="Силуэт">
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
          >
            {icons ? (
              <img src={icons[option.id]} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="block h-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
