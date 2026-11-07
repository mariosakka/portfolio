<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import Leaf from './Leaf.vue'
import Plant from './Plant.vue'
import { makeVinePath, placeItems, scrollProgress } from './layout'
import { GROWN_KEY } from './useGrow'
import type { PageVineProps } from './types'

// Page-tall vine that draws itself as the page scrolls. One passive scroll listener, throttled with
// requestAnimationFrame; per frame it only writes one CSS variable (stroke-dashoffset of the stem).
// The drawn length never retracts: the vine, its leaves and plants always stay consistent. Each plant starts
// its own timeline when the drawn tip passes its anchor (it does not follow the scroll).
const props = withDefaults(defineProps<PageVineProps>(), { seed: 1, height: 0, width: 180, side: 'left', density: 1, coverage: 1, compact: false, isStatic: false })
const root = ref<SVGSVGElement | null>(null)
const measured = ref(0)
const reduce = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
const still = computed(() => props.isStatic || reduce)
const H = computed(() => Math.round((props.height || measured.value) * props.coverage))
const vine = computed(() => makeVinePath({ seed: props.seed, height: Math.max(0, H.value), width: props.width }))
const items = computed(() => (H.value > 0 ? placeItems(vine.value, { seed: props.seed, density: props.density, compact: props.compact }) : []))
const passed = ref(still.value ? Number.POSITIVE_INFINITY : 0)
// Vine-space y of the viewport centre, in 200px steps: decides which plants may sway.
const centerY = ref(0)
const swayIds = computed(() => {
  if (still.value) return new Set<string>()
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight
  const near = items.value
    .map((it, i) => ({ it, i, d: Math.abs(it.anchor.y - centerY.value) }))
    .filter((e) => e.it.kind === 'plant' && e.i < passed.value && e.d < vh * 0.9)
    .sort((a, b) => a.d - b.d)
    .slice(0, 6)
  return new Set(near.map((e) => e.it.id))
})
provide(GROWN_KEY, { grown: ref(false), isStatic: computed(() => still.value) })

let top = 0
let maxF = 0
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
  // Never retract: grown plants must always have their vine under them.
  maxF = Math.max(maxF, f)
  root.value?.style.setProperty('--off', String(1 - maxF))
  passed.value = items.value.filter((i) => i.f <= maxF).length
  centerY.value = Math.round((window.scrollY - top + window.innerHeight / 2) / 200) * 200
}
// A taller or shorter page re-spaces arc fractions: keep the drawn pixel length.
watch(H, (n, o) => { if (o > 0 && n > 0) maxF = Math.min(1, (maxF * o) / n) })

let ro: ResizeObserver | undefined
onMounted(() => {
  measure()
  if (still.value) return
  window.addEventListener('scroll', schedule, { passive: true })
  if (typeof ResizeObserver !== 'undefined' && root.value?.parentElement) {
    ro = new ResizeObserver(measure)
    ro.observe(root.value.parentElement)
  } else {
    window.addEventListener('resize', measure, { passive: true })
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
    class="g-page-vine"
    :class="[`g-is-${side}`, { 'g-is-compact': compact, 'g-is-static': still }]"
    :width="width"
    :height="Math.max(H, 0)"
    :viewBox="`0 0 ${width} ${Math.max(H, 1)}`"
    aria-hidden="true"
    focusable="false"
  >
    <path
      class="g-page-vine-stem"
      :d="vine.d || 'M0 0'"
      pathLength="1"
      fill="none"
      stroke="#26788d"
      :stroke-width="compact ? 2 : 4"
      stroke-linecap="round"
      stroke-dasharray="1 2"
    />
    <path
      class="g-page-vine-stem g-page-vine-shine"
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
        :sway="swayIds.has(it.id)"
      />
    </template>
  </svg>
</template>
