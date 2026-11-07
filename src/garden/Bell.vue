<script setup lang="ts">
import Flower from './Flower.vue'
import { artDefaults } from './useGrow'
import type { SpeciesProps } from './types'

const props = withDefaults(defineProps<SpeciesProps>(), { ...artDefaults, seed: 1, bud: false, duration: 3200, progress: undefined })
</script>

<template>
  <Flower
    v-bind="props"
    species="bell"
  />
</template>
