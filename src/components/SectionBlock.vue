<script setup lang="ts">
import { Vine, Leaf, Plant, parsePath, pointAt, reachDelay } from '../garden'

defineProps<{ id: string; title: string }>()

// Long heading vine trailing to the right, curling up at the tip into a small flower. Everything on it is
// anchored with pointAt and starts when the (linearly drawn) vine tip reaches its anchor: delay = fraction * duration.
const DURATION = 2200
const path = 'M2 42 C60 24 110 58 180 40 S300 22 360 42 S450 56 486 38 C506 28 506 14 494 12'
const model = parsePath(path)
const f1 = 0.35
const f2 = 0.62
const f3 = 0.96
const a1 = pointAt(model, f1)
const a2 = pointAt(model, f2)
const a3 = pointAt(model, f3)
</script>

<template>
  <section
    :id="id"
    class="mx-auto flex min-h-[var(--section-h)] max-w-5xl scroll-mt-[var(--nav-h)] flex-col justify-center px-4 py-5 sm:px-10 sm:py-10 sm:short:py-6"
  >
    <h2 class="mb-2 font-serif text-3xl text-ink outline-none sm:text-4xl xshort:text-[1.65rem]">
      {{ title }}
    </h2>
    <Vine
      :path="path"
      view-box="0 0 520 64"
      :duration="DURATION"
      class="-mt-1 mb-4 !w-[32rem] short:mb-3 short:!w-[24rem]"
    >
      <Leaf
        :x="a1.x"
        :y="a1.y"
        :rotate="a1.angle + 55"
        :size="0.55"
        :delay="reachDelay(f1, DURATION)"
      />
      <Plant
        species="bloom"
        :seed="7"
        :anchor="a2"
        :side="-1"
        :reach="22"
        :size="0.8"
        :leaves="1"
        bud
        :delay="reachDelay(f2, DURATION)"
      />
      <Plant
        species="cornflower"
        :seed="2"
        :anchor="a3"
        :side="-1"
        :reach="14"
        :size="0.6"
        :leaves="0"
        :delay="reachDelay(f3, DURATION)"
      />
    </Vine>
    <slot />
  </section>
</template>
