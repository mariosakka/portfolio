<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { GROWN_KEY, useGrow } from './useGrow'
import type { VineProps } from './types'

const props = withDefaults(defineProps<VineProps>(), {
  duration: 2400,
  grown: undefined, // undefined (not false) so it can fall back to own visibility
  size: 1,
  delay: 0,
  viewBox: '0 0 400 600',
  isStatic: false,
})
const el = ref<SVGSVGElement | null>(null)
const own = useGrow(el)
const isGrown = computed(() => props.grown ?? own.value)
const isStatic = computed(() => props.isStatic)
// Children read this via inject so one observer drives the whole vine.
provide(GROWN_KEY, { grown: isGrown, isStatic })
</script>

<template>
  <svg
    ref="el"
    class="garden-art vine"
    :class="{ 'is-grown': isGrown, 'is-static': isStatic }"
    :viewBox="viewBox"
    :style="{ '--duration': duration + 'ms', '--delay': delay + 'ms', width: size * 100 + '%' }"
    aria-hidden="true"
    focusable="false"
    overflow="visible"
  >
    <path
      class="vine-stem"
      :d="path"
      pathLength="1"
      fill="none"
      stroke="#26788d"
      stroke-width="4"
      stroke-linecap="round"
    />
    <path
      class="vine-stem vine-shine"
      :d="path"
      pathLength="1"
      fill="none"
      stroke="#79bccb"
      stroke-opacity=".35"
      stroke-width="1"
      stroke-linecap="round"
    />
    <slot />
  </svg>
</template>
