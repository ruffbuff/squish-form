"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaygroundApi } from "@/components/AvatarCanvas";
import { ControlsPanel } from "@/components/ControlsPanel";
import { FlatControls } from "@/components/FlatControls";
import { FlatStage } from "@/components/FlatStage";
import { ModeSwitch } from "@/components/ModeSwitch";
import { FpsOverlay } from "@/components/FpsOverlay";
import { statusLine } from "@/lib/a11yStatus";
import { downloadFlatPng, downloadFlatSvg } from "@/lib/flatExport";
import { decodeFlatPreset } from "@/lib/flatPresets";
import { randomizeFlat } from "@/lib/flatRandom";
import { thumbFor3dAsync, thumbForFlatAsync } from "@/lib/historyThumb";
import { FLAT_INITIAL, MODE_STORAGE_KEY, type FlatParams, type PlayMode } from "@/lib/flatTypes";
import {
  DEFAULT_RANDOM_SCOPE_3D,
  DEFAULT_RANDOM_SCOPE_FLAT,
  type RandomScope3d,
  type RandomScopeFlat,
} from "@/lib/randomScopes";
import { randomizeAvatar } from "@/lib/random";
import type { AvatarParams } from "@/lib/types";

const HISTORY_LIMIT = 10;
const PARAMS_STORAGE_KEY = "squishform-params-3d";
const FLAT_STORAGE_KEY = "squishform-params-flat";
const SCOPE_STORAGE_KEY = "squishform-scopes";

type ParamsHistory3d = {
  id: string;
  label: string;
  thumb: string;
  params: AvatarParams;
};

type ParamsHistoryFlat = {
  id: string;
  label: string;
  thumb: string;
  params: FlatParams;
};

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
  const [showFps, setShowFps] = useState(false);
  const [fps3d, setFps3d] = useState(60);
  const [scope3d, setScope3d] = useState<RandomScope3d>(DEFAULT_RANDOM_SCOPE_3D);
  const [scopeFlat, setScopeFlat] = useState<RandomScopeFlat>(DEFAULT_RANDOM_SCOPE_FLAT);
  const [history3d, setHistory3d] = useState<ParamsHistory3d[]>([]);
  const [historyFlat, setHistoryFlat] = useState<ParamsHistoryFlat[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const apiRef = useRef<PlaygroundApi | null>(null);
  const paramsRef = useRef(params);
  const flatRef = useRef(flat);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === "flat" || saved === "3d") setMode(saved);
    } catch {
      /* private browsing */
    }
  }, []);

  useEffect(() => {
    try {
      const rawParams = window.localStorage.getItem(PARAMS_STORAGE_KEY);
      if (rawParams) {
        const parsed = JSON.parse(rawParams) as Partial<AvatarParams> | null;
        if (parsed && typeof parsed === "object") setParams((current) => ({ ...current, ...parsed }));
      }
      const rawFlat = window.localStorage.getItem(FLAT_STORAGE_KEY);
      if (rawFlat) {
        const parsed = JSON.parse(rawFlat) as Partial<FlatParams> | null;
        if (parsed && typeof parsed === "object") setFlat((current) => ({ ...current, ...parsed }));
      }
      const token = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("p");
      const shared = decodeFlatPreset(token);
      if (shared) {
        setFlat((current) => ({ ...current, ...shared }));
        setMode("flat");
      }
      const rawScopes = window.localStorage.getItem(SCOPE_STORAGE_KEY);
      if (rawScopes) {
        const parsed = JSON.parse(rawScopes) as {
          scope3d?: Partial<RandomScope3d>;
          scopeFlat?: Partial<RandomScopeFlat>;
        } | null;
        if (parsed?.scope3d) setScope3d((current) => ({ ...current, ...parsed.scope3d }));
        if (parsed?.scopeFlat) setScopeFlat((current) => ({ ...current, ...parsed.scopeFlat }));
      }
    } catch {
      /* corrupt or unavailable storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    flatRef.current = flat;
  }, [flat]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(params));
      window.localStorage.setItem(FLAT_STORAGE_KEY, JSON.stringify(flat));
      window.localStorage.setItem(SCOPE_STORAGE_KEY, JSON.stringify({ scope3d, scopeFlat }));
    } catch {
      /* ignore quota / private mode */
    }
  }, [params, flat, scope3d, scopeFlat, hydrated]);

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

  const push3dHistory = useCallback((snapshot: AvatarParams) => {
    const entry: ParamsHistory3d = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: "Случайная 3D",
      thumb: "",
      params: snapshot,
    };
    setHistory3d((items) => [entry, ...items].slice(0, HISTORY_LIMIT));
    void thumbFor3dAsync(snapshot).then((thumb) => {
      if (!thumb) return;
      setHistory3d((items) =>
        items.map((item) => (item.id === entry.id ? { ...item, thumb } : item)),
      );
    });
  }, []);

  const pushFlatHistory = useCallback((snapshot: FlatParams) => {
    const entry: ParamsHistoryFlat = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: "Случайная Flat",
      thumb: "",
      params: snapshot,
    };
    setHistoryFlat((items) => [entry, ...items].slice(0, HISTORY_LIMIT));
    void thumbForFlatAsync(snapshot).then((thumb) => {
      if (!thumb) return;
      setHistoryFlat((items) =>
        items.map((item) => (item.id === entry.id ? { ...item, thumb } : item)),
      );
    });
  }, []);

  const onRandom = useCallback(() => {
    const current = paramsRef.current;
    setParams(randomizeAvatar(current, scope3d));
    push3dHistory(current);
  }, [push3dHistory, scope3d]);

  const onFlatRandom = useCallback(() => {
    const current = flatRef.current;
    setFlat(randomizeFlat(current, scopeFlat));
    pushFlatHistory(current);
  }, [pushFlatHistory, scopeFlat]);

  const onHistory3dPick = useCallback((index: number) => {
    setHistory3d((items) => {
      const picked = items[index];
      if (picked) setParams(picked.params);
      return items;
    });
  }, []);

  const onHistoryFlatPick = useCallback((index: number) => {
    setHistoryFlat((items) => {
      const picked = items[index];
      if (picked) setFlat(picked.params);
      return items;
    });
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
          <div className={mode === "3d" ? "absolute inset-0" : "absolute inset-0 pointer-events-none invisible"} aria-hidden={mode !== "3d"}>
            <AvatarCanvas
              {...params}
              home={home}
              paused={mode !== "3d"}
              onReady={onReady}
              onFpsSample={showFps && mode === "3d" ? setFps3d : undefined}
            />
          </div>
          {mode === "flat" ? (
            <div className="absolute inset-0">
              <FlatStage params={flat} onFpsSample={showFps ? setFps3d : undefined} />
            </div>
          ) : null}
        </div>
        <FpsOverlay active={showFps} sample={() => fps3d} />
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
        <p className="sr-only" role="status" aria-live="polite">
          {statusLine(
            mode,
            mode === "flat" ? flat.silhouette : params.silhouette,
            mode === "flat" ? flat.mood : params.mood,
          )}
        </p>
      </section>
      <aside className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-[var(--line)] bg-[var(--panel)] md:h-dvh md:w-[380px] md:flex-none md:border-t-0 md:border-l">
        <div className="shrink-0 border-b border-[var(--line)] px-4 py-3">
          <ModeSwitch value={mode} onChange={onMode} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {mode === "3d" ? (
            <ControlsPanel
              params={params}
              ready={ready}
              busy={busy}
              error={error}
              randomScopes={scope3d}
              randomHistory={history3d}
              showFps={showFps}
              onChange={onChange}
              onRandom={onRandom}
              onScopeChange={(key, enabled) => setScope3d((current) => ({ ...current, [key]: enabled }))}
              onHistoryPick={onHistory3dPick}
              onShowFpsChange={setShowFps}
              onDownloadGlb={onDownloadGlb}
              onDownloadPng={onDownloadPng}
              onDownloadPack={onDownloadPack}
            />
          ) : (
            <FlatControls
              params={flat}
              busy={busy}
              error={error}
              randomScopes={scopeFlat}
              randomHistory={historyFlat}
              showFps={showFps}
              onChange={onFlatChange}
              onRandom={onFlatRandom}
              onScopeChange={(key, enabled) => setScopeFlat((current) => ({ ...current, [key]: enabled }))}
              onHistoryPick={onHistoryFlatPick}
              onShowFpsChange={setShowFps}
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
