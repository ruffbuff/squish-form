# SquishForm

Soft 3D avatars for bot and agent projects. The playground is free. A paid project pack may come later. There is no paywall and no pricing in the app.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you can change

- **Silhouette** — drop, bean, squircle, pear, pill, bun. Procedural icospheres, so gloss and jelly do not show a sphere-pole seam.
- **Eyes** — small black dots or soft black ovals. They blink and look around. Size is a slider.
- **Color** — swatches, a hue/saturation pad, and hex.
- **Material** — matte, jelly, clay, gloss, pearlescent.
- **Motion** — none, breathe (scale), sway (tilt), or both. They do not share the same motion.
- **Quality** — mesh density, pixel ratio, and the contact shadow.
- **Light** — a point light with horizontal, vertical, and intensity controls, or off. The bulb hides when the light is off. Fill lights stay on.
- **Follow cursor** — eyes and lean track the pointer.
- **Tap reaction** — its own on/off toggle. A tap squashes the form.
- **Random** — new silhouette, color, material, eyes, and motion. Quality and the light settings stay.

## Export

Two paths, both free:

- **Files** — `squish-{silhouette}-{timestamp}.glb` (body and eyes, rest pose) and a transparent PNG of the current frame.
- **Project pack** — a zip with `avatar.glb`, a drop-in `squish-avatar.tsx` for React Three Fiber, and a short README on how to place it in a Canvas.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, React Three Fiber, drei, three.js.
