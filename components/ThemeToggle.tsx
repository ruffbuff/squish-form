"use client";

import { useEffect, useState } from "react";
import { SegmentControl } from "@/components/SegmentControl";

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
      <SegmentControl
        aria-label="Тема"
        className="theme-segment"
        options={[
          { id: "dark", label: "Тёмная" },
          { id: "light", label: "Светлая" },
        ]}
        value={theme}
        onChange={choose}
      />
    </div>
  );
}
