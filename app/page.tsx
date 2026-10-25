"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaygroundApi } from "@/components/AvatarCanvas";
import { ControlsPanel } from "@/components/ControlsPanel";
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
  follow: false,
  tap: true,
};

export default function Page() {
  const [params, setParams] = useState<AvatarParams>(INITIAL);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [home, setHome] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const apiRef = useRef<PlaygroundApi | null>(null);

  const onReady = useCallback((api: PlaygroundApi | null) => {
    apiRef.current = api;
    setReady(api !== null);
  }, []);

  const onChange = useCallback((patch: Partial<AvatarParams>) => {
    setParams((current) => ({ ...current, ...patch }));
  }, []);

  const onRandom = useCallback(() => {
    setParams((current) => randomizeAvatar(current));
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

  return (
    <main className="flex h-dvh flex-col bg-[var(--bg)] md:flex-row">
      <section className="relative h-[58dvh] shrink-0 md:h-auto md:min-h-0 md:flex-1">
        <div className="absolute inset-0" style={{ touchAction: "none" }}>
          <AvatarCanvas {...params} home={home} onReady={onReady} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(0,0,0,0.28)_100%)]" />
        <button
          type="button"
          aria-label="Камера домой"
          title="Камера домой"
          onClick={() => setHome((value) => value + 1)}
          className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#1c1a17]/90 text-[#f6f1ea] shadow-lg"
        >
          <HomeIcon />
        </button>
        {notice ? (
          <p className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-full bg-[#f4efe8] px-3 py-1.5 text-sm font-medium text-[#1a1613]">
            {notice}
          </p>
        ) : null}
      </section>
      <aside className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--line)] bg-[var(--panel)] md:h-dvh md:w-[380px] md:flex-none md:border-t-0 md:border-l">
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
