<script setup lang="ts">
import Plant from './Plant.vue'
import type { PlantProps } from './types'

// A plant with several blooms and a bud on side branches.
const props = withDefaults(defineProps<PlantProps>(), {
  seed: 1, side: 1, reach: 60, size: 1, leaves: 2, branches: 3, bud: false, spread: 120, branchSpecies: undefined,
  grown: undefined, delay: 0, duration: 3200, isStatic: false, progress: undefined,
})
</script>

<template>
  <Plant
    v-bind="props"
    class="spray"
  />
</template>
