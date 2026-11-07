<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import Leaf from './Leaf.vue'
import Plant from './Plant.vue'
import { makeVinePath, placeItems, scrollProgress } from './layout'
import { GROWN_KEY } from './useGrow'
import type { PageVineProps } from './types'

// Page-tall vine that draws itself as the page scrolls. One passive scroll listener, throttled with
// requestAnimationFrame; per frame it only writes stroke-dashoffset on one path. Plants and leaves start
// their own timelines when the drawn tip passes their anchor (they do not follow the scroll).
const props = withDefaults(defineProps<PageVineProps>(), { seed: 1, height: 0, width: 180, side: 'left', density: 1, coverage: 1, compact: false, isStatic: false })
const root = ref<SVGSVGElement | null>(null)
const measured = ref(0)
const reduce = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
const still = computed(() => props.isStatic || reduce)
const H = computed(() => Math.round((props.height || measured.value) * props.coverage))
const vine = computed(() => makeVinePath({ seed: props.seed, height: Math.max(0, H.value), width: props.width }))
const items = computed(() => (H.value > 0 ? placeItems(vine.value, { seed: props.seed, density: props.density, compact: props.compact }) : []))
const passed = ref(0)
const unitsFor = (f: number): number => items.value.filter((i) => i.f <= f).length
provide(GROWN_KEY, { grown: ref(false), isStatic: computed(() => still.value) })

let top = 0
let raf = 0
function measure(): void {
  const parent = root.value?.parentElement
  if (!parent) return
  const r = parent.getBoundingClientRect()
  top = r.top + window.scrollY
  measured.value = Math.round(props.height || r.height)
  schedule()
}
function schedule(): void {
  if (!raf && !still.value) raf = requestAnimationFrame(frame)
}
function frame(): void {
  raf = 0
  const page = props.height || measured.value
  const f = Math.min(1, scrollProgress(window.scrollY - top, page, window.innerHeight) / props.coverage)
  root.value?.style.setProperty('--off', String(1 - f))
  // Plants stay open once reached, even if the user scrolls back up.
  passed.value = Math.max(passed.value, unitsFor(f))
}
if (still.value) passed.value = Number.POSITIVE_INFINITY

let ro: ResizeObserver | undefined
onMounted(() => {
  measure()
  if (still.value) return
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', measure, { passive: true })
  if (typeof ResizeObserver !== 'undefined' && root.value?.parentElement) {
    ro = new ResizeObserver(measure)
    ro.observe(root.value.parentElement)
  }
  frame()
})
watch(items, () => schedule())
onBeforeUnmount(() => {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', measure)
  ro?.disconnect()
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <svg
    ref="root"
    class="page-vine"
    :class="[`is-${side}`, { 'is-compact': compact, 'is-static': still }]"
    :width="width"
    :height="Math.max(H, 0)"
    :viewBox="`0 0 ${width} ${Math.max(H, 1)}`"
    aria-hidden="true"
    focusable="false"
  >
    <path
      class="page-vine-stem"
      :d="vine.d || 'M0 0'"
      pathLength="1"
      fill="none"
      stroke="#26788d"
      :stroke-width="compact ? 2 : 4"
      stroke-linecap="round"
      stroke-dasharray="1 2"
    />
    <path
      class="page-vine-stem page-vine-shine"
      :d="vine.d || 'M0 0'"
      pathLength="1"
      fill="none"
      stroke="#79bccb"
      stroke-opacity=".35"
      stroke-width="1"
      stroke-dasharray="1 2"
    />
    <template
      v-for="(it, i) in items"
      :key="it.id"
    >
      <Leaf
        v-if="it.kind === 'leaf'"
        :x="it.anchor.x"
        :y="it.anchor.y"
        :rotate="it.rotate"
        :size="it.size"
        :grown="i < passed"
      />
      <Plant
        v-else-if="it.plant"
        v-bind="it.plant"
        :anchor="it.anchor"
        :grown="i < passed"
      />
    </template>
  </svg>
</template>
