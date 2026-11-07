<script setup lang="ts">
import { computed, inject, ref, useId } from 'vue'
import FlowerArt from './FlowerArt.vue'
import { LEAF } from './flowers'
import { growPlant } from './grow'
import { clamp01, easeOut, phase, ramp, useGrowthTimeline } from './timeline'
import { DEFS_KEY, useGrown } from './useGrow'
import type { PlantProps } from './types'

// A flower growing out of a vine: stem from the anchor, leaves on the stem, bud, petals, stamens, pollen.
const props = withDefaults(defineProps<PlantProps>(), {
  seed: 1, side: 1, reach: 60, size: 1, leaves: 2, branches: 0, bud: false, spread: 120, branchSpecies: undefined, palette: undefined,
  grown: undefined, delay: 0, duration: 3200, isStatic: false, progress: undefined, sway: false,
})
const el = ref<SVGGElement | null>(null)
const id = useId()
const shared = inject(DEFS_KEY, null)
const leafFill = computed(() => `url(#${shared?.leaf ?? `${id}-l`})`)
const { grown, isStatic } = useGrown(props, el)
const geo = computed(() => growPlant({
  species: props.species, seed: props.seed, anchor: props.anchor, side: props.side, reach: props.reach, size: props.size,
  leaves: props.leaves, branches: props.branches, bud: props.bud, spread: props.spread, branchSpecies: props.branchSpecies,
  ...(props.palette ? { palette: props.palette } : {}),
}))
const timeline = useGrowthTimeline(grown, { duration: props.duration, delay: props.delay, isStatic })
const p = computed(() => (isStatic.value ? 1 : props.progress ?? timeline.value))
const nodes = computed(() => geo.value.nodes.map((n) => {
  const lp = n.start >= 1 ? 0 : clamp01((p.value - n.start) / (1 - n.start))
  const ph = phase(lp)
  return {
    n, lp, ph,
    leaves: n.leaves.map((l, i) => ({ l, s: easeOut(ramp(ph.leaf, i * 0.2, i * 0.2 + 0.7)) })),
  }
}))
</script>

<template>
  <g
    ref="el"
    class="g-art g-plant"
    :class="{ 'g-is-grown': grown, 'g-is-static': isStatic }"
  >
    <defs v-if="!shared">
      <linearGradient
        :id="`${id}-l`"
        x1="0"
        y1="0"
        x2="1"
        y2="1"
      >
        <stop
          offset="0"
          stop-color="#26788d"
        />
        <stop
          offset="1"
          stop-color="#0e3e56"
        />
      </linearGradient>
    </defs>
    <g
      v-for="(nd, i) in nodes"
      :key="i"
      class="g-plant-node"
    >
      <path
        class="g-plant-stem"
        :d="nd.n.stem.d"
        fill="none"
        stroke="#26788d"
        stroke-width="2.2"
        stroke-linecap="round"
        pathLength="1"
        stroke-dasharray="1 2"
        :stroke-dashoffset="1 - nd.ph.stem"
        :style="{ opacity: nd.ph.stem > 0.001 ? 1 : 0 }"
      />
      <g
        v-for="(lf, j) in nd.leaves"
        :key="'l' + j"
        class="g-plant-leaf"
        :transform="`translate(${lf.l.x} ${lf.l.y}) rotate(${lf.l.rotate})`"
      >
        <g :style="{ transform: `scale(${lf.l.size * lf.s})`, opacity: lf.s > 0 ? 1 : 0 }">
          <path
            :d="LEAF.d"
            :fill="leafFill"
            stroke="#4fa6ba"
            stroke-opacity=".5"
            stroke-width=".8"
          />
          <path
            :d="LEAF.midrib"
            fill="none"
            stroke="#79bccb"
            stroke-opacity=".7"
          />
        </g>
      </g>
      <g :transform="`translate(${nd.n.at.x} ${nd.n.at.y}) rotate(${nd.n.at.rotate}) scale(${nd.n.at.scale})`">
        <FlowerArt
          :geometry="nd.n.flower"
          :progress="nd.lp"
          :idle="nd.lp >= 1 && sway && !isStatic"
        />
      </g>
    </g>
  </g>
</template>
