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

Plant / Spray (a `<g>` in absolute coordinates, place inside any `<svg>`): `species`, `seed`, `anchor`, `side` (1 or -1), `reach` (stem px), `size`, `leaves`, `branches`, `bud`, `spread` (degrees between the path tangent and the stem start, default 120), `branchSpecies`, `palette`, `grown`, `delay`, `duration`, `isStatic`, `progress`. `Spray` defaults to 3 branches.

Flower, Bloom, Cornflower, Bell, ForgetMeNot, Daisy (thin wrappers over `Flower`): one flower with its base at `x`, `y` (use `Plant` to grow one out of a vine). Props: `x`, `y`, `rotate`, `size`, `seed`, `bud`, `delay`, `grown`, `isStatic`, `progress`, `duration`.

Leaf / Bud: `x`, `y`, `rotate`, `size`, `delay`, `grown`, `isStatic`. Their base is the origin, so put them on an anchor.

## Sprouts

A decorative overlay that grows vines and flowers out of and around its parent (a card, a photo, a heading wrapper). It renders one absolutely positioned `<svg aria-hidden="true" focusable="false">` with `pointer-events: none`, sized to the parent's padding box plus `reach` px on every side, measured with a ResizeObserver. It takes no space in the layout.

```vue
<div class="relative">
  <!-- card content -->
  <Sprouts :seed="item.id" />
</div>
```

Props (`SproutsProps`): `seed` (string or number), `variant` (`auto` default, `corners`, `edge`, `wrap`, `hang`, `climb`, `burst`), `density` (`1` about 3-4 flowers, `2` default about 6-9, `3` about 10-14, each plus buds and leaves), `trigger` (`visible` default, `active`, `manual`), `active`, `progress` (0..1, with `manual`), `reach` (px, default 40), `isStatic`, `sway` (opt-in idle sway).

- Variants: `corners` (vines leave one or two corners and curl outward, flowers at the tips), `edge` (a vine creeping along one outer edge with side branches), `wrap` (a vine hugging a corner just outside the border), `hang` (a garland over the top edge with vines hanging down the sides, mostly bells and forget-me-nots), `climb` (a vine climbing one side from the bottom edge), `burst` (short sprouts radiating from several border points). `auto` picks one per seed; consecutive numeric seeds always get different variants, so pass the card index or id.
- Containment: the art lives in the ring of `reach` px around the parent and overlaps the parent box by at most `SPROUT_OVERLAP` (8px), only along its border. Vines are traced in a perimeter frame (arc position plus outward offset) and every plant is checked point by point; a plant that would reach further in is shrunk, turned or dropped. Flower glows (a faint gradient 1.35x the petal radius) are not counted.
- Triggers: `visible` grows once when 25% of the parent is visible (one IntersectionObserver, disconnected after), `active` grows once `active` becomes true (carousel slides; it stays grown after), `manual` lets `progress` drive the whole overlay. `isStatic` and `prefers-reduced-motion` render the final grown state at once.
- Growth: every vine has its own seeded delay (0 to 1.4s after a 0.1 to 0.5s pause), duration and ease, so sprouts appear out of sync; each plant starts when its vine reaches its anchor plus a random lag and runs the usual single timeline (stem, leaves, calyx, bud, petals, then stamens and pollen).
- Cost: all overlays share one `requestAnimationFrame` loop (`registry.ts`); at most `MAX_GROWING_PLANTS` (40) plants grow at once and later overlays queue. A finished overlay does no per-frame work. With `sway`, at most `MAX_SWAYING` (6) plants sway page-wide, given to the overlays nearest the viewport centre (one passive scroll listener while any are registered). No CSS filters.
- Clipping requirement: the parent must be positioned (`position: relative`), and no ancestor between it and the space the art grows into may clip (`overflow: hidden/auto/scroll`), or the art is cut: leave at least `reach` px of non-clipping margin around the parent. The overlay overflows its parent by `reach` px, so near the viewport edge an ancestor needs `overflow-x: clip` to avoid horizontal scroll. The parent's content must stay inside its box (text overflowing the box can be covered).
- Helpers: `layoutSprouts(options)` is the pure, seeded layout (vines, plants, leaves, timings) for any box; also `pickVariant(seed)`, `vineDrawn`, `itemProgress`, `SPROUT_VARIANTS`, `SPROUT_FLOWERS`, `SPROUT_OVERLAP`; `enqueueGrowth`, `growthStats` and `registerSway` expose the shared registry.

Extra muted hues in the blue, violet and pale family live in `EXTRA_PALETTES`; pass one as `palette` to `Plant` (or a `PlantSpec`) to recolour any species.

`isStatic` renders everything fully grown with no animation. `prefers-reduced-motion: reduce` and a missing `IntersectionObserver` also render fully grown.

## useGrow(el, { once = true, threshold = 0.2 })

Returns a ref that becomes `true` when `el` enters the viewport (immediately `true` for reduced motion or no `IntersectionObserver`).

## Types

`index.ts` exports `SproutsProps`, `SproutVariant`, `SproutDensity`, `SproutTrigger`, `SproutLayout`, `SproutLayoutOptions`, `Anchor`, `ArtProps`, `FlowerGeometry`, `FlowerSpec`, `GrowthPhase`, `PathModel`, `PlantGeometry`, `PlantProps`, `PlantSpec`, `Species`, `SpeciesProps`, `TimelineOptions`, `VineProps` and more.

## Dev demo

`garden-demo.html` at the repo root (served by `npm run dev` only, never in the production build) shows a gallery of mock cards with `Sprouts` (every variant at density 1, 2 and 3 on small, wide and tall cards, plus an `auto` row) and a progress slider; `?p=0.5` sets the progress, `?live=1` uses the real `visible` trigger, `?view=species` shows one plant per species (`?zoom=3`).
