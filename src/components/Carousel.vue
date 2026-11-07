<script setup lang="ts" generic="T">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { coverflowFrame, stepIndex } from '../lib/motion'
import { prefersReducedMotion } from '../lib/useMotion'

// Coverflow: native scroll-snap track (swipe, wheel, keyboard scroll all stay native), every slide snaps to
// the center. One rAF-throttled scroll handler turns each slide's distance from the center into CSS
// variables (rotate, scale, shift, opacity) that its pose wrapper reads; Vue never re-renders per frame.
defineOptions({ name: 'SnapCarousel' })
const props = defineProps<{ items: T[]; label: string }>()
defineSlots<{ slide(p: { item: T; index: number }): unknown }>()

const track = ref<HTMLElement | null>(null)
const current = ref(0)
const slides = (): HTMLElement[] => (track.value ? [...track.value.children] as HTMLElement[] : [])
// Scroll position that centers slide i (offsetLeft is relative to the positioned track).
const target = (s: HTMLElement, t: HTMLElement) => s.offsetLeft + s.offsetWidth / 2 - t.clientWidth / 2

function go(i: number) {
  const n = props.items.length
  if (!n) return
  current.value = Math.max(0, Math.min(n - 1, i))
  const t = track.value
  const s = slides()[current.value]
  if (t && s) t.scrollTo?.({ left: target(s, t), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

// At an end the arrow stays focusable (aria-disabled, not disabled) so keyboard focus is not dropped to <body>.
const atEnd = (dir: 'prev' | 'next') => (dir === 'prev' ? current.value === 0 : current.value === props.items.length - 1)

// Only on the track itself: arrows on a link or button inside keep their native behavior.
function onKey(e: KeyboardEvent) {
  if (e.target !== e.currentTarget) return
  const i = stepIndex(e.key, current.value, props.items.length, false)
  if (i === null) return
  e.preventDefault()
  go(i)
}

// A tap on a side slide brings it to the center instead of following a link in it.
function onSlideClick(e: MouseEvent, i: number) {
  if (i === current.value) return
  e.preventDefault()
  e.stopPropagation()
  go(i)
}

let raf = 0
function paint() {
  raf = 0
  const t = track.value
  if (!t || prefersReducedMotion()) return
  const mid = t.scrollLeft + t.clientWidth / 2
  for (const s of slides()) {
    if (!s.offsetWidth) continue
    const f = coverflowFrame((s.offsetLeft + s.offsetWidth / 2 - mid) / s.offsetWidth)
    s.style.setProperty('--cf-r', `${f.rotate.toFixed(2)}deg`)
    s.style.setProperty('--cf-s', f.scale.toFixed(3))
    s.style.setProperty('--cf-x', f.shift.toFixed(3))
    s.style.setProperty('--cf-o', String(f.opacity))
    s.style.zIndex = String(f.z)
  }
}
const schedule = () => { raf ||= requestAnimationFrame(paint) }

// Swipes and native scrolling: once scrolling settles, the slide nearest the center is current.
let settle: ReturnType<typeof setTimeout> | undefined
function sync() {
  const t = track.value
  const all = slides()
  if (!t || !all.length || !t.clientWidth) return
  const d = all.map((s) => Math.abs(target(s, t) - t.scrollLeft))
  current.value = d.indexOf(Math.min(...d))
}
function onScroll() {
  schedule()
  clearTimeout(settle)
  settle = setTimeout(sync, 100)
}
onMounted(() => {
  schedule()
  window.addEventListener('resize', schedule)
})
onBeforeUnmount(() => {
  clearTimeout(settle)
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', schedule)
})
</script>

<template>
  <div
    role="region"
    aria-roledescription="carousel"
    :aria-label="label"
    class="min-w-0 [container-type:inline-size]"
  >
    <!-- The track scrolls, so it clips: its 56px block padding (32px on phones) is the unclipped room for card
         sprouts. Negative margins let that room overlap the filter and the controls (which sit above it, z-10)
         so it costs almost no height; `isolate` keeps the slides' z-index inside the track. On phones the track
         runs out over the 16px page gutter so the side room reaches the screen edge (4cqw + 16px). -->
    <div
      ref="track"
      data-track
      tabindex="0"
      role="group"
      :aria-label="`${label} slides`"
      class="snap-track relative isolate -my-7 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain py-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:-my-12 sm:rounded-[1.75rem] sm:py-14"
      :class="items.length > 1 ? '-mx-4 px-[calc(4cqw+1rem)] sm:mx-0 sm:px-[15cqw]' : ''"
      @scroll.passive="onScroll"
      @keydown="onKey"
    >
      <div
        v-for="(item, i) in items"
        :key="i"
        role="group"
        aria-roledescription="slide"
        :aria-label="`${i + 1} of ${items.length}`"
        :aria-current="i === current ? 'true' : undefined"
        data-slide
        class="relative flex min-w-0 shrink-0 snap-center"
        :class="items.length === 1 ? 'basis-full' : 'basis-[92cqw] sm:basis-[70cqw]'"
        @click.capture="onSlideClick($event, i)"
      >
        <div
          data-cf-pose
          class="flex w-full"
          :class="i === current ? '' : 'cursor-pointer'"
        >
          <slot
            name="slide"
            :item="item"
            :index="i"
          />
        </div>
      </div>
    </div>
    <div
      v-if="items.length > 1"
      class="relative z-10 mt-2 flex items-center gap-x-6 sm:mt-1"
    >
      <p
        class="font-serif text-lg tabular-nums text-ink/70"
        aria-live="polite"
      >
        <span class="sr-only">Slide {{ current + 1 }} of {{ items.length }}</span>
        <span aria-hidden="true"><span class="text-ink">{{ current + 1 }}</span> / {{ items.length }}</span>
      </p>
      <div
        data-dots
        class="hidden flex-1 flex-wrap items-center justify-center sm:flex"
      >
        <button
          v-for="(_, i) in items"
          :key="i"
          type="button"
          :aria-label="`Go to slide ${i + 1}`"
          :aria-current="current === i ? 'true' : undefined"
          class="group flex h-11 w-7 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          @click="go(i)"
        >
          <span
            class="block h-1.5 w-1.5 rounded-full transition-transform duration-300 motion-reduce:transition-none"
            :class="current === i ? 'scale-x-[3] bg-accent' : 'bg-ink/30 group-hover:bg-ink/60'"
          />
        </button>
      </div>
      <div class="ml-auto flex gap-2">
        <button
          v-for="dir in (['prev', 'next'] as const)"
          :key="dir"
          type="button"
          :aria-label="dir === 'prev' ? 'Previous slide' : 'Next slide'"
          :aria-disabled="atEnd(dir) ? 'true' : undefined"
          class="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:border-line aria-disabled:hover:text-ink"
          @click="atEnd(dir) || go(current + (dir === 'prev' ? -1 : 1))"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            class="h-5 w-5"
            :class="dir === 'prev' ? 'rotate-180' : ''"
          ><path
            d="M4 10h11m-4-4 4 4-4 4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg>
        </button>
      </div>
    </div>
  </div>
</template>
