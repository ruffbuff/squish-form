# Глина / SquishForm

Local playground for a soft 3D avatar: one form you can reshape, recolor, and export. It is an identity preview for a bot, not a game.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you can change

- **Silhouette** — drop, bean, squircle, pear, pill, bun. All procedural. No external mesh files.
- **Eyes** — dots or ovals. They blink, look around, and the body leans with the gaze.
- **Color** — hue / saturation picker, swatches, and a hex field.
- **Material** — matte, jelly, clay, soft gloss, pearlescent.
- **Idle** — breathe, sway, or both. Drag to orbit.
- **Quality** — mesh density, pixel ratio, and the contact shadow.
- **Highlight** — a point light you can slide left to right.
- **Follow cursor** — eyes and lean track the pointer over the canvas.
- **Tap the form** — a short squash and wiggle.

## Export

- **Скачать GLB** — body and eyes at rest, named `squish-{silhouette}-{timestamp}.glb`.
- **Скачать PNG** — the current frame, transparent background, named `squish-{silhouette}-{timestamp}.png`.

The live view keeps a dark studio background so jelly and gloss read clearly. The PNG drops that background.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, React Three Fiber, drei, three.js.
