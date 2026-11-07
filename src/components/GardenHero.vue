<script setup lang="ts">
import { PageVine, Vine, Plant, Leaf, parsePath, pointAt } from '../garden'

// Page-height garden layer. >=1400px: long vines in the side margins (above the sticky nav, which is z-10)
// plus a hero corner vine; below that, a hairline edge vine behind the content.
const corner = 'M170 -6 C132 56 176 112 124 172 S96 236 130 290'
const cornerModel = parsePath(corner)
const a1 = pointAt(cornerModel, 0.52)
const a2 = pointAt(cornerModel, 0.8)
const a3 = pointAt(cornerModel, 1)
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 overflow-x-clip"
  >
    <div class="absolute inset-y-0 left-0 z-20 hidden w-[180px] opacity-90 min-[1400px]:block">
      <PageVine
        :seed="11"
        :width="180"
      />
    </div>
    <div class="absolute bottom-0 right-0 top-[28rem] z-20 hidden w-[180px] opacity-90 min-[1400px]:block">
      <PageVine
        :seed="23"
        :width="180"
        side="right"
        :density="0.6"
        :coverage="0.92"
      />
    </div>
    <div class="absolute right-0 top-0 z-20 hidden w-44 opacity-90 min-[1400px]:block">
      <Vine
        :path="corner"
        view-box="0 0 180 300"
        :duration="3000"
      >
        <Leaf
          :x="a1.x"
          :y="a1.y"
          :rotate="a1.angle - 55"
          :size="0.6"
          :delay="1500"
        />
        <Plant
          species="bloom"
          :seed="5"
          :anchor="a1"
          :side="1"
          :reach="62"
          :size="1.15"
          :branches="3"
          :delay="1600"
        />
        <Plant
          species="bell"
          :seed="9"
          :anchor="a2"
          :side="-1"
          :reach="46"
          :size="0.95"
          :delay="2300"
        />
        <Plant
          species="forgetmenot"
          :seed="3"
          :anchor="a3"
          :side="1"
          :reach="30"
          :size="1"
          :leaves="1"
          :delay="2800"
        />
      </Vine>
    </div>
    <div class="absolute inset-y-0 left-0 -z-10 w-4 overflow-hidden opacity-50 sm:hidden">
      <PageVine
        :seed="5"
        :width="16"
        compact
      />
    </div>
    <div class="absolute inset-y-0 left-0 -z-10 hidden w-8 overflow-hidden opacity-50 sm:block min-[1400px]:hidden">
      <PageVine
        :seed="5"
        :width="32"
        compact
      />
    </div>
  </div>
</template>
