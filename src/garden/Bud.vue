<script setup lang="ts">
import Flower from './Flower.vue'
import { artDefaults } from './useGrow'
import type { SpeciesProps } from './types'

// A closed bud: the same generated flower, kept closed by the shared timeline.
const props = withDefaults(defineProps<SpeciesProps>(), { ...artDefaults, seed: 1, bud: true, duration: 3200, progress: undefined })
</script>

<template>
  <Flower
    v-bind="props"
    species="bloom"
    bud
    class="g-bud"
  />
</template>
