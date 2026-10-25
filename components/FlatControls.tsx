"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import { SegmentControl } from "@/components/SegmentControl";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FLAT_SILHOUETTES } from "@/lib/flatShapes";
import { flatSvg } from "@/lib/flatSvg";
import type { FlatColorMode, FlatEyeMood, FlatEyeStyle, FlatFillId, FlatIdleId, FlatParams, FlatSilhouetteId } from "@/lib/flatTypes";

const FILLS: { id: FlatFillId; label: string }[] = [
  { id: "flat", label: "Плоский" },
  { id: "gloss", label: "Блик" },
  { id: "matte", label: "Матовый" },
  { id: "jelly", label: "Желе" },
];

const EYES: { id: FlatEyeStyle; label: string }[] = [
  { id: "dots", label: "Точки" },
  { id: "capsules", label: "Капсулы" },
];

const MOODS: { id: FlatEyeMood; label: string }[] = [
  { id: "calm", label: "Обычные" },
  { id: "joy", label: "Радость" },
  { id: "sleep", label: "Сон" },
  { id: "wow", label: "Удивление" },
];

const IDLES: { id: FlatIdleId; label: string }[] = [
  { id: "none", label: "Нет" },
  { id: "breathe", label: "Дыхание" },
  { id: "float", label: "Левитация" },
];

const COLOR_MODES: { id: FlatColorMode; label: string }[] = [
  { id: "solid", label: "Сплошной" },
  { id: "gradient", label: "Два цвета" },
];

type FlatControlsProps = {
  params: FlatParams;
  busy: boolean;
  error: string | null;
  onChange: (patch: Partial<FlatParams>) => void;
  onRandom: () => void;
  onDownloadSvg: () => void;
  onDownloadPng: () => void;
};

export function FlatControls({
  params,
  busy,
  error,
  onChange,
  onRandom,
  onDownloadSvg,
  onDownloadPng,
}: FlatControlsProps) {
  const [stop, setStop] = useState<"a" | "b">("a");
  const editingB = params.colorMode === "gradient" && stop === "b";
  const look = `${params.color}|${params.colorB}|${params.colorMode}|${params.fill}|${params.eyes}|${params.mood}|${params.eyeSize}`;

  const icons = useMemo(() => {
    const images = {} as Record<FlatSilhouetteId, string>;
    for (const shape of FLAT_SILHOUETTES) {
      images[shape.id] = flatSvg({ ...params, silhouette: shape.id }, "icon", `icon-${shape.id}`);
    }
    return images;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look]);

  const medal = useMemo(
    () => flatSvg(params, "medal", "medal"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [look, params.silhouette],
  );

  return (
    <div className="panel-scroll">
      <h1 className="sr-only">SquishForm</h1>
      <ThemeToggle />
      <div className="preview-ring">
        <div className="h-full w-full scale-110 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: medal }} />
      </div>

      <button type="button" onClick={onRandom} className="btn-primary">
        Случайно
      </button>

      <Field label="Силуэт">
        <div className="sil-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }} role="group" aria-label="Силуэт">
          {FLAT_SILHOUETTES.map((shape) => {
            const active = shape.id === params.silhouette;
            return (
              <button
                key={shape.id}
                type="button"
                aria-label={shape.label}
                aria-pressed={active}
                title={shape.label}
                onClick={() => onChange({ silhouette: shape.id })}
              >
                <span className="block h-full w-full [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: icons[shape.id] }} />
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Глаза">
        <Segment options={EYES} value={params.eyes} onChange={(eyes) => onChange({ eyes })} />
        <Slider
          label="Размер"
          value={(params.eyeSize - 0.55) / 1.15}
          display={params.eyeSize < 0.85 ? "Мелкие" : params.eyeSize > 1.25 ? "Крупнее" : "Средние"}
          onChange={(unit) => onChange({ eyeSize: 0.55 + unit * 1.15 })}
        />
        <p className="subhead">Настроение</p>
        <Segment options={MOODS} value={params.mood} onChange={(mood) => onChange({ mood })} />
      </Field>

      <Field label="Цвет" className="card--color">
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
      </Field>

      <Field label="Заливка">
        <SegmentControl layout="chips" options={FILLS} value={params.fill} onChange={(fill) => onChange({ fill })} />
      </Field>

      <Field label="Движение">
        <SegmentControl layout="chips" options={IDLES} value={params.idle} onChange={(idle) => onChange({ idle })} />
        <Slider label="Скорость" value={params.speed} onChange={(speed) => onChange({ speed })} />
      </Field>

      <section className="card mt-auto">
        <h2 className="card-title">Файлы</h2>
        <button type="button" disabled={busy} onClick={onDownloadSvg} className="btn-ghost">
          Скачать SVG
        </button>
        <button type="button" disabled={busy} onClick={onDownloadPng} className="btn-ghost">
          {busy ? "Сохраняю…" : "Скачать PNG"}
        </button>
        <p className="note">GLB и пакет проекта — только в режиме 3D.</p>
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
    <button type="button" aria-pressed={active} onClick={onClick} className="stop-btn">
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
