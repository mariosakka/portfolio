<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, shallowRef, useId, watch } from 'vue'
import Plant from './Plant.vue'
import { LEAF } from './flowers'
import { growPlant } from './grow'
import { enqueueGrowth, registerSway, viewportDistance } from './registry'
import { SPROUT_GLOW, itemProgress, layoutSprouts, vineDrawn } from './sproutLayout'
import { clamp01, easeOut } from './timeline'
import { DEFS_KEY, GROWN_KEY } from './useGrow'
import type { Palette, SproutDensity, SproutsProps } from './types'

// Decorative overlay: vines and flowers growing out of and around the positioned parent element.
// Nothing is rendered until it starts growing (or is manual/static), so cards never seen cost no nodes.
// One shared frame loop (registry.ts) drives every overlay; finished overlays do no per-frame work.
const props = withDefaults(defineProps<SproutsProps>(), {
  seed: 1, variant: 'auto', density: 2, trigger: 'visible', active: false, progress: 0, reach: undefined, isStatic: false, sway: false,
})
const root = ref<SVGSVGElement | null>(null)
const id = useId()
const size = shallowRef({ w: 0, h: 0, vw: typeof window === 'undefined' ? 1024 : window.innerWidth })
const reduce = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
const noRaf = typeof requestAnimationFrame === 'undefined'
const still = computed(() => props.isStatic || reduce)
// Phones get a narrower ring and fewer flowers: density 2 at most below 640px, 1 below 380px.
const reachPx = computed(() => props.reach ?? (size.value.vw >= 640 ? 56 : 32))
const density = computed<SproutDensity>(() => Math.min(props.density, size.value.vw < 380 ? 1 : size.value.vw < 640 ? 2 : 3) as SproutDensity)
const layout = computed(() => layoutSprouts({ seed: props.seed, variant: props.variant, density: density.value, width: size.value.w, height: size.value.h, reach: reachPx.value }))
// ms since the trigger; Infinity once finished, so a later resize renders fully grown at once.
const clock = ref(0)
const begun = ref(false)
const shown = computed(() => still.value || props.trigger === 'manual' || begun.value)
const t = computed(() => (still.value ? Infinity : props.trigger === 'manual' ? clamp01(props.progress) * layout.value.total : clock.value))
const vines = computed(() => layout.value.vines.map((v) => ({ v, p: vineDrawn(v, t.value) })))
const leaves = computed(() => layout.value.leaves.map((l) => ({ l, s: easeOut(itemProgress(l, t.value)) })))
const plants = computed(() => layout.value.plants.map((p) => ({ p, lp: itemProgress(p, t.value) })))
const done = computed(() => t.value >= layout.value.total)
const swayN = ref(0)
// A re-layout after a real resize fades the new art in instead of jumping (keyed by size).
const relayouts = ref(0)
const artKey = computed(() => `${layout.value.width}x${layout.value.height}`)

// One gradient set per palette for the whole overlay instead of one per plant and flower.
const palettes = computed(() => {
  const list: Palette[] = []
  for (const p of layout.value.plants) for (const n of growPlant(p.spec).nodes) if (!list.includes(n.flower.palette)) list.push(n.flower.palette)
  return list
})
provide(DEFS_KEY, {
  flower: (pal) => { const i = palettes.value.indexOf(pal); return i < 0 ? null : `${id}-f${i}` },
  leaf: `${id}-l`,
  glow: SPROUT_GLOW,
})
// Plants never start their own timelines or observers: this overlay owns the clock.
provide(GROWN_KEY, { grown: ref(false), isStatic: still })

let cancel: (() => void) | undefined
let wanted = false
let started = false
function start(): void {
  wanted = true
  // A parent with no size yet waits; growth starts once it has one, so the art never pops in grown.
  if (started || still.value || props.trigger === 'manual' || !layout.value.width || !layout.value.height) return
  started = true
  if (noRaf) { clock.value = Infinity; begun.value = true; return }
  let t0 = 0
  cancel = enqueueGrowth({
    plants: Math.max(1, layout.value.plants.length),
    priority: () => (root.value?.parentElement ? viewportDistance(root.value.parentElement) : Infinity),
    begin: (now) => { t0 = now; begun.value = true },
    tick: (now) => {
      clock.value = now - t0
      const L = layout.value
      const pending = L.plants.filter((p) => clock.value < p.delay + p.duration).length
      if (clock.value < L.total) return { pending, done: false }
      clock.value = Infinity
      return { pending: 0, done: true }
    },
  })
}
watch(() => layout.value.width * layout.value.height, (a) => { if (a && wanted) start() })

let io: IntersectionObserver | undefined
let ro: ResizeObserver | undefined
let unsway: (() => void) | undefined
let debounce: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  const parent = root.value?.parentElement
  if (!parent) return
  const measure = (): void => {
    const w = parent.clientWidth
    const h = parent.clientHeight
    const vw = window.innerWidth
    const cur = size.value
    // Ignore jitter of a few px: the same seed keeps exactly the same art.
    const first = !cur.w || !cur.h
    if (!first && Math.abs(w - cur.w) <= 4 && Math.abs(h - cur.h) <= 4 && (vw >= 640) === (cur.vw >= 640) && (vw >= 380) === (cur.vw >= 380)) return
    if (!first && shown.value) relayouts.value++
    size.value = { w, h, vw }
  }
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      clearTimeout(debounce)
      // The first size arrives at once; later changes are debounced.
      if (!size.value.w || !size.value.h) measure()
      else debounce = setTimeout(measure, 150)
    })
    ro.observe(parent)
  }
  if (props.trigger !== 'visible' || still.value) return
  if (typeof IntersectionObserver === 'undefined') { start(); return }
  io = new IntersectionObserver((entries) => {
    // 25% of the parent, or (for a parent much taller than the screen) a quarter of the viewport covered.
    const seen = entries.some((e) => {
      if (!e.isIntersecting) return false
      if (e.intersectionRatio >= 0.25) return true
      const vp = e.rootBounds ? e.rootBounds.width * e.rootBounds.height : window.innerWidth * window.innerHeight
      return vp > 0 && e.intersectionRect.width * e.intersectionRect.height >= 0.25 * vp
    })
    if (!seen) return
    io?.disconnect()
    start()
  }, { threshold: [0, 0.05, 0.1, 0.15, 0.25] })
  io.observe(parent)
})
watch(() => props.trigger === 'active' && props.active, (on) => { if (on) start() }, { immediate: true })
watch(() => props.sway && done.value && shown.value && !still.value && layout.value.plants.length > 0, (on) => {
  unsway?.()
  unsway = undefined
  if (on && root.value) unsway = registerSway({ el: root.value, plants: layout.value.plants.length, set: (n) => { swayN.value = n } })
}, { flush: 'post' })
onBeforeUnmount(() => {
  clearTimeout(debounce)
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
    :class="{ 'g-is-static': still, 'g-is-grown': done && shown }"
    :width="layout.width + 2 * layout.reach"
    :height="layout.height + 2 * layout.reach"
    :viewBox="`${-layout.reach} ${-layout.reach} ${layout.width + 2 * layout.reach} ${layout.height + 2 * layout.reach}`"
    :style="{ left: `${-layout.reach}px`, top: `${-layout.reach}px` }"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="shown && layout.vines.length">
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
        <template
          v-for="(pal, i) in palettes"
          :key="i"
        >
          <radialGradient
            v-for="(kind, j) in (['o', 'i'] as const)"
            :id="`${id}-f${i}-${kind}`"
            :key="kind"
            cx="50%"
            cy="100%"
            r="100%"
          >
            <stop
              offset="0"
              :stop-color="(j ? pal.inner : pal.outer)[0]"
            />
            <stop
              offset=".55"
              :stop-color="(j ? pal.inner : pal.outer)[1]"
            />
            <stop
              offset="1"
              :stop-color="(j ? pal.inner : pal.outer)[2]"
            />
          </radialGradient>
          <radialGradient :id="`${id}-f${i}-g`">
            <stop
              offset="0"
              :stop-color="pal.glow"
              stop-opacity=".32"
            />
            <stop
              offset="1"
              :stop-color="pal.glow"
              stop-opacity="0"
            />
          </radialGradient>
        </template>
      </defs>
      <g
        :key="artKey"
        class="g-sprouts-art"
        :class="{ 'g-is-relayout': relayouts > 0 }"
      >
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
      </g>
    </template>
  </svg>
</template>
