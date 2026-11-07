<script setup lang="ts">
import { Vine, Leaf, Bud, Plant, parsePath, pointAt } from '../garden'

defineProps<{ id: string; title: string }>()

// Long heading vine trailing to the right, curling up at the tip into a small flower.
const path = 'M2 42 C60 24 110 58 180 40 S300 22 360 42 S450 56 486 38 C506 28 506 14 494 12'
const model = parsePath(path)
const mid = pointAt(model, 0.35)
const mid2 = pointAt(model, 0.62)
const tip = pointAt(model, 0.96)
</script>

<template>
  <section
    :id="id"
    class="mx-auto max-w-5xl scroll-mt-20 px-4 py-16 sm:px-8"
  >
    <h2 class="mb-2 font-serif text-3xl text-ink sm:text-4xl">
      {{ title }}
    </h2>
    <Vine
      :path="path"
      view-box="0 0 520 64"
      :duration="2200"
      class="-mt-1 mb-4 !w-[32rem]"
    >
      <Leaf
        :x="mid.x"
        :y="mid.y"
        :rotate="mid.angle + 55"
        :size="0.55"
        :delay="700"
      />
      <Leaf
        :x="mid2.x"
        :y="mid2.y"
        :rotate="mid2.angle - 55"
        :size="0.5"
        :delay="1200"
      />
      <Bud
        :x="mid2.x"
        :y="mid2.y"
        :rotate="-30"
        :size="0.45"
        :delay="1500"
      />
      <Plant
        species="cornflower"
        :seed="2"
        :anchor="tip"
        :side="-1"
        :reach="14"
        :size="0.6"
        :leaves="0"
        :delay="1900"
      />
    </Vine>
    <slot />
  </section>
</template>
