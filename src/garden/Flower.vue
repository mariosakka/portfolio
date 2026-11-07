<script setup lang="ts">
import { computed, ref } from 'vue'
import FlowerArt from './FlowerArt.vue'
import { generateFlower } from './flowers'
import { useGrowthTimeline } from './timeline'
import { artDefaults, useGrown } from './useGrow'
import type { FlowerProps } from './types'

// A single flower with its base at (x, y). Use Plant to grow one out of a vine instead.
const props = withDefaults(defineProps<FlowerProps>(), { ...artDefaults, species: 'bloom', seed: 1, bud: false, duration: 3200, progress: undefined })
const el = ref<SVGGElement | null>(null)
const { grown, isStatic } = useGrown(props, el)
const geometry = computed(() => generateFlower(props.species, props.seed, { closed: props.bud }))
const timeline = useGrowthTimeline(grown, { duration: props.duration, delay: props.delay, isStatic })
const p = computed(() => (isStatic.value ? 1 : props.progress ?? timeline.value))
</script>

<template>
  <g
    ref="el"
    class="g-art g-flower"
    :class="[`g-${species}`, { 'g-is-grown': grown, 'g-is-static': isStatic }]"
    :transform="`translate(${x} ${y}) rotate(${rotate}) scale(${size})`"
  >
    <FlowerArt
      :geometry="geometry"
      :progress="p"
      :idle="p >= 1 && !isStatic"
    />
  </g>
</template>
