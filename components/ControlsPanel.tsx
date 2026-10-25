"use client";

import { useState, type ReactNode } from "react";
import { AvatarPreview } from "@/components/AvatarPreview";
import { ColorPicker } from "@/components/ColorPicker";
import { RandomHistory } from "@/components/RandomHistory";
import { RandomSection } from "@/components/RandomSection";
import { SilhouettePicker } from "@/components/SilhouettePicker";
import { RANDOM_SCOPE_LABELS_3D, type RandomScope3d } from "@/lib/randomScopes";
import { SegmentControl } from "@/components/SegmentControl";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MATERIALS } from "@/lib/materials";
import { qualityTier, type AvatarParams, type BackdropId, type ColorMode, type EyeMood, type EyeStyle, type IdleId, type SurfaceMode } from "@/lib/types";

const IDLES: { id: IdleId; label: string }[] = [
  { id: "none", label: "Без движения" },
  { id: "breathe", label: "Дыхание" },
  { id: "sway", label: "Покачивание" },
  { id: "bounce", label: "Прыжок" },
  { id: "spin", label: "Оборот" },
  { id: "float", label: "Левитация" },
];

const MOODS: { id: EyeMood; label: string }[] = [
  { id: "calm", label: "Обычные" },
  { id: "joy", label: "Радость" },
  { id: "sleep", label: "Сон" },
  { id: "wow", label: "Удивление" },
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

type HistoryItem = {
  id: string;
  label: string;
  thumb: string;
};

type ControlsPanelProps = {
  params: AvatarParams;
  ready: boolean;
  busy: boolean;
  error: string | null;
  randomScopes: RandomScope3d;
  randomHistory: HistoryItem[];
  showFps: boolean;
  onChange: (patch: Partial<AvatarParams>) => void;
  onRandom: () => void;
  onScopeChange: (key: keyof RandomScope3d, enabled: boolean) => void;
  onHistoryPick: (index: number) => void;
  onShowFpsChange: (value: boolean) => void;
  onDownloadGlb: () => void;
  onDownloadPng: () => void;
  onDownloadPack: () => void;
};

export function ControlsPanel({
  params,
  ready,
  busy,
  error,
  randomScopes,
  randomHistory,
  showFps,
  onChange,
  onRandom,
  onScopeChange,
  onHistoryPick,
  onShowFpsChange,
  onDownloadGlb,
  onDownloadPng,
  onDownloadPack,
}: ControlsPanelProps) {
  const [stop, setStop] = useState<"a" | "b">("a");
  const editingB = params.colorMode === "gradient" && stop === "b";

  return (
    <div className="panel-scroll">
      <h1 className="sr-only">SquishForm</h1>
      <ThemeToggle />
      <AvatarPreview {...params} />

      <RandomSection
        onRandom={onRandom}
        scopes={randomScopes}
        chips={RANDOM_SCOPE_LABELS_3D}
        onScopeChange={onScopeChange}
        history={<RandomHistory items={randomHistory} onPick={onHistoryPick} />}
      />

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
        <Slider
          label="Глубина"
          value={params.eyeInset}
          display={params.eyeInset < 0.28 ? "Снаружи" : params.eyeInset > 0.82 ? "Вглубь" : "Глубина"}
          onChange={(eyeInset) => onChange({ eyeInset })}
        />
        <p className="subhead">Настроение</p>
        <Segment options={MOODS} value={params.mood} onChange={(mood) => onChange({ mood })} />
      </Field>

      <Field label="Цвет" className="card--color">
        <Segment options={COLOR_MODES} value={params.colorMode} onChange={(colorMode) => onChange({ colorMode })} />
        {params.colorMode === "gradient" ? (
          <div className="flex gap-1.5">
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
        <SegmentControl layout="chips" options={MATERIALS} value={params.material} onChange={(material) => onChange({ material })} />
      </Field>

      <Field label="Движение">
        <SegmentControl layout="chips" options={IDLES} value={params.idle} onChange={(idle) => onChange({ idle })} />
        <Slider label="Скорость" value={params.speed} onChange={(speed) => onChange({ speed })} />
        <Slider label="Плавность" value={params.smoothness} onChange={(smoothness) => onChange({ smoothness })} />
      </Field>

      <Field label="Край">
        <Slider
          label="Сила"
          display={params.rim < 0.08 ? "Выкл" : params.rim > 0.55 ? "Ярко" : "Мягко"}
          value={params.rim}
          onChange={(rim) => onChange({ rim })}
        />
      </Field>

      <Field label="Фон">
        <Segment options={BACKDROPS} value={params.backdrop} onChange={(backdrop) => onChange({ backdrop })} />
        <Toggle
          label="Тень"
          hint="Контакт под формой"
          on={params.shadowOn}
          onClick={() => onChange({ shadowOn: !params.shadowOn })}
        />
      </Field>

      <Field label="Качество">
        <Slider
          label={QUALITY_LABEL[qualityTier(params.quality)]}
          value={params.quality}
          onChange={(quality) => onChange({ quality })}
        />
        <Toggle
          label="FPS"
          hint="Счётчик на сцене"
          on={showFps}
          onClick={() => onShowFpsChange(!showFps)}
        />
      </Field>

      <section className="card">
        <div className="switch-block">
          <Toggle
            label="Свет"
            hint="Точка блика"
            on={params.lightOn}
            onClick={() => onChange({ lightOn: !params.lightOn })}
          />
          {params.lightOn ? (
            <div className="nested-sliders">
              <Slider label="Горизонт" value={params.lightX} onChange={(lightX) => onChange({ lightX })} />
              <Slider label="Высота" value={params.lightY} onChange={(lightY) => onChange({ lightY })} />
              <Slider
                label="Яркость"
                value={params.lightIntensity}
                onChange={(lightIntensity) => onChange({ lightIntensity })}
              />
            </div>
          ) : null}
        </div>
        <Toggle
          label="За курсором"
          hint="Глаза и наклон"
          on={params.follow}
          onClick={() => onChange({ follow: !params.follow })}
        />
        <Toggle
          label="Реакция на тап"
          hint="Зажатие сжимает форму"
          on={params.tap}
          onClick={() => onChange({ tap: !params.tap })}
        />
      </section>

      <section className="card mt-auto">
        <h2 className="card-title">Файлы</h2>
        <button type="button" disabled={!ready || busy} onClick={onDownloadGlb} className="btn-ghost">
          {busy ? "Сохраняю…" : "Скачать GLB"}
        </button>
        <button type="button" disabled={!ready || busy} onClick={onDownloadPng} className="btn-ghost">
          Скачать PNG
        </button>
        <p className="subhead">Пакет для проекта</p>
        <button type="button" disabled={!ready || busy} onClick={onDownloadPack} className="btn-ghost">
          {busy ? "Сохраняю…" : "Скачать пакет"}
        </button>
        <p className="note">GLB, компонент React Three Fiber и инструкция. Сейчас бесплатно.</p>
        {error ? <p className="error">{error}</p> : null}
      </section>
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
    <label className="slider-row">
      <span>{display ?? label}</span>
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
    <button type="button" aria-pressed={on} onClick={onClick} className="switch-row">
      <span className="switch-text">
        <span className="t">{label}</span>
        <span className="h">{hint}</span>
      </span>
      <span className="ios" aria-hidden="true">
        <span className="knob" />
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
      className="stop-btn"
    >
      <span className="dot" style={{ background: color }} />
      {label}
    </button>
  );
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <section className={className ? `card ${className}` : "card"}>
      <h2 className="card-title">{label}</h2>
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
  return <SegmentControl options={options} value={value} onChange={onChange} />;
}
