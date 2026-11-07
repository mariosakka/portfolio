<script setup lang="ts">
import { computed } from 'vue'
import { useMedia } from '../lib/useMotion'

// Seam for the garden <Sprouts> overlay (vines and flowers growing out of and around the parent card,
// up to `reach` px past its box). Today it renders only its slot; after the garden branch merges it wraps
// <Sprouts :reach="reach" ...>. The parent must be position: relative and keep `reach` px of unclipped room.
const props = withDefaults(defineProps<{
  seed: string | number
  variant?: string
  density?: number
  active?: boolean
  // Override; by default 56px from 640px wide, 32px on phones (the sprouts contract).
  reach?: number
}>(), { variant: 'default', density: 1, active: true, reach: undefined })
defineSlots<{ default?(p: { reach: number }): unknown }>()

const wide = useMedia('(min-width: 640px)')
const reach = computed(() => props.reach ?? (wide.value ? 56 : 32))
</script>

<template>
  <slot :reach="reach" />
</template>
