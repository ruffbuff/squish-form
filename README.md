# SquishForm

Soft avatars for bot and agent projects. The playground is free. A paid project pack may come later. There is no paywall and no pricing in the app.

## Modes

Switch **3D | Flat** at the top of the panel. The last choice is stored in this browser. First visit opens 3D. Each mode keeps its own settings, and both sets are restored on the next visit.

- **3D** — the React Three Fiber avatar (GLB, PNG, project pack).
- **Flat** — soft 2.5D stickers as SVG: a tilted silhouette, drop shadow, and dot or capsule eyes. Flat exports PNG and SVG. GLB and the project pack stay in 3D.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you can change

### 3D

- **Silhouette** — drop (blob), bean, squircle, pear, pill, bun, mochi, bud. The buttons are colored previews with eyes. The circle above Random is a still frame of the current avatar.
- **Surface** — smooth by default. Polygons is an optional flat look.
- **Eyes** — dots or ovals, with a mood: calm (a rare blink), joy (a squint that pulses), sleep (lids that breathe), or surprise (a pop, then it settles). Size and depth are sliders. Depth presses the eyes into the form.
- **Color** — solid, or a two-stop gradient with angle and a soft or hard blend.
- **Material** — matte, jelly, clay, gloss, pearlescent, ceramic, velvet, soap.
- **Rim** — optional fresnel. Zero turns it off.
- **Motion** — none, breathe, sway, bounce, a full spin out and back, or float (up and down only). Speed and smoothness apply to all of them.
- **Quality** — pixel ratio and the contact shadow.
- **Backdrop** — empty, studio gradient, or a soft floor grid.
- **Light** — a point light with horizontal, vertical, and intensity controls, or off. The bulb hides when the light is off.
- **Follow cursor** — eyes and lean track the pointer.
- **Tap reaction** — its own on/off toggle. Holding on the form squashes it; letting go springs back. A camera drag does not keep the squash.
- **Camera home** — the round button at the bottom-right of the view returns the camera to the standard pose.
- **Random** — silhouette, color, gradient, material, eyes, eye mood, and a small eye-depth jitter. It does not change light, follow, tap, or motion.

## Export

Two paths, both free:

- **Files** — `squish-{silhouette}-{timestamp}.glb` (body and eyes, rest pose) and a transparent PNG of the current frame.
- **Project pack** — a zip with `avatar.glb`, a drop-in `squish-avatar.tsx` for React Three Fiber, and a short README on how to place it in a Canvas.

### Flat

- **Silhouette** — cloud, blob, rounded square, star, flower, drop, capsule, triangle, pentagon, heart, hex, cottage. The grid and the round preview use the current color.
- **Eyes** — dots or vertical capsules. Moods: calm (a blink), joy, sleep, surprise. Size is a slider.
- **Color** — solid, or a two-stop gradient.
- **Fill** — flat, soft gloss, matte, jelly, duo, or speckled. All of it is SVG, not a mesh.
- **Motion** — none, breathe, float, spin, or bounce. Speed applies to those and to the blink.
- **Random** — silhouette, color, fill, and eyes. It does not change motion.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, React Three Fiber, drei, three.js. Flat mode is SVG and does not use the 3D renderer.
