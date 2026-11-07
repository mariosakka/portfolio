<script setup lang="ts" generic="T">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({ name: 'SnapCarousel' })
const props = withDefaults(defineProps<{
  items: T[]
  label: string
  // Slide width; under 100% so the next slide peeks in. A lone slide is always full width.
  slideClass?: string
}>(), { slideClass: 'basis-[88%] md:basis-[84%]' })
defineSlots<{ slide(p: { item: T; index: number }): unknown }>()

const track = ref<HTMLElement | null>(null)
const current = ref(0) // index of the current stop
const count = ref(props.items.length) // number of stops

// Stepping works on STOPS, not slides: a stop is a scroll position the track can actually reach.
// Slide i is its own stop while its start is short of the max scroll; every slide that can only be
// reached by scrolling to the end shares one final stop at the max scroll. With one slide in view
// that is one stop per slide; with two in view (Certificates) the last two share the end stop.
// Dots, the counter and Prev/Next all count stops, so Next visits each reachable position once.
// Without layout (jsdom, or before first paint) there is one stop per slide.
function stops(): number[] {
  const t = track.value
  const slides = t ? [...t.children] as HTMLElement[] : []
  if (!t || !t.scrollWidth) return slides.map((s) => s.offsetLeft)
  const max = t.scrollWidth - t.clientWidth
  if (max <= 2) return [0]
  return [...slides.map((s) => s.offsetLeft).filter((x) => x < max - 2), max]
}
function measure() {
  const s = stops()
  count.value = s.length
  current.value = Math.min(current.value, Math.max(0, s.length - 1))
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

function go(i: number) {
  const s = stops()
  if (!s.length) return
  count.value = s.length
  current.value = Math.max(0, Math.min(s.length - 1, i))
  track.value?.scrollTo?.({ left: s[current.value], behavior: reduced() ? 'auto' : 'smooth' })
}

// Only on the track itself: arrows on a link, button or dot inside keep their native behavior.
function onKey(e: KeyboardEvent) {
  if (e.target !== e.currentTarget || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return
  e.preventDefault()
  go(current.value + (e.key === 'ArrowRight' ? 1 : -1))
}

// Swipes and native scrolling: once scrolling settles, the stop nearest the scroll position is current.
// Read from layout, not IntersectionObserver: IO entries can arrive after the settle timer (seen in Chromium).
// Waiting for the settle keeps smooth scrolls from flickering the dots.
let settle: ReturnType<typeof setTimeout> | undefined
function sync() {
  const t = track.value
  const s = stops()
  if (!t || !s.length) return
  count.value = s.length
  const d = s.map((x) => Math.abs(x - t.scrollLeft))
  current.value = d.indexOf(Math.min(...d))
}
function onScroll() {
  clearTimeout(settle)
  settle = setTimeout(sync, 100)
}
onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => {
  clearTimeout(settle)
  window.removeEventListener('resize', measure)
})
</script>

<template>
  <div
    role="region"
    aria-roledescription="carousel"
    :aria-label="label"
    class="min-w-0"
  >
    <div
      ref="track"
      data-track
      tabindex="0"
      role="group"
      :aria-label="`${label} slides`"
      class="snap-track relative flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain rounded-[1.75rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:gap-6"
      @scroll.passive="onScroll"
      @keydown="onKey"
    >
      <div
        v-for="(item, i) in items"
        :key="i"
        role="group"
        aria-roledescription="slide"
        :aria-label="`${i + 1} of ${items.length}`"
        class="flex min-w-0 shrink-0 snap-start"
        :class="items.length === 1 ? 'basis-full' : slideClass"
      >
        <slot
          name="slide"
          :item="item"
          :index="i"
        />
      </div>
    </div>
    <div
      v-if="count > 1"
      class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3"
    >
      <p
        class="font-serif text-lg tabular-nums text-ink/70"
        aria-live="polite"
      >
        <span class="sr-only">Slide {{ current + 1 }} of {{ count }}</span>
        <span aria-hidden="true"><span class="text-ink">{{ current + 1 }}</span> / {{ count }}</span>
      </p>
      <div
        data-dots
        class="order-last flex w-full flex-wrap items-center sm:order-none sm:w-auto sm:flex-1"
      >
        <button
          v-for="i in count"
          :key="i"
          type="button"
          :aria-label="`Go to slide ${i}`"
          :aria-current="current === i - 1 ? 'true' : undefined"
          class="group flex h-11 w-7 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          @click="go(i - 1)"
        >
          <span
            class="block h-1.5 rounded-full transition-all motion-reduce:transition-none"
            :class="current === i - 1 ? 'w-5 bg-accent' : 'w-1.5 bg-ink/30 group-hover:bg-ink/60'"
          />
        </button>
      </div>
      <div class="ml-auto flex gap-2">
        <button
          v-for="dir in (['prev', 'next'] as const)"
          :key="dir"
          type="button"
          :aria-label="dir === 'prev' ? 'Previous slide' : 'Next slide'"
          :disabled="dir === 'prev' ? current === 0 : current === count - 1"
          class="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-30"
          @click="go(current + (dir === 'prev' ? -1 : 1))"
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
