# garden

Animated SVG night-garden art for Vue 3. Depends only on `vue`; plain CSS in `garden.css` (imported by `index.ts`). All art is decorative (`aria-hidden`). Colours are muted to sit on a flat near-black page.

```vue
<script setup lang="ts">
import { Vine, Plant, Leaf, parsePath, pointAt } from './garden'

const d = 'M20 0 C60 120 -10 220 30 360'
const a = pointAt(parsePath(d), 0.5) // exact point + tangent on the path
</script>

<template>
  <Vine :path="d" view-box="-40 0 300 360">
    <Leaf :x="a.x" :y="a.y" :rotate="a.angle - 55" :size="0.6" />
    <Plant species="bell" :seed="4" :anchor="a" :reach="70" :delay="1200" />
  </Vine>
</template>
```

## Model

One generator, one animation pipeline.

- `generateFlower(species | FlowerSpec, seed, { closed? })` returns pure, seeded geometry for one flower: 1 to 3 petal layers (outer layers larger, offset half a step), per-petal length, width, tip sharpness, skew and random variation, calyx sepals, stamens (filament, anther, pollen specks) and a palette. The base (receptacle) is the origin and the axis points to -y.
- Species are presets over the same spec: `FLOWER_SPECIES` has `bloom`, `cornflower`, `bell` (a fan of petals that hangs), `forgetmenot`, `daisy`. Pass your own `FlowerSpec` for others.
- `growPlant(spec)` is pure and seeded. It grows a curved stem from an `anchor` (a point and tangent on any path), puts leaves with their bases exactly on the stem, and places the flower so its base equals the stem end point and its axis follows the end tangent (`at.rotate === tip.angle + 90 + tilt`; `tilt` is declared on the node). `branches` adds side stems with smaller flowers (a spray); `bud` keeps a flower closed.
- Anchoring helpers: `parsePath(d)` (absolute `M C S Q L`), `pointAt(model, f)` (exact point and tangent at arc fraction `f`), `pathModel(segs)`, `distanceToPath`. To attach a flower to any SVG path: `<Plant :anchor="pointAt(parsePath(d), 0.7)" species="daisy" />` inside the same coordinate system.

## One growth timeline

A single progress value 0..1 per plant drives everything (`phase(progress)` in `timeline.ts`, tested monotonic): stem draws (0 to .18), leaves unfurl (.10 to .28), calyx forms (.20 to .30), the closed bud swells (.26 to .42), petals open outer layer first, each from base to tip edge with an outline trace then fill and veins (.42 to .68), only then stamen filaments grow (.68 to .84), then anthers and pollen appear and settle (.82 to .95), then a gentle idle sway. No stamen, anther or pollen is visible before its phase.

`useGrowthTimeline(start: Ref<boolean>, { duration = 3200, delay = 0, isStatic })` tweens progress 0 to 1 once `start` is true. Reduced motion, a missing `requestAnimationFrame` or `isStatic` give 1 at once, the final state including pollen. To drive it by hand pass `progress` (0..1) to `Plant`, `Flower` or a species component.

## Components

Vine: `path`, `duration` (ms, default 2400), `delay`, `size`, `viewBox`, `grown`, `isStatic`. Draws the stem and drives its children (they inherit `grown`).

Plant / Spray (a `<g>` in absolute coordinates, place inside any `<svg>`): `species`, `seed`, `anchor`, `side` (1 or -1), `reach` (stem px), `size`, `leaves`, `branches`, `bud`, `spread` (degrees between the path tangent and the stem start, default 120), `branchSpecies`, `grown`, `delay`, `duration`, `isStatic`, `progress`. `Spray` defaults to 3 branches.

Flower, Bloom, Cornflower, Bell, ForgetMeNot, Daisy (thin wrappers over `Flower`): one flower with its base at `x`, `y` (use `Plant` to grow one out of a vine). Props: `x`, `y`, `rotate`, `size`, `seed`, `bud`, `delay`, `grown`, `isStatic`, `progress`, `duration`.

Leaf / Bud: `x`, `y`, `rotate`, `size`, `delay`, `grown`, `isStatic`. Their base is the origin, so put them on an anchor.

`isStatic` renders everything fully grown with no animation. `prefers-reduced-motion: reduce` and a missing `IntersectionObserver` also render fully grown.

## useGrow(el, { once = true, threshold = 0.2 })

Returns a ref that becomes `true` when `el` enters the viewport (immediately `true` for reduced motion or no `IntersectionObserver`).

## Types

`index.ts` exports `Anchor`, `ArtProps`, `FlowerGeometry`, `FlowerSpec`, `GrowthPhase`, `PathModel`, `PlantGeometry`, `PlantProps`, `PlantSpec`, `Species`, `SpeciesProps`, `TimelineOptions`, `VineProps` and more.

## Dev demo

`garden-demo.html` at the repo root (served by `npm run dev` only, never in the production build) renders one plant per species with a progress slider, `?p=0.5` and `?zoom=3`.
