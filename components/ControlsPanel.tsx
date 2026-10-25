"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MATERIALS } from "@/lib/materials";
import { SILHOUETTES } from "@/lib/silhouettes";
import type { AvatarParams, IdleId } from "@/lib/types";

const IDLES: { id: IdleId; label: string }[] = [
  { id: "breathe", label: "Дыхание" },
  { id: "sway", label: "Покачивание" },
  { id: "both", label: "Оба" },
];

type ControlsPanelProps = {
  params: AvatarParams;
  ready: boolean;
  busy: boolean;
  error: string | null;
  onChange: (patch: Partial<AvatarParams>) => void;
  onDownloadGlb: () => void;
  onDownloadPng: () => void;
};

export function ControlsPanel({
  params,
  ready,
  busy,
  error,
  onChange,
  onDownloadGlb,
  onDownloadPng,
}: ControlsPanelProps) {
  return (
    <div className="flex h-full flex-col gap-6 px-5 py-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">playground</p>
        <h1 className="mt-1 text-[1.7rem] font-semibold leading-none tracking-tight">глина</h1>
      </header>

      <Field label="Силуэт">
        <Segment
          options={SILHOUETTES}
          value={params.silhouette}
          onChange={(silhouette) => onChange({ silhouette })}
        />
      </Field>

      <Field label="Цвет">
        <div className="flex items-center gap-3">
          <input
            id="avatar-color"
            aria-label="Цвет"
            type="color"
            value={params.color}
            onChange={(event) => onChange({ color: event.target.value })}
            className="color-swatch"
          />
          <HexField color={params.color} onChange={(color) => onChange({ color })} />
        </div>
      </Field>

      <Field label="Материал">
        <Segment
          options={MATERIALS}
          value={params.material}
          onChange={(material) => onChange({ material })}
        />
      </Field>

      <Field label="Движение">
        <Segment options={IDLES} value={params.idle} onChange={(idle) => onChange({ idle })} />
      </Field>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Экспорт</p>
        <button
          type="button"
          disabled={!ready || busy}
          onClick={onDownloadGlb}
          className="download"
        >
          {busy ? "Сохраняю…" : "Скачать GLB"}
        </button>
        <button type="button" disabled={!ready || busy} onClick={onDownloadPng} className="download">
          Скачать PNG
        </button>
        {error ? <p className="text-sm text-[#ffb4a8]">{error}</p> : null}
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
    <>
      <label className="sr-only" htmlFor="avatar-hex">
        Hex
      </label>
      <input
        id="avatar-hex"
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
        className="w-full rounded-2xl border border-[var(--line)] bg-white/5 px-3 py-2 font-mono text-sm uppercase tracking-wide outline-none focus-visible:border-white/30"
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</h2>
      {children}
    </section>
  );
}

function Segment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl bg-black/25 p-1" role="group">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={
              active
                ? "grow whitespace-nowrap rounded-xl bg-[#f4efe8] px-3 py-2 text-[13px] font-medium text-[#1a1613]"
                : "grow whitespace-nowrap rounded-xl px-3 py-2 text-[13px] text-[#d9d2c8] hover:bg-white/5"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function normalizeHex(value: string) {
  const trimmed = value.trim().toLowerCase();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#[0-9a-f]{6}$/.test(withHash) ? withHash : null;
}
