import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../components/FlatStage.tsx", import.meta.url), "utf8");

describe("Flat reduced motion", () => {
  it("keeps non-breathe idle animations disabled", () => {
    expect(source).toContain(".squish-flat-breathe,");
    expect(source).toContain(".squish-flat-float,");
    expect(source).toContain(".squish-flat-spin,");
    expect(source).toContain(".squish-flat-bounce,");
    expect(source).toContain("{ animation: none; }");
  });

  it("plays one slow breathe and holds the reduced-motion pose", () => {
    expect(source).toContain("animation-name: squish-flat-reduced-breathe;");
    expect(source).toContain("animation-duration: calc(var(--squish-flat-dur, 3.2s) * 2);");
    expect(source).toContain("animation-iteration-count: 1;");
    expect(source).toContain("animation-fill-mode: both;");
    expect(source).toContain("rotateX(-5deg) rotateY(-14deg)");
  });
});
