# Глина / SquishForm

Local playground for a soft 3D avatar: one jelly, clay, or matte form you can spin, recolor, and export. It is an identity preview for a bot, not a game.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you can change

- **Silhouette** — `blob` (drop), `bean`, `squircle`. All three are procedural sphere displacements. There are no external GLB assets.
- **Color** — one hex color, applied to the material.
- **Material** — `matte`, `jelly` (transmission), `clay` (sheen plus a soft generated grain).
- **Idle** — breathe, sway, or both. Drag to orbit the camera.

## Export

- **Скачать GLB** — current mesh and material, rest pose, named `glina-{silhouette}-{timestamp}.glb`.
- **Скачать PNG** — current frame, transparent background, named `glina-{silhouette}-{timestamp}.png`.

The live view keeps a dark studio background so jelly reads clearly. The PNG drops that background.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, React Three Fiber, drei, three.js.
