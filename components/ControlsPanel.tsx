"use client";

import type { ReactNode } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import { MATERIALS } from "@/lib/materials";
import { SILHOUETTES } from "@/lib/silhouettes";
import { qualityTier, type AvatarParams, type EyeStyle, type IdleId } from "@/lib/types";

const IDLES: { id: IdleId; label: string }[] = [
  { id: "none", label: "Без движения" },
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
  onRandom: () => void;
  onDownloadGlb: () => void;
  onDownloadPng: () => void;
  onDownloadPack: () => void;
};

export function ControlsPanel({
  params,
  ready,
  busy,
  error,
  onChange,
  onRandom,
  onDownloadGlb,
  onDownloadPng,
  onDownloadPack,
}: ControlsPanelProps) {
  return (
    <div className="flex h-full flex-col gap-5 px-5 py-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">playground</p>
        <h1 className="mt-1 text-[1.55rem] font-semibold leading-none tracking-tight">SquishForm</h1>
        <p className="mt-2 text-[13px] leading-snug text-[var(--muted)]">
          Генератор мягких 3D-аватаров для ботов и агентов. Сейчас бесплатно, платный пакет — позже.
        </p>
      </header>

      <button type="button" onClick={onRandom} className="download">
        Случайно
      </button>

      <Field label="Силуэт">
        <Segment
          options={SILHOUETTES}
          value={params.silhouette}
          onChange={(silhouette) => onChange({ silhouette })}
        />
      </Field>

      <Field label="Глаза">
        <Segment options={EYES} value={params.eyes} onChange={(eyes) => onChange({ eyes })} />
        <Slider
          label="Размер"
          value={(params.eyeSize - 0.55) / 1.15}
          display={params.eyeSize < 0.85 ? "Мелкие" : params.eyeSize > 1.25 ? "Крупнее" : "Средние"}
          onChange={(unit) => onChange({ eyeSize: 0.55 + unit * 1.15 })}
        />
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

      <section className="flex flex-col gap-2">
        <Toggle
          label="Свет"
          hint="Точка блика"
          on={params.lightOn}
          onClick={() => onChange({ lightOn: !params.lightOn })}
        />
        {params.lightOn ? (
          <div className="flex flex-col gap-2 pl-1">
            <Slider
              label="Горизонт"
              value={params.lightX}
              onChange={(lightX) => onChange({ lightX })}
            />
            <Slider
              label="Высота"
              value={params.lightY}
              onChange={(lightY) => onChange({ lightY })}
            />
            <Slider
              label="Яркость"
              value={params.lightIntensity}
              onChange={(lightIntensity) => onChange({ lightIntensity })}
            />
          </div>
        ) : null}
      </section>

      <Toggle
        label="За курсором"
        hint="Глаза и наклон"
        on={params.follow}
        onClick={() => onChange({ follow: !params.follow })}
      />
      <Toggle
        label="Реакция на тап"
        hint="Клик сжимает форму"
        on={params.tap}
        onClick={() => onChange({ tap: !params.tap })}
      />

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Файлы</p>
        <button type="button" disabled={!ready || busy} onClick={onDownloadGlb} className="download">
          {busy ? "Сохраняю…" : "Скачать GLB"}
        </button>
        <button type="button" disabled={!ready || busy} onClick={onDownloadPng} className="download">
          Скачать PNG
        </button>
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Пакет для проекта</p>
        <button type="button" disabled={!ready || busy} onClick={onDownloadPack} className="download">
          {busy ? "Сохраняю…" : "Скачать пакет"}
        </button>
        <p className="text-xs leading-snug text-[var(--muted)]">
          GLB, компонент React Three Fiber и инструкция. Сейчас бесплатно.
        </p>
        {error ? <p className="text-sm text-[#ffb4a8]">{error}</p> : null}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  display,
  onChange,
}: {
  label: string;
  value: number;
  display?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-xs text-[#d9d2c8]">
      <span className="w-16 shrink-0">{display ?? label}</span>
      <input
        aria-label={label}
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="squish-range"
      />
    </label>
  );
}

function Toggle({ label, hint, on, onClick }: { label: string; hint: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl bg-black/25 px-3 py-2.5 text-left"
    >
      <span>
        <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</span>
        <span className="text-sm text-[var(--muted)]">{hint}</span>
      </span>
      <span
        className={
          on
            ? "rounded-full bg-[#f4efe8] px-3 py-1 text-xs font-medium text-[#1a1613]"
            : "rounded-full bg-white/5 px-3 py-1 text-xs text-[#d9d2c8]"
        }
      >
        {on ? "Вкл" : "Выкл"}
      </span>
    </button>
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
