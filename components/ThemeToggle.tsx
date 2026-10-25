"use client";

import { useEffect, useState } from "react";

export const THEME_KEY = "squish-theme";

export type ThemeName = "dark" | "light";

export function readTheme(): ThemeName {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Preference stays on the document for this visit.
  }
}

/** Dark and light Jelly Soft. The choice is stored; otherwise the system theme is used. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const choose = (next: ThemeName) => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div className="theme-row">
      <span className="label">Тема</span>
      <div className="segment" role="group" aria-label="Тема">
        <button type="button" aria-pressed={theme === "dark"} onClick={() => choose("dark")}>
          Тёмная
        </button>
        <button type="button" aria-pressed={theme === "light"} onClick={() => choose("light")}>
          Светлая
        </button>
      </div>
    </div>
  );
}
