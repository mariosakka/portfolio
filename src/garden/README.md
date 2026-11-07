# garden

Animated SVG night-garden art for Vue 3. Depends only on `vue`; plain CSS in `garden.css` (imported by `index.ts`). All art is decorative (`aria-hidden`).

```vue
<script setup lang="ts">
import { Vine, Bloom, Leaf, Bud, Cornflower } from './garden'
</script>

<template>
  <Vine path="M0 540 C40 470 120 450 110 380" view-box="0 0 400 600">
    <Leaf :x="112" :y="378" :rotate="-25" :delay="600" />
    <Bloom :x="200" :y="330" :size="1.1" :delay="1200" />
    <Bud :x="168" :y="392" :rotate="40" :delay="1800" />
    <Cornflower :x="190" :y="470" :delay="1500" />
  </Vine>
</template>
```

## Props

Vine: `path` (SVG `d`, required), `duration` (ms, default 2400), `delay` (ms), `size` (width multiplier of container), `viewBox` (default `0 0 400 600`), `grown` (override), `isStatic`.

Bloom / Cornflower / Bud / Leaf (render a `<g>`, so place inside `Vine` or any `<svg>`): `x`, `y`, `rotate` (deg), `size` (scale), `delay` (ms, stagger children along the stem), `grown` (override; default inherits the parent Vine, else its own visibility), `isStatic`.

`isStatic` renders everything fully visible with no animation. `prefers-reduced-motion: reduce` and a missing `IntersectionObserver` also render fully grown.

## useGrow(el, { once = true, threshold = 0.2 })

Returns a ref that becomes `true` when `el` enters the viewport (immediately `true` for reduced motion or no `IntersectionObserver`).

## Types

`index.ts` exports the types `VineProps`, `ArtProps` (Bloom, Cornflower, Bud, Leaf), `GrowOptions` and `GardenContext`. `useGrow(el: Ref<Element | null>, options?: GrowOptions): Ref<boolean>`.
