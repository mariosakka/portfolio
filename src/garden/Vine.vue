<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, computed, provide } from 'vue'
import { GROWN_KEY, useGrow } from './useGrow.js'

const props = defineProps({
  path: { type: String, required: true },
  duration: { type: Number, default: 2400 },
  grown: { type: Boolean, default: undefined },
  size: { type: Number, default: 1 },
  delay: { type: Number, default: 0 },
  viewBox: { type: String, default: '0 0 400 600' },
  isStatic: { type: Boolean, default: false },
})
const el = ref(null)
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
      stroke="#2a8fa8"
      stroke-width="4"
      stroke-linecap="round"
    />
    <path
      class="vine-stem vine-shine"
      :d="path"
      pathLength="1"
      fill="none"
      stroke="#8fe3f2"
      stroke-opacity=".35"
      stroke-width="1"
      stroke-linecap="round"
    />
    <slot />
  </svg>
</template>
