<script setup lang="ts">
// Seam for the garden <Sprouts> overlay (vines and flowers growing out of and around the parent card,
// up to `reach` px past its box). Today it renders only its slot; after the garden branch merges it wraps
// <Sprouts>. The parent must be position: relative and keep ~40px (phones ~12px) of unclipped room around it.
withDefaults(defineProps<{
  seed: string | number
  variant?: string
  density?: number
  active?: boolean
}>(), { variant: 'default', density: 1, active: true })
</script>

<template>
  <slot />
</template>
