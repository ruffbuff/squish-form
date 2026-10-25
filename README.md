# SquishForm

Soft 3D avatars for bot and agent projects. The playground is free. A paid project pack may come later. There is no paywall and no pricing in the app.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you can change

- **Silhouette** — drop, bean, squircle, pear, pill, bun, shown as icon previews. The circle above Random is a still frame of the current avatar.
- **Surface** — smooth by default. Polygons is an optional flat look.
- **Eyes** — small black dots or soft black ovals. They blink and look around. Size is a slider.
- **Color** — solid, or a two-stop gradient with angle and a soft or hard blend.
- **Material** — matte, jelly, clay, gloss, pearlescent.
- **Rim** — optional fresnel. Zero turns it off.
- **Motion** — none, breathe, sway, bounce, or a full spin out and back. Speed and smoothness apply to all of them.
- **Quality** — pixel ratio and the contact shadow.
- **Backdrop** — empty, studio gradient, or a soft floor grid.
- **Light** — a point light with horizontal, vertical, and intensity controls, or off. The bulb hides when the light is off.
- **Follow cursor** — eyes and lean track the pointer.
- **Tap reaction** — its own on/off toggle.
- **Camera home** — the round button at the bottom-right of the view returns the camera to the standard pose.
- **Random** — silhouette, color, gradient, material, and eyes. It does not change light, follow, tap, or motion.

## Export

Two paths, both free:

- **Files** — `squish-{silhouette}-{timestamp}.glb` (body and eyes, rest pose) and a transparent PNG of the current frame.
- **Project pack** — a zip with `avatar.glb`, a drop-in `squish-avatar.tsx` for React Three Fiber, and a short README on how to place it in a Canvas.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, React Three Fiber, drei, three.js.
