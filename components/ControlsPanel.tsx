"use client";

import type { ReactNode } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import { MATERIALS } from "@/lib/materials";
import { SILHOUETTES } from "@/lib/silhouettes";
import { qualityTier, type AvatarParams, type EyeStyle, type IdleId } from "@/lib/types";

const IDLES: { id: IdleId; label: string }[] = [
  { id: "breathe", label: "Дыхание" },
  { id: "sway", label: "Покачивание" },
  { id: "both", label: "Оба" },
];

const EYES: { id: EyeStyle; label: string }[] = [
  { id: "dots", label: "Точки" },
  { id: "ovals", label: "Овалы" },
];

const QUALITY_LABEL = ["Низкое", "Среднее", "Высокое"] as const;

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
    <div className="flex h-full flex-col gap-5 px-5 py-6">
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

      <Field label="Глаза">
        <Segment options={EYES} value={params.eyes} onChange={(eyes) => onChange({ eyes })} />
      </Field>

      <Field label="Цвет">
        <ColorPicker color={params.color} onChange={(color) => onChange({ color })} />
      </Field>

      <Field label="Материал">
        <Segment options={MATERIALS} value={params.material} onChange={(material) => onChange({ material })} />
      </Field>

      <Field label="Движение">
        <Segment options={IDLES} value={params.idle} onChange={(idle) => onChange({ idle })} />
      </Field>

      <Field label="Качество">
        <Slider
          label={QUALITY_LABEL[qualityTier(params.quality)]}
          value={params.quality}
          onChange={(quality) => onChange({ quality })}
        />
      </Field>

      <Field label="Блик">
        <Slider
          label={params.light < 0.34 ? "Слева" : params.light > 0.66 ? "Справа" : "Центр"}
          value={params.light}
          onChange={(light) => onChange({ light })}
        />
      </Field>

      <button
        type="button"
        aria-pressed={params.follow}
        onClick={() => onChange({ follow: !params.follow })}
        className="flex items-center justify-between rounded-2xl bg-black/25 px-3 py-2.5 text-left"
      >
        <span>
          <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">За курсором</span>
          <span className="text-sm text-[var(--muted)]">Тап по форме — реакция</span>
        </span>
        <span
          className={
            params.follow
              ? "rounded-full bg-[#f4efe8] px-3 py-1 text-xs font-medium text-[#1a1613]"
              : "rounded-full bg-white/5 px-3 py-1 text-xs text-[#d9d2c8]"
          }
        >
          {params.follow ? "Вкл" : "Выкл"}
        </span>
      </button>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Экспорт</p>
        <button type="button" disabled={!ready || busy} onClick={onDownloadGlb} className="download">
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

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="squish-range"
      />
      <span className="w-16 shrink-0 text-right text-xs text-[#d9d2c8]">{label}</span>
    </label>
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
