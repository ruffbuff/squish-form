"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import { SilhouettePicker } from "@/components/SilhouettePicker";
import { MATERIALS } from "@/lib/materials";
import { qualityTier, type AvatarParams, type BackdropId, type ColorMode, type EyeStyle, type IdleId, type SurfaceMode } from "@/lib/types";

const AvatarPreview = dynamic(() => import("@/components/AvatarPreview").then((mod) => mod.AvatarPreview), {
  ssr: false,
});

const IDLES: { id: IdleId; label: string }[] = [
  { id: "none", label: "Без движения" },
  { id: "breathe", label: "Дыхание" },
  { id: "sway", label: "Покачивание" },
  { id: "bounce", label: "Прыжок" },
  { id: "spin", label: "Оборот" },
];

const SURFACES: { id: SurfaceMode; label: string }[] = [
  { id: "smooth", label: "Гладкий" },
  { id: "poly", label: "Полигоны" },
];

const COLOR_MODES: { id: ColorMode; label: string }[] = [
  { id: "solid", label: "Сплошной" },
  { id: "gradient", label: "Градиент" },
];

const BACKDROPS: { id: BackdropId; label: string }[] = [
  { id: "empty", label: "Пусто" },
  { id: "studio", label: "Студия" },
  { id: "grid", label: "Сетка" },
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
  const [stop, setStop] = useState<"a" | "b">("a");
  const editingB = params.colorMode === "gradient" && stop === "b";

  return (
    <div className="flex h-full flex-col gap-5 px-5 py-6">
      <h1 className="sr-only">SquishForm</h1>
      <AvatarPreview {...params} />

      <button type="button" onClick={onRandom} className="download">
        Случайно
      </button>

      <Field label="Силуэт">
        <SilhouettePicker value={params.silhouette} onChange={(silhouette) => onChange({ silhouette })} />
      </Field>

      <Field label="Поверхность">
        <Segment options={SURFACES} value={params.surface} onChange={(surface) => onChange({ surface })} />
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
        <Segment options={COLOR_MODES} value={params.colorMode} onChange={(colorMode) => onChange({ colorMode })} />
        {params.colorMode === "gradient" ? (
          <div className="flex gap-2">
            <StopButton label="A" color={params.color} active={stop === "a"} onClick={() => setStop("a")} />
            <StopButton label="B" color={params.colorB} active={stop === "b"} onClick={() => setStop("b")} />
          </div>
        ) : null}
        <ColorPicker
          color={editingB ? params.colorB : params.color}
          onChange={(next) => onChange(editingB ? { colorB: next } : { color: next })}
        />
        {params.colorMode === "gradient" ? (
          <>
            <Slider label="Угол" value={params.gradientAngle} onChange={(gradientAngle) => onChange({ gradientAngle })} />
            <Segment
              options={[
                { id: "soft", label: "Мягкий" },
                { id: "hard", label: "Жёсткий" },
              ]}
              value={params.gradientSoft ? "soft" : "hard"}
              onChange={(mode) => onChange({ gradientSoft: mode === "soft" })}
            />
          </>
        ) : null}
      </Field>

      <Field label="Материал">
        <Segment options={MATERIALS} value={params.material} onChange={(material) => onChange({ material })} />
      </Field>

      <Field label="Движение">
        <Segment options={IDLES} value={params.idle} onChange={(idle) => onChange({ idle })} />
        <Slider label="Скорость" value={params.speed} onChange={(speed) => onChange({ speed })} />
        <Slider label="Плавность" value={params.smoothness} onChange={(smoothness) => onChange({ smoothness })} />
      </Field>

      <Field label="Край">
        <Slider
          label="Край"
          display={params.rim < 0.08 ? "Выкл" : params.rim > 0.55 ? "Ярко" : "Мягко"}
          value={params.rim}
          onChange={(rim) => onChange({ rim })}
        />
      </Field>

      <Field label="Фон">
        <Segment options={BACKDROPS} value={params.backdrop} onChange={(backdrop) => onChange({ backdrop })} />
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

function StopButton({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="flex flex-1 items-center gap-2 rounded-2xl bg-black/25 px-3 py-2 text-sm"
    >
      <span className="h-5 w-5 rounded-full border border-white/20" style={{ background: color }} />
      {label}
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
