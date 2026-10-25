"use client";

import type { ReactNode } from "react";

type ScopeChip<T extends string> = {
  key: T;
  label: string;
};

type RandomSectionProps<T extends string> = {
  onRandom: () => void;
  scopes: Record<T, boolean>;
  chips: ScopeChip<T>[];
  onScopeChange: (key: T, enabled: boolean) => void;
  history: ReactNode;
};

export function RandomSection<T extends string>({
  onRandom,
  scopes,
  chips,
  onScopeChange,
  history,
}: RandomSectionProps<T>) {
  const allOn = chips.every((chip) => scopes[chip.key]);

  return (
    <section className="random-block">
      <button type="button" onClick={onRandom} className="btn-primary">
        Случайно
      </button>
      <div className="scope-chips" role="group" aria-label="Что рандомить">
        <button
          type="button"
          className="scope-chip"
          aria-pressed={allOn}
          onClick={() => chips.forEach((chip) => onScopeChange(chip.key, true))}
        >
          Все
        </button>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className="scope-chip"
            aria-pressed={scopes[chip.key]}
            onClick={() => onScopeChange(chip.key, !scopes[chip.key])}
          >
            {chip.label}
          </button>
        ))}
      </div>
      {history}
    </section>
  );
}
