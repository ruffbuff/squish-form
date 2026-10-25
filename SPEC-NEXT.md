# SquishForm — specification for the next iteration

Status: proposed
Scope: after `cursor/flat-25d-motion-eye-fit` (2.5D Flat motion, 3D eye fitting, silhouette fixes)

## 1. Goals

1. Keep the avatar charming and readable at every scale: 24 px thumbnail, 160 px sidebar still, full stage, PNG/GLB export.
2. Make eyes a first-class, silhouette-aware system: always visible when the face is visible, never floating outside the outline, never clipped by the body at rest or during mood/idle animation.
3. Finish the Flat mode as a genuine 2.5D motion language: perspective, parallax, thickness and lighting, not a flat sticker that collapses to a line at 90°.
4. Ship a written QA matrix so future silhouettes, fills and motions cannot silently regress eyes or motion.

## 2. Current baseline (already merged / on branch)

- 3D eyes are seated on the smooth-hull anchor along the local surface normal and oriented by a blended normal (mostly forward). A stencil silhouette pass clips eyes to the projected body outline.
- Eye protrusion uses `lerp(0.45, -0.3, t) - sink * 0.15`; poly surfaces get an extra forward lift.
- Pear belly `smoothstep` bug fixed; bud base blends into the bell instead of using a hard `max` (no collar across the eyes).
- Flat uses a front/back card with `preserve-3d`, a 360° `rotateY` spin, depth-aware shadow and a thin silhouette edge at 90°/270°.
- Flat breathe/float/bounce now use `rotateX`, `translateZ` and depth-scaled shadows.
- Still previews and silhouette thumbnails reuse the same eye quaternion/seat math.

## 3. 3D eyes

### 3.1 Fit rules (must hold for every silhouette × surface × mood × idle phase)

- At rest with the default inset, both eyes are fully readable at 1× and at 160 px.
- No eye pixels outside the projected silhouette at any camera/rig angle. Stencil masking is the safety net; anchors and sizing must still look intentional, not cut in half.
- No eye is buried by the body for more than one blink interval at the default forward-facing pose.
- Eyes never intersect each other, and never cross the nose/mouth midline on narrow silhouettes (bud, pear neck).
- During `joy`, `sleep`, `wow`, `calm` and tap squash, the eye silhouette stays inside the body budget; when the body rotates to profile, eyes may hide behind the body or clip at the rim, but must not detach as a full oval.

### 3.2 Work items

1. Replace the fixed `LAYOUT` table with a per-silhouette **eye budget**: horizontal spread, vertical lift, max radius, max mood scale, max forward protrusion. Derive defaults from the smooth hull bounding box and curvature at the eye band.
2. Add a curvature probe at the two anchors. On high-curvature silhouettes, reduce `spread` and `sink` automatically instead of hand-tuning.
3. Make anchor search deterministic and symmetric: evaluate both sides with a mirrored candidate set so one anchor cannot fall back to a different `minFacing` than the other.
4. Add a "surface clearance" test in a small node script: sample the hull around each anchored eye, ensure the eye capsule at every mood scale is either inside or intentionally masked.
5. Evaluate a real eye socket/decal option for `poly`: an inset cap that follows the facet plane, so eyes read as cut-outs rather than stuck-on spheres.
6. Revisit stencil interaction with transmission materials (jelly, soap): confirm eyes are not clipped on transparent passes in all browsers and with `preserveDrawingBuffer` off.
7. Eye look-around: keep the current tangent-plane slide, but clamp to the local eye budget; add a soft leash so gaze never pulls an eye over a silhouette edge.

### 3.3 Acceptance

- Screenshot matrix: 8 silhouettes × {smooth, poly} × {calm, joy, sleep, wow} × {front, 3/4, profile} has zero detached-eye frames.
- The same matrix in the sidebar still and the exported PNG matches the stage.
- No visible stencil stair-stepping on smooth silhouettes at 2× DPR.

## 4. Flat 2.5D motion

### 4.1 Motion language

- Every Flat idle must have a Z axis: parallax between body, eyes and shadow. Transform origin stays at the visual center, not the card box corner.
- `spin`: full 360° over one cycle, constant angular velocity, subtle `rotateX` tilt. The body must read as a solid sticker with visible thickness near 90° and 270°, and the back must not show eyes. The current edge overlay is the baseline; replace it with a proper extruded edge if quality is not sufficient.
- `breathe`: squash/stretch plus a small forward lean; shadow grows and softens.
- `float`: vertical travel, Z lift, slight counter-rotation; shadow lags one third of a cycle.
- `bounce`: two hops with landing squash; shadow compresses on contact.
- No motion may introduce a visible seam between front face and edge, and no motion may clip eyes at the card border.

### 4.2 Work items

1. Build a real **edge mesh** for the card: for each silhouette, generate a shallow extrusion polygon (or an SVG `path` offset) so 90° shows a rounded side wall rather than a scaled copy.
2. Add a specular band on the edge that follows the light direction already used by fills.
3. Centralize Flat timing in one token set (`--squish-flat-dur`, `--squish-flat-ease`, shadow phase). Spin, shadow and edge must share the same clock.
4. Support speed/smoothness in Flat: currently the duration comes from params but easing is fixed.
5. Add reduced-motion fallbacks that preserve personality: static 3/4 pose plus one slow breathe cycle, no spin/float.
6. Audit Flat shadow animation for drift: shadow and body currently use separate transforms and can desync after a mode switch.
7. Add an FPS budget test for 10 simultaneous Flat avatars at 60 fps on a mid-range laptop.

### 4.3 Acceptance

- Filmstrip of spin at 0/45/90/135/180/225/270/315°: no razor-thin frame, no eyes on the back, no edge popping.
- Flat and 3D read as the same character at the same silhouette/mood.
- `prefers-reduced-motion` removes looping motion without layout shift.

## 5. Silhouettes and fills

1. Extract shape functions into a registry with a unit test per silhouette: symmetry, bounding box, monotonic radius, no self-intersection.
2. Add a curvature/derivative check so a shape cannot produce a horizontal collar (the pear bug) or a pinch that traps the eyes.
3. Add new silhouettes only with an eye-budget entry and thumbnail check: heart, star, drop-with-tail, cube-soft.
4. Fill/gradient presets: keep at least one 3-stop fill; validate contrast against eye color and rim light.
5. More eye styles: dot, capsule, oval, plus optional highlight and lash variants; each style gets its own mood table and fit budget.

## 6. Presets, export and performance

1. Named presets with URL-safe serialization; random should sample the same distributions as manual presets.
2. Export: keep GLB/PNG/project pack. Add animated Flat export (SVG with CSS, then GIF/WebM) only after the motion clock is centralized.
3. PNG export must be deterministic: freeze at t=0, DPR 2, transparent background option.
4. Performance: cache smooth hulls per silhouette at module level; currently each still/thumbnail rebuilds a 144×108 sphere. Target < 16 ms for a silhouette switch.
5. WebGL context loss: recover without blanking the stage; keep the selected preset in localStorage.

## 7. Accessibility and UX

1. Ensure every control has a visible focus ring that cannot be confused with the selected state. Audit the silhouette grid: `aria-pressed` and the focus ring currently look similar, which makes the wrong tile look selected.
2. Keyboard: arrow-key navigation inside the silhouette and mood grids; Enter/Space selects.
3. Announce mode, silhouette and mood changes through a polite live region.
4. Respect `prefers-reduced-motion` in both modes.
5. Check contrast of eye color on every fill preset.

## 8. QA matrix and release checklist

- Browsers: Chrome, Edge, Firefox, Safari (desktop), iOS Safari.
- DPR: 1, 2; viewport: 1440×900, 1280×720, 390×844.
- Modes: 3D/Flat × smooth/poly × 8 silhouettes × 4 moods × 5 idles.
- Every screenshot pass must include front, 3/4 and profile.
- No console errors; no WebGL warnings; typecheck and production build green.
- Compare exported PNG against the stage at the same timestamp.

## 9. Suggested order

1. Eye anchor/budget refactor + deterministic symmetric search (3D correctness).
2. Flat edge mesh + shared motion clock (2.5D quality).
3. Focus ring/accessibility pass (small, high user impact).
4. Animated Flat export (only after 1–2).
5. New silhouettes and eye styles, one at a time, each with the full QA matrix.
