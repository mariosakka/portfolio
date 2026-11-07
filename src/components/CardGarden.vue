<script setup lang="ts">
import { computed } from 'vue'
import { Sprouts } from '../garden'
import type { SproutDensity, SproutVariant } from '../garden'
import { useMedia } from '../lib/useMotion'

// Vines and flowers growing out of and around the parent card (the garden <Sprouts> overlay), up to `reach` px
// past its box. The parent must be position: relative and keep `reach` px of unclipped room; the art is
// absolute, aria-hidden and ignores pointer events, so it never changes layout. `seed` keeps one card's
// arrangement stable. `trigger="active"` grows when `active` becomes true (coverflow slide, top deck card).
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
    :trigger="trigger"
    :active="active"
    :reach="props.reach"
    :is-static="isStatic"
  />
  <slot :reach="reach" />
</template>
