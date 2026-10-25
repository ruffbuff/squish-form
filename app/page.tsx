"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaygroundApi } from "@/components/AvatarCanvas";
import { ControlsPanel } from "@/components/ControlsPanel";
import { FlatControls } from "@/components/FlatControls";
import { FlatStage } from "@/components/FlatStage";
import { ModeSwitch } from "@/components/ModeSwitch";
import { downloadFlatPng, downloadFlatSvg } from "@/lib/flatExport";
import { randomizeFlat } from "@/lib/flatRandom";
import { FLAT_INITIAL, MODE_STORAGE_KEY, type FlatParams, type PlayMode } from "@/lib/flatTypes";
import { randomizeAvatar } from "@/lib/random";
import type { AvatarParams } from "@/lib/types";

const AvatarCanvas = dynamic(() => import("@/components/AvatarCanvas"), {
  ssr: false,
});

const INITIAL: AvatarParams = {
  silhouette: "blob",
  color: "#f08a78",
  colorB: "#7ec8ff",
  colorMode: "solid",
  gradientAngle: 0.25,
  gradientSoft: true,
  material: "jelly",
  surface: "smooth",
  rim: 0.2,
  idle: "breathe",
  speed: 0.55,
  smoothness: 0.7,
  eyes: "dots",
  mood: "calm",
  eyeSize: 1,
  eyeInset: 0.62,
  backdrop: "studio",
  lightOn: true,
  lightX: 0.72,
  lightY: 0.62,
  lightIntensity: 0.7,
  quality: 1,
  shadowOn: true,
  follow: false,
  tap: true,
};

export default function Page() {
  const [mode, setMode] = useState<PlayMode>("3d");
  const [params, setParams] = useState<AvatarParams>(INITIAL);
  const [flat, setFlat] = useState<FlatParams>(FLAT_INITIAL);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [home, setHome] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const apiRef = useRef<PlaygroundApi | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === "flat" || saved === "3d") setMode(saved);
    } catch {
      /* private browsing */
    }
  }, []);

  const onReady = useCallback((api: PlaygroundApi | null) => {
    apiRef.current = api;
    setReady(api !== null);
  }, []);

  const onChange = useCallback((patch: Partial<AvatarParams>) => {
    setParams((current) => ({ ...current, ...patch }));
  }, []);

  const onFlatChange = useCallback((patch: Partial<FlatParams>) => {
    setFlat((current) => ({ ...current, ...patch }));
  }, []);

  const onRandom = useCallback(() => {
    setParams((current) => randomizeAvatar(current));
  }, []);

  const onFlatRandom = useCallback(() => {
    setFlat((current) => randomizeFlat(current));
  }, []);

  const onMode = useCallback((next: PlayMode) => {
    setMode(next);
    setError(null);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 1600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const onDownloadGlb = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;
    setError(null);
    setBusy(true);
    try {
      await api.downloadGlb();
      setNotice("Готово");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить GLB");
    } finally {
      setBusy(false);
    }
  }, []);

  const onDownloadPng = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    setError(null);
    try {
      api.downloadPng();
      setNotice("Готово");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить PNG");
    }
  }, []);

  const onDownloadPack = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;
    setError(null);
    setBusy(true);
    try {
      await api.downloadPack();
      setNotice("Готово");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить пакет");
    } finally {
      setBusy(false);
    }
  }, []);

  const onDownloadFlatSvg = useCallback(() => {
    setError(null);
    try {
      downloadFlatSvg(flat);
      setNotice("Готово");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить SVG");
    }
  }, [flat]);

  const onDownloadFlatPng = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await downloadFlatPng(flat);
      setNotice("Готово");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить PNG");
    } finally {
      setBusy(false);
    }
  }, [flat]);

  return (
    <main className="flex h-dvh flex-col bg-[var(--bg)] md:flex-row">
      <section className="relative h-[58dvh] shrink-0 md:h-auto md:min-h-0 md:flex-1">
        <div className="absolute inset-0" style={{ touchAction: "none" }}>
          {mode === "3d" ? (
            <AvatarCanvas {...params} home={home} onReady={onReady} />
          ) : (
            <FlatStage params={flat} />
          )}
        </div>
        <div className="stage-vignette pointer-events-none absolute inset-0" />
        {mode === "3d" ? (
          <button
            type="button"
            aria-label="Камера домой"
            title="Камера домой"
            onClick={() => setHome((value) => value + 1)}
            className="home-btn absolute bottom-4 right-4 z-10"
          >
            <HomeIcon />
          </button>
        ) : null}
        {notice ? (
          <p className="toast pointer-events-none absolute bottom-4 left-4 z-10">{notice}</p>
        ) : null}
      </section>
      <aside className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-[var(--line)] bg-[var(--panel)] md:h-dvh md:w-[380px] md:flex-none md:border-t-0 md:border-l">
        <div className="shrink-0 border-b border-[var(--line)] px-4 py-3">
          <ModeSwitch value={mode} onChange={onMode} />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {mode === "3d" ? (
            <ControlsPanel
              params={params}
              ready={ready}
              busy={busy}
              error={error}
              onChange={onChange}
              onRandom={onRandom}
              onDownloadGlb={onDownloadGlb}
              onDownloadPng={onDownloadPng}
              onDownloadPack={onDownloadPack}
            />
          ) : (
            <FlatControls
              params={flat}
              busy={busy}
              error={error}
              onChange={onFlatChange}
              onRandom={onFlatRandom}
              onDownloadSvg={onDownloadFlatSvg}
              onDownloadPng={onDownloadFlatPng}
            />
          )}
        </div>
      </aside>
    </main>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M3 8.2 9 3.2l6 5V15a1 1 0 0 1-1 1h-3.2v-4.2H7.2V16H4a1 1 0 0 1-1-1V8.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
