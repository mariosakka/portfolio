<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, shallowRef, useId, watch } from 'vue'
import Plant from './Plant.vue'
import { LEAF } from './flowers'
import { enqueueGrowth, registerSway } from './registry'
import { itemProgress, layoutSprouts, vineDrawn } from './sproutLayout'
import { clamp01, easeOut } from './timeline'
import { GROWN_KEY } from './useGrow'
import type { SproutsProps } from './types'

// Decorative overlay: vines and flowers growing out of and around the positioned parent element.
// One shared frame loop (registry.ts) drives every overlay; finished overlays do no per-frame work.
const props = withDefaults(defineProps<SproutsProps>(), {
  seed: 1, variant: 'auto', density: 2, trigger: 'visible', active: false, progress: 0, reach: 40, isStatic: false, sway: false,
})
const root = ref<SVGSVGElement | null>(null)
const id = useId()
const size = shallowRef({ w: 0, h: 0 })
const reduce = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
const noRaf = typeof requestAnimationFrame === 'undefined'
const still = computed(() => props.isStatic || reduce)
const layout = computed(() => layoutSprouts({ seed: props.seed, variant: props.variant, density: props.density, width: size.value.w, height: size.value.h, reach: props.reach }))
// ms since the trigger; Infinity once finished, so a later resize renders fully grown at once.
const clock = ref(0)
const t = computed(() => (still.value ? Infinity : props.trigger === 'manual' ? clamp01(props.progress) * layout.value.total : clock.value))
const vines = computed(() => layout.value.vines.map((v) => ({ v, p: vineDrawn(v, t.value) })))
const leaves = computed(() => layout.value.leaves.map((l) => ({ l, s: easeOut(itemProgress(l, t.value)) })))
const plants = computed(() => layout.value.plants.map((p) => ({ p, lp: itemProgress(p, t.value) })))
const done = computed(() => t.value >= layout.value.total)
const swayN = ref(0)
// Plants never start their own timelines or observers: this overlay owns the clock.
provide(GROWN_KEY, { grown: ref(false), isStatic: still })

let cancel: (() => void) | undefined
let started = false
function start(): void {
  if (started || still.value || props.trigger === 'manual') return
  started = true
  if (noRaf) { clock.value = Infinity; return }
  let t0 = 0
  cancel = enqueueGrowth({
    plants: Math.max(1, layout.value.plants.length),
    begin: (now) => { t0 = now },
    tick: (now) => {
      clock.value = now - t0
      if (clock.value < layout.value.total) return false
      clock.value = Infinity
      return true
    },
  })
}

let io: IntersectionObserver | undefined
let ro: ResizeObserver | undefined
let unsway: (() => void) | undefined
onMounted(() => {
  const parent = root.value?.parentElement
  if (!parent) return
  const measure = (): void => {
    const w = parent.clientWidth
    const h = parent.clientHeight
    if (w !== size.value.w || h !== size.value.h) size.value = { w, h }
  }
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(measure)
    ro.observe(parent)
  }
  if (props.trigger !== 'visible' || still.value) return
  if (typeof IntersectionObserver === 'undefined') { start(); return }
  io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return
    io?.disconnect()
    start()
  }, { threshold: 0.25 })
  io.observe(parent)
})
watch(() => props.trigger === 'active' && props.active, (on) => { if (on) start() }, { immediate: true })
watch(() => props.sway && done.value && !still.value && layout.value.plants.length > 0, (on) => {
  unsway?.()
  unsway = undefined
  if (on && root.value) unsway = registerSway({ el: root.value, plants: layout.value.plants.length, set: (n) => { swayN.value = n } })
}, { flush: 'post' })
onBeforeUnmount(() => {
  io?.disconnect()
  ro?.disconnect()
  cancel?.()
  unsway?.()
})
</script>

<template>
  <svg
    ref="root"
    class="g-sprouts"
    :class="{ 'g-is-static': still, 'g-is-grown': done }"
    :width="layout.width + 2 * reach"
    :height="layout.height + 2 * reach"
    :viewBox="`${-reach} ${-reach} ${layout.width + 2 * reach} ${layout.height + 2 * reach}`"
    :style="{ left: `${-reach}px`, top: `${-reach}px` }"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient
        :id="`${id}-l`"
        x1="0"
        y1="0"
        x2="1"
        y2="1"
      >
        <stop
          offset="0"
          stop-color="#26788d"
        />
        <stop
          offset="1"
          stop-color="#0e3e56"
        />
      </linearGradient>
    </defs>
    <path
      v-for="vn in vines"
      :key="vn.v.id"
      class="g-sprout-vine"
      :d="vn.v.path.d"
      fill="none"
      stroke="#26788d"
      :stroke-width="vn.v.width"
      stroke-linecap="round"
      pathLength="1"
      stroke-dasharray="1 2"
      :stroke-dashoffset="1 - vn.p"
      :style="{ opacity: vn.p > 0.001 ? 1 : 0 }"
    />
    <g
      v-for="lf in leaves"
      :key="lf.l.id"
      class="g-sprout-leaf"
      :transform="`translate(${lf.l.x} ${lf.l.y}) rotate(${lf.l.rotate})`"
    >
      <g :style="{ transform: `scale(${lf.l.size * lf.s})`, opacity: lf.s > 0 ? 1 : 0 }">
        <path
          :d="LEAF.d"
          :fill="`url(#${id}-l)`"
          stroke="#4fa6ba"
          stroke-opacity=".5"
          stroke-width="1.2"
        />
        <path
          :d="LEAF.midrib"
          fill="none"
          stroke="#79bccb"
          stroke-opacity=".7"
          stroke-width="1.4"
        />
      </g>
    </g>
    <Plant
      v-for="(pl, i) in plants"
      :key="pl.p.id"
      v-bind="pl.p.spec"
      :progress="pl.lp"
      :sway="i < swayN"
    />
  </svg>
</template>
