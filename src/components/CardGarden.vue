<script setup lang="ts">
import { computed } from 'vue'
import { Sprouts } from '@mariosakka/sprouts-vue'
import type { Density as SproutDensity, Variant as SproutVariant } from '@mariosakka/sprouts'
import { useMedia } from '../lib/useMotion'

// The published Sprouts adapter draws a deterministic SVG around each positioned card. This portfolio chooses
// its static mode to avoid running a live animation loop for every card; `seed` keeps each arrangement stable.
const props = withDefaults(defineProps<{
  seed: string | number
  variant?: SproutVariant | 'auto' | 'default'
  density?: SproutDensity
  trigger?: 'visible' | 'active'
  active?: boolean
  // Override; by default 56px from 640px wide, 32px on phones (the sprouts contract).
  reach?: number
  isStatic?: boolean
}>(), { variant: 'default', density: 2, trigger: 'visible', active: true, reach: undefined, isStatic: false })
defineSlots<{ default?(p: { reach: number }): unknown }>()

const wide = useMedia('(min-width: 640px)')
const reach = computed(() => props.reach ?? (wide.value ? 56 : 32))
</script>

<template>
  <Sprouts
    :seed="seed"
    :variant="variant === 'default' ? 'auto' : variant"
    :density="density"
    :reach="reach"
    static
    :style="{ '--sprout-reach': `${reach}px` }"
  />
  <slot :reach="reach" />
</template>

<style scoped>
:deep(.sprouts) {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

:deep(.sprouts > svg) {
  position: absolute;
  top: calc(-1 * var(--sprout-reach));
  left: calc(-1 * var(--sprout-reach));
  display: block;
  overflow: visible;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.sprouts > svg) { transition: none; }
}
</style>
