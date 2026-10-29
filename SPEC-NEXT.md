# SquishForm — backlog after v0.3.1

Status: synced to the code at `v0.3.8` (this document is the `v0.3.8` docs bump).
The previous draft described the tree just after Flat 2.5D motion landed (`cursor/flat-25d-motion-eye-fit`, PR #11). PRs #12–#22 shipped most of that draft. This file is the ordered list of what is left.

Task 1 (3D silhouette keyboard columns) shipped in `v0.3.3`. The next PR starts at task 2. Task numbers below stay as they are.

Hand the backlog out from the top. Each item is one PR. Do not start a later item in the same PR.

## Goals

1. The avatar stays readable at thumbnail size, in the 128px sidebar still (`.preview-ring`), on the stage, and in PNG/GLB export.
2. Eyes stay on the face: visible when the face is visible, inside the outline, and not buried for a whole blink at the default forward pose.
3. Flat mode reads as a solid 2.5D card at the quarter turns, with one shared motion clock.
4. A written QA list sits at the bottom of this file so new silhouettes, fills, and motions have a checklist. An automated screenshot matrix is not in CI.

## How the code actually behaves

These are the facts the old draft had wrong or had not caught up with.

- 3D eyes sit on the smooth-hull anchor, offset along a blended normal (`eyeQuaternion` keeps them mostly forward). A stencil pass clips them to the projected body. `lib/eyes.ts`, `components/AvatarMesh.tsx`.
- Protrusion is still `lerp(0.45, -0.3, inset) - sink * 0.15`. The stage adds `0.14` on poly (`AvatarMesh`); the sidebar still does not.
- Pear uses a `smoothstep` belly and neck. Bud blends the round base into the bell with `lerp` (the hard `max` collar is gone). `lib/silhouettes.ts`.
- Flat spin is a `scaleX` turntable: the face narrows to `0.45` at 25% and 75% of the cycle, tilts a few degrees, and crossfades to a mirrored back. It is not a literal `rotateY` 360°. Eyes are opacity-hidden on the back half. `components/FlatStage.tsx`.
- The Flat edge is a copy of the outline shifted down-right (`EDGE_DX` 3.6, `EDGE_DY` 4.6) with a three-stop gradient and a light stroke. Quarter-turn keyframes scale that plate so it stays wider than the face. `lib/flatSvg.ts` (`edgeLayer`), PR #21.
- Breathe, float, and bounce use `rotateX`, `translateZ` / `translate3d`, and `scale3d`. The shadow is a second element on the same `--squish-flat-dur` token.
- The sidebar still reuses `seatEyePosition` and `eyeQuaternion` (`lib/avatarStill.ts`). It does not stencil-clip, and it skips the poly forward lift.
- Flat and 3D settings, the mode, and random scopes persist in `localStorage`. There is no WebGL context-loss handler.

## Shipped

| Item | Where |
| --- | --- |
| Symmetric eye search. Both anchors share one `minFacing` step, then the better side is mirrored. | `placeEyes` in `lib/eyes.ts`, `lib/eyes.test.ts`. PR #12, `a18fda7`. |
| Eye fit checks: symmetry, bounds, determinism, mood half-extents, protrusion band, seating along the normal. | `lib/eyes.test.ts`. PR #12. |
| Smooth hull cache. One canonical geometry per silhouette; callers get a clone. Eye anchors are cached too. | `createSilhouetteGeometry` in `lib/silhouettes.ts`, `anchorCache` in `lib/eyes.ts`. PR #16, `c0667f4`. The “under 16 ms” switch target has no benchmark. |
| Silhouette tests: centered unit fit, no NaN, mirror symmetry, blob wobble, pear/bud collar (radius step under 0.08 near the eyes). | `lib/silhouettes.test.ts`. PR #12. |
| Flat motion clock. Speed maps to `--squish-flat-dur` (4.40s–1.80s). Smoothness maps to `--squish-flat-ease`. Spin stays linear. Eye moods use `FLAT_EYE_MULTIPLIER` on the same base. Shadow, edge, body, and eyes read those tokens. | `lib/flatMotion.ts`, `components/FlatStage.tsx`, `lib/flatMotion.test.ts`. PRs #13 and #15 (`745fe41`, `82da9fb`), spin clock retied in PR #21. |
| Flat speed and smoothness controls. | `FlatParams.speed` / `smoothness`, easing in `flatEasing`. PR #15. |
| Flat edge wall, first version. Shifted plate, lit-to-shade gradient, drawn behind the body. | `edgeLayer` in `lib/flatSvg.ts`, `lib/flatEdge.test.ts`. PR #21, `e34dc57`. |
| Flat cursor parallax and a two-step bounce. | `--look-x` / `--look-y` in `FlatStage`, bounce keyframes. PR #20, `27f57a6`. |
| Named Flat presets and a URL-safe share token (`#p=`). Invalid fields are dropped. | `lib/flatPresets.ts`, `components/FlatControls.tsx`, `lib/flatPresets.test.ts`. PR #18, `986bb32`. |
| Random draws from the same Flat and 3D catalogs the controls use (uniform). It does not change motion, light, follow, or tap. It does not copy how often the six presets use each silhouette. Leave that distribution alone. | `lib/random.ts`, `lib/flatRandom.ts`. |
| 3D export: GLB (rest eye pose), transparent PNG of the current frame, project-pack zip. Flat export: static SVG and PNG. | `lib/export.ts`, `lib/flatExport.ts`, `lib/projectPack.ts`. |
| At least one three-stop Flat fill. Jelly, duo, and speckled each have three stops. | `fillAttrs` in `lib/flatSvg.ts`. |
| Two eye styles per mode, with mood shapes. 3D: dots and ovals (`eyeMoodShape`). Flat: dots and capsules (`flatEyeOutline`). | `lib/eyes.ts`, `lib/flatEyes.ts`. |
| Focus ring is an outer outline; the selected silhouette tile is a filled border. | `button:focus-visible` and `.sil-grid button:focus-visible` in `app/globals.css`. PR #13. |
| Arrow keys move focus inside grids. Enter and Space activate the focused `<button>`. Home and End jump to the ends. Flat silhouettes use 4 columns, matching the grid. Mood, material, and motion use `SegmentControl` as one row. | `lib/gridNav.ts`, `components/useGridNav.ts`, `lib/gridNav.test.ts`. PR #14, `73c58e9`. |
| 3D silhouette arrows follow the 3-column grid (8 tiles, ArrowDown moves by 3). Flat stays at 4. A CSS grid’s column count is the computed track list, so `--sil-columns` and the arrows cannot drift. Preset-chip wrap is still task 25. | `SILHOUETTE_GRID_COLUMNS` in `lib/gridNav.ts`, `.sil-grid` / `.sil-grid--flat` in `app/globals.css`, `components/SilhouettePicker.tsx`. `v0.3.3`. |
| Polite live region announces mode, silhouette, and mood. | `statusLine` in `lib/a11yStatus.ts`, `app/page.tsx`. PR #14. |
| `prefers-reduced-motion` in both modes. 3D freezes idle, eye loops, follow, and the contact shadow at `STILL_POSE` (time 0). Flat CSS stops every loop, drops cursor tilt, and holds `rotateX(-5deg) rotateY(-14deg)` with a static shadow. | `components/AvatarMesh.tsx`, `components/ContactShadow.tsx`, `lib/motion.ts`, `FlatStage` media query. 3D: PR #22, `897202b`. Flat pose: PR #14. |
| Settings survive reload. | `squishform-mode`, 3D params, Flat params, and random scopes in `app/page.tsx`. |
| CI runs `npm test` and `npm run build` on `main`, `cursor/**`, and pull requests. | `.github/workflows/ci.yml`. PR #12. |
| Flat already includes heart and star (also cloud, blob, squircle, flower, drop, capsule, triangle, pentagon, hex, cottage). | `SHAPE_DRAFTS` in `lib/flatShapes.ts`. |

3D and Flat shadows share their mode’s clock (`state.clock.elapsedTime` plus `idlePose` in 3D; one CSS duration in Flat), so a mode change restarts body and shadow together. No separate drift bug turned up in the code. Float’s shadow still peaks with the body, which the motion notes below call out.

## Backlog

Do these in order. The first items are small and protect later eye and export work.

### 1. Fix 3D silhouette keyboard columns — done (`v0.3.3`)

`SilhouettePicker` passes `SILHOUETTE_GRID_COLUMNS` (3). `.sil-grid` sets `--sil-columns: 3`, and keyboard nav reads the computed tracks. ArrowDown on the eight tiles moves by 3; ArrowRight on index 2 stops. Flat is `.sil-grid--flat` with 4 columns. Preset-chip wrap is still task 25.

### 2. Seat-clearance test for 3D eyes — done (`v0.3.4`)

The current tests check bounds and mood half-extents. They do not sample the hull around the seated eye.

Acceptance: `npm test` places every silhouette at the default inset (`EYE_INSET_DEFAULT`), for calm, joy, sleep, and wow, dots and ovals. The eye center is inside the smooth hull, and the forward cap stays within the `eyeProtrusion` band of the local surface. Change production fit only if a case fails, in this same PR.

### 3. Match the sidebar still to the stage seat — done (`v0.3.5`)

`renderAvatarStill` skips the poly lift (`+0.14`) and the poly depth scale (`0.86`) that `AvatarMesh` applies at rest. The still is 128×128, from `lib/avatarStill.ts`.

Acceptance: for one smooth silhouette and one poly silhouette, the still’s eye positions match `seatEyePosition` with the same protrusion and depth the stage uses at idle time 0. A test locks those numbers. Stencil clipping of the still is out of scope.

### 4. Deterministic 3D PNG — done (`v0.3.6`)

`captureAvatarPng` grabs whatever pose the clock is in, at the quality slider’s pixel ratio (cap 1, 1.35, or 1.75). The background is already cleared to transparent and the backdrop and shadow are hidden. Flat PNG is already a static raster of the rest SVG.

Acceptance: the 3D PNG is the rest pose (idle time 0, no look offset), transparent, at pixel ratio 2 regardless of the quality slider. Two captures with the camera unmoved match aside from the filename timestamp.

### 5. Clamp 3D gaze to the eye box — done (`v0.3.7`)

Look-around and idle wander slide on the tangent plane by `0.2` and `0.14` radii (`AvatarMesh` `useFrame`). Nothing stops that slide at the silhouette edge.

Acceptance: at look `(±1, ±1)` the eye center stays inside the current layout box (spread and vertical lift from `LAYOUT`, plus the mood half-extents) for every silhouette. Wander uses the same clamp. A unit test feeds those look values. A full budget rewrite is task 10.

### 6. Flat reduced motion keeps one breathe — done (`v0.3.8`)

The media query in `FlatStage` already stops spin, float, bounce, blink loops, and cursor parallax, and holds the three-quarter pose. It does not play a single breathe.

Acceptance: with `prefers-reduced-motion: reduce`, spin, float, bounce, and follow do not loop; the card rests on `rotateX(-5deg) rotateY(-14deg)`; breathe runs once, slowly, then holds. Toggling the media query does not change the element’s box.

### 7. Lag the Flat float shadow by a third of a cycle

Float’s body and shadow both peak at 50% (`squish-flat-float`, `squish-flat-shade-float`). The motion target is a shadow that lags by one third of the cycle. Both already share `--squish-flat-dur`.

Acceptance: the shadow’s most lifted, most faded keyframe is one third of the duration after the body’s highest point. Switching idle still restarts body and shadow together. A test or a comment next to the keyframes records the offsets.

### 8. Aim the edge gradient along the fill light

`edgeLayer` builds a bbox diagonal from `(minX, minY)` to `(maxX + EDGE_DX, maxY + EDGE_DY)`. Fill light uses `gradientCenterX` / `gradientCenterY`. The wall colors do follow the fill mix.

Acceptance: two different gradient centers produce different wall-gradient endpoints in `flatLayers`. The wall is still painted before the body (`lib/flatEdge.test.ts` stays green). Quarter-turn scale keyframes stay as they are.

### 9. Animated Flat SVG export

The motion clock is centralized, which was the gate for this. `downloadFlatSvg` writes a static SVG with no CSS animation. GIF and WebM wait until task 23.

Acceptance: the downloaded SVG runs the current idle and eye mood with `flatDuration` and `flatEasing`. Spin stays linear. The back half of a spin does not show eyes. Opening the file in a browser loops in step with those tokens.

### 10. Per-silhouette eye budget

`LAYOUT` is still a hand table of `y`, `spread`, and `sink`. Radius comes from the bounding box (`profile * 0.036`, clamped). There is no per-silhouette max radius, max mood scale, or max protrusion.

Acceptance: each 3D silhouette exposes spread, vertical lift, max radius, max mood scale, and max protrusion derived from the hull box. `lib/eyes.test.ts` and the task 2 clearance test pass. A hand override, if one silhouette still needs it, is a named constant with a test that cites that id.

### 11. Curvature probe for spread and sink

Sink is the hand-authored “curvature” term in `LAYOUT`. Both anchors already share a facing threshold.

Acceptance: spread and sink are computed from curvature sampled at the two anchors, with the same sample positions mirrored. Pear and bud pass the collar test and the clearance test. The per-id sink table is gone.

### 12. Restore the WebGL context without a blank stage

The stage canvas (`components/AvatarCanvas.tsx`) does not listen for `webglcontextlost` or `webglcontextrestored`. Params are already in `localStorage`.

Acceptance: a lost context does not leave the stage blank after restore; the current avatar renders again without a reload. A reload still restores the saved mode and params.

### 13. Contrast check for eyes against fills

Eyes are `#0e0c0a` in both modes. Nothing checks that against a fill. Jelly, duo, and speckled are three-stop; other fills are one or two.

Acceptance: `npm test` measures contrast of `#0e0c0a` against each Flat fill’s darkest stop and against each named preset. A pair under 3:1 fails, and this PR adjusts that preset or fill so it passes. The default 3D body color gets the same check.

### 14. Named 3D presets and a share link

Flat has six named presets and `#p=`. 3D random and the color swatches are not named looks, and there is no 3D token.

Acceptance: at least four named 3D presets set silhouette, colors, material, eyes, and mood. Encode and decode round-trip in a unit test; unknown fields are dropped. The link does not change light, follow, or tap. Flat links keep working.

### 15. 3D shape registry and a collar check for every silhouette

`shapeVertex` is a chain of `if`s. The collar test covers pear and bud only. Flat already keeps drafts in `SHAPE_DRAFTS`, with no symmetry or self-intersection tests.

Acceptance: each 3D silhouette is a function in a registry keyed by id. The radius-step test (step under 0.08 at eye height) runs for all eight ids. Existing symmetry tests stay green.

### 16. 3D heart

Flat already has a heart. 3D ids are blob, bean, squircle, pear, pill, bun, mochi, bud. Drop-with-tail and cube-soft do not exist in either mode.

Acceptance: one new 3D id, with an eye-budget entry, passes the clearance test and the collar test, and shows a thumbnail in the picker. No second silhouette in this PR.

### 17. 3D star

Acceptance: same bar as task 16, for a star. Heart stays as it was.

### 18. 3D drop with a tail

Acceptance: same bar as task 16. The tail is part of the hull (the eye band does not sit on the tail), and the collar test passes along the eye band.

### 19. 3D soft cube

Acceptance: same bar as task 16. The cube stays softened (no razor edges that break the eye seat).

### 20. Poly eye socket

Poly eyes are the same spheres, pushed forward by `0.14` with `polygonOffset` on the body. Smooth eyes should stay spheres.

Acceptance: on `surface: "poly"`, each eye sits in an inset cap aligned to the facet under the anchor. The front view reads as a cut-out. The clearance test passes. Smooth seating is unchanged.

### 21. Stencil versus transmission

Jelly (`transmission` 0.78) and soap (`0.42`) are see-through, and the stage canvas leaves `preserveDrawingBuffer` off (the still renderer turns it on). Eyes stencil against the body. Nobody has checked that the transparent pass keeps the eyes in Chrome and Firefox.

Acceptance: at the default front camera, jelly and soap show both eyes in Chrome and Firefox. Record the result in this file. If a browser drops the eyes, this PR draws them in a pass the transmission material does not erase.

### 22. Rounded Flat side wall

The shifted plate from PR #21 is the baseline. A true offset wall is only worth doing if that plate still reads as a second sticker.

Acceptance: at the spin quarter-turn keyframes the wall is a rounded offset of the silhouette, wider than the face, with no gap against the face and no eyes on the back. Face scale stays at or above the current `0.45` floor so the card never becomes a line.

### 23. Flat GIF or WebM export

Depends on task 9. The SVG export stays.

Acceptance: one animated download covers a single cycle of the current idle. Spin frames hide eyes on the back half. The SVG download from task 9 still works.

### 24. Highlight eye style

Dots, ovals, and capsules already have mood tables. There is no highlight and no lash.

Acceptance: one new 3D style draws a highlight, with its own mood scale table, and passes the fit and clearance tests. Dots and ovals render as they do today.

### 25. Preset-chip keyboard follows the wrap

`presetNav` uses `useGridNav(FLAT_PRESETS.length)`, so the six chips are one logical row. `.preset-row` is `flex-wrap: wrap`, and on the 380px panel they wrap.

Acceptance: when the chips wrap, ArrowDown focuses the chip below and ArrowLeft / ArrowRight stay on the visual row. A single-line row ignores ArrowUp and ArrowDown.

## Manual QA

Not a PR. Run this before a release that touches silhouettes, eyes, or motion. CI covers unit tests and the production build only.

- Browsers: Chrome, Edge, Firefox, Safari (desktop), iOS Safari.
- Pixel ratio 1 and 2. Viewports 1440×900, 1280×720, and 390×844.
- 3D and Flat, smooth and poly, every silhouette, moods calm / joy / sleep / wow, idles none / breathe / float / spin / bounce (3D also sway).
- Front, three-quarter, and profile on any pass that can show a detached eye.
- No console errors. `npm test` and `npm run build` are green.
- Exported PNG matches the stage at idle time 0 once task 4 has landed. Until then, compare the PNG to the frame that was on screen.
- `prefers-reduced-motion`: 3D holds `STILL_POSE`; Flat holds the three-quarter pose. After task 6, Flat also breathes once.
- Ten Flat avatars at 60 fps on a mid-range laptop is a manual look, not a CI gate. The FPS overlay on the stage is the in-app readout (`FpsOverlay`).

## Old draft, item by item

The numbers are the previous `SPEC-NEXT.md` sections.

| Ref | Status | Note |
| --- | --- | --- |
| 3.2.1 Eye budget | Partially done | Radius from the hull box. Spread, lift, and sink are still the `LAYOUT` table. Task 10. |
| 3.2.2 Curvature probe | Not started | Task 11. |
| 3.2.3 Symmetric anchors | Done | PR #12. |
| 3.2.4 Surface clearance test | Partially done | Fit tests exist. Hull sampling is task 2. |
| 3.2.5 Poly socket | Not started | Poly lift only. Task 20. |
| 3.2.6 Stencil and transmission | Partially done | Stencil and transmission materials exist. No browser check. Task 21. |
| 3.2.7 Gaze leash | Partially done | Short tangent slide, no edge clamp. Task 5. |
| 4.2.1 Edge mesh | Partially done | Shifted plate, PR #21. Rounded offset is task 22. |
| 4.2.2 Specular band on the edge | Partially done | Static three-stop gradient. It does not follow `gradientCenter`. Task 8. |
| 4.2.3 Shared Flat clock | Done | PRs #13, #15, #21. |
| 4.2.4 Flat speed and smoothness | Done | PR #15. Spin stays linear on purpose. |
| 4.2.5 Reduced-motion personality | Partially done | Static three-quarter pose, no single breathe. Task 6. |
| 4.2.6 Shadow drift | Done | Shared duration. The missing one-third float lag is task 7, not a desync. |
| 4.2.7 Ten-avatar FPS test | Not started | Manual note in QA. No CI gate. |
| 5.1 Shape registry and tests | Partially done | Tests exist. 3D shapes are not a registry. Collar test is pear and bud only. Task 15. |
| 5.2 Curvature check | Partially done | Pear and bud only. Task 15 extends it. |
| 5.3 New silhouettes | Partially done | Flat has heart and star. 3D additions are tasks 16–19. |
| 5.4 Three-stop fills and contrast | Partially done | Three-stop fills exist. Contrast is task 13. |
| 5.5 More eye styles | Partially done | Two styles per mode. Highlight is task 24. |
| 6.1 Named presets | Partially done | Flat presets and links, PR #18. 3D is task 14. Random stays a uniform catalog sample. |
| 6.2 Animated Flat export | Not started | Clock gate is open. Tasks 9 and 23. GLB, PNG, and the project pack are done. |
| 6.3 Deterministic PNG | Partially done | Flat PNG is a static rest raster. 3D PNG is the live frame. Task 4. |
| 6.4 Hull cache | Done | PR #16. |
| 6.5 Context loss | Partially done | `localStorage` holds the look. Restore is task 12. |
| 7.1 Focus versus selected | Done | PR #13. |
| 7.2 Keyboard grids | Partially done | 3D and Flat silhouette grids match their columns (`v0.3.3`). Mood row is one line. Preset wrap is task 25. |
| 7.3 Live region | Done | PR #14. |
| 7.4 Reduced motion, both modes | Done | PR #22 and the Flat media query. The extra Flat breathe is task 6. |
| 7.5 Eye contrast | Not started | Task 13. |
| 8 QA matrix | Partially done | The checklist above is the written matrix. It is manual. |
