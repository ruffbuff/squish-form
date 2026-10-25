"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import type { PlaygroundApi } from "@/components/AvatarCanvas";
import { ControlsPanel } from "@/components/ControlsPanel";
import type { AvatarParams } from "@/lib/types";

const AvatarCanvas = dynamic(() => import("@/components/AvatarCanvas"), {
  ssr: false,
});

const INITIAL: AvatarParams = {
  silhouette: "blob",
  color: "#f08a78",
  material: "jelly",
  idle: "both",
  eyes: "dots",
  light: 0.72,
  quality: 1,
  follow: false,
};

export default function Page() {
  const [params, setParams] = useState<AvatarParams>(INITIAL);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiRef = useRef<PlaygroundApi | null>(null);

  const onReady = useCallback((api: PlaygroundApi | null) => {
    apiRef.current = api;
    setReady(api !== null);
  }, []);

  const onChange = useCallback((patch: Partial<AvatarParams>) => {
    setParams((current) => ({ ...current, ...patch }));
  }, []);

  const onDownloadGlb = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;
    setError(null);
    setBusy(true);
    try {
      await api.downloadGlb();
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить PNG");
    }
  }, []);

  return (
    <main className="flex h-dvh flex-col bg-[var(--bg)] md:flex-row">
      <section className="relative h-[58dvh] shrink-0 md:h-auto md:min-h-0 md:flex-1">
        <div className="absolute inset-0" style={{ touchAction: "none" }}>
          <AvatarCanvas {...params} onReady={onReady} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.38)_100%)]" />
      </section>
      <aside className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--line)] bg-[var(--panel)] md:h-dvh md:w-[360px] md:flex-none md:border-t-0 md:border-l">
        <ControlsPanel
          params={params}
          ready={ready}
          busy={busy}
          error={error}
          onChange={onChange}
          onDownloadGlb={onDownloadGlb}
          onDownloadPng={onDownloadPng}
        />
      </aside>
    </main>
  );
}
