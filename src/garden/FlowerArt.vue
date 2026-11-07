<script setup lang="ts">
import { computed, useId } from 'vue'
import { easeOut, petalPhase, phase, ramp } from './timeline'
import type { FlowerGeometry } from './types'

// Draws one generated flower at the origin (base) from a single 0..1 progress value.
const props = defineProps<{ geometry: FlowerGeometry; progress: number; idle?: boolean }>()
const id = useId()
const ph = computed(() => phase(props.progress))
const open = computed(() => (props.geometry.closed ? 0 : ph.value.open))
const perLayer = computed(() => props.geometry.petals.length / props.geometry.layers)
const petals = computed(() => {
  const g = props.geometry
  const swell = g.closed ? 0.6 : 0.42
  const bud = easeOut(ph.value.bud)
  return g.petals.map((p) => {
    const grow = petalPhase(open.value, p.layer, g.layers, p.index, perLayer.value)
    return {
      p,
      style: { transform: `rotate(${p.angle * (0.12 + 0.88 * grow)}deg) scale(${swell * bud + (1 - swell) * grow})` },
      fill: bud,
      dash: 1 - ramp(grow, 0, 0.85),
      vein: ramp(grow, 0.7, 1),
    }
  })
})
const sepals = computed(() => props.geometry.sepals.map((s) => ({ s, style: { transform: `rotate(${s.angle * (0.35 + 0.65 * open.value)}deg) scale(${easeOut(ph.value.calyx)})` } })))
const sd = computed(() => `-${props.geometry.seed % 7}s`)
const hidden = (n: number) => ({ opacity: n > 0.001 ? 1 : 0 })
</script>

<template>
  <g
    class="flower-art"
    :class="{ 'is-swaying': idle }"
    :style="{ '--sd': sd }"
  >
    <defs>
      <radialGradient
        :id="`${id}-o`"
        cx="50%"
        cy="100%"
        r="100%"
      >
        <stop
          offset="0"
          :stop-color="geometry.palette.outer[0]"
        />
        <stop
          offset=".55"
          :stop-color="geometry.palette.outer[1]"
        />
        <stop
          offset="1"
          :stop-color="geometry.palette.outer[2]"
        />
      </radialGradient>
      <radialGradient
        :id="`${id}-i`"
        cx="50%"
        cy="100%"
        r="100%"
      >
        <stop
          offset="0"
          :stop-color="geometry.palette.inner[0]"
        />
        <stop
          offset=".55"
          :stop-color="geometry.palette.inner[1]"
        />
        <stop
          offset="1"
          :stop-color="geometry.palette.inner[2]"
        />
      </radialGradient>
      <radialGradient :id="`${id}-g`">
        <stop
          offset="0"
          :stop-color="geometry.palette.glow"
          stop-opacity=".32"
        />
        <stop
          offset="1"
          :stop-color="geometry.palette.glow"
          stop-opacity="0"
        />
      </radialGradient>
    </defs>
    <circle
      class="glow"
      :r="geometry.glowR"
      :fill="`url(#${id}-g)`"
      :style="{ opacity: ramp(open, 0.3, 1) }"
    />
    <g class="sway">
      <path
        v-for="(sp, i) in sepals"
        :key="'s' + i"
        class="sepal"
        :d="sp.s.d"
        :fill="geometry.palette.sepal"
        stroke="#4fa6ba"
        stroke-opacity=".5"
        stroke-width=".6"
        :style="sp.style"
      />
      <g
        v-for="pt in petals"
        :key="pt.p.layer + '-' + pt.p.index"
        class="petal"
        :style="pt.style"
      >
        <path
          :d="pt.p.d"
          :fill="`url(#${id}-${pt.p.layer ? 'i' : 'o'})`"
          :style="{ opacity: pt.fill }"
        />
        <path
          :d="pt.p.d"
          fill="none"
          :stroke="geometry.palette.edge"
          stroke-width=".9"
          stroke-linejoin="round"
          pathLength="1"
          stroke-dasharray="1 2"
          :stroke-dashoffset="pt.dash"
        />
        <path
          :d="pt.p.veins"
          fill="none"
          :stroke="geometry.palette.vein"
          stroke-opacity=".5"
          stroke-width=".8"
          stroke-linecap="round"
          :style="{ opacity: pt.vein }"
        />
      </g>
      <circle
        class="receptacle"
        :r="geometry.receptacleR"
        :fill="geometry.palette.sepal"
        :style="{ transform: `scale(${easeOut(ph.calyx)})` }"
      />
      <circle
        class="disk"
        :r="geometry.centerR"
        :fill="geometry.palette.center"
        :style="{ transform: `scale(${easeOut(ramp(open, 0.1, 0.6))})` }"
      />
      <g
        v-for="(st, i) in geometry.stamens"
        :key="'st' + i"
        class="stamen"
      >
        <path
          :d="st.filament"
          fill="none"
          :stroke="geometry.palette.filament"
          stroke-width="1.1"
          stroke-linecap="round"
          pathLength="1"
          stroke-dasharray="1 2"
          :stroke-dashoffset="1 - ph.stamen"
          :style="hidden(ph.stamen)"
        />
        <circle
          class="anther"
          :cx="st.ax"
          :cy="st.ay"
          :r="st.r"
          :fill="geometry.palette.anther"
          :style="{ opacity: ph.pollen, transform: `scale(${easeOut(ph.pollen)})` }"
        />
        <circle
          v-for="(k, j) in st.specks"
          :key="j"
          class="pollen"
          :cx="k.x"
          :cy="k.y"
          :r="k.r"
          :fill="geometry.palette.pollen"
          :style="{ opacity: ph.pollen, transform: `translateY(${(1 - ph.pollen) * -4}px)` }"
        />
      </g>
    </g>
  </g>
</template>
