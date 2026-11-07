<script setup lang="ts" generic="T">
import { onBeforeUnmount, ref } from 'vue'

defineOptions({ name: 'SnapCarousel' })
const props = withDefaults(defineProps<{
  items: T[]
  label: string
  // Slide width; under 100% so the next slide peeks in.
  slideClass?: string
}>(), { slideClass: 'basis-[88%] md:basis-[84%]' })
defineSlots<{ slide(p: { item: T; index: number }): unknown }>()

const track = ref<HTMLElement | null>(null)
const current = ref(0)

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const atEnd = (t: HTMLElement) => t.scrollWidth > t.clientWidth && t.scrollLeft + t.clientWidth >= t.scrollWidth - 2

function go(i: number) {
  const n = props.items.length
  if (!n) return
  current.value = Math.max(0, Math.min(n - 1, i))
  const t = track.value
  const slide = t?.children[current.value] as HTMLElement | undefined
  t?.scrollTo?.({ left: slide ? slide.offsetLeft : 0, behavior: reduced() ? 'auto' : 'smooth' })
}

function onKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  e.preventDefault()
  go(current.value + (e.key === 'ArrowRight' ? 1 : -1))
}

// Swipes and native scrolling: once scrolling settles, the slide snapped nearest the start is current,
// or the last one at the scroll end. Read from layout, not IntersectionObserver: IO entries can arrive after
// the settle timer and reset the index (seen in Chromium). Waiting for the settle keeps smooth scrolls from flickering the dots.
let settle: ReturnType<typeof setTimeout> | undefined
function sync() {
  const t = track.value
  if (!t || !t.children.length) return
  if (atEnd(t)) return void (current.value = t.children.length - 1)
  const d = [...t.children].map((c) => Math.abs((c as HTMLElement).offsetLeft - t.scrollLeft))
  current.value = d.indexOf(Math.min(...d))
}
function onScroll() {
  clearTimeout(settle)
  settle = setTimeout(sync, 100)
}
onBeforeUnmount(() => clearTimeout(settle))
</script>

<template>
  <div
    role="region"
    aria-roledescription="carousel"
    :aria-label="label"
    class="min-w-0"
    @keydown="onKey"
  >
    <div
      ref="track"
      data-track
      tabindex="0"
      class="snap-track relative flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain rounded-[1.75rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:gap-6"
      @scroll.passive="onScroll"
    >
      <div
        v-for="(item, i) in items"
        :key="i"
        role="group"
        aria-roledescription="slide"
        :aria-label="`${i + 1} of ${items.length}`"
        class="flex min-w-0 shrink-0 snap-start"
        :class="slideClass"
      >
        <slot
          name="slide"
          :item="item"
          :index="i"
        />
      </div>
    </div>
    <div
      v-if="items.length > 1"
      class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3"
    >
      <p
        class="font-serif text-lg tabular-nums text-ink/70"
        aria-live="polite"
      >
        <span class="text-ink">{{ current + 1 }}</span> / {{ items.length }}
      </p>
      <div
        data-dots
        class="order-last flex w-full flex-wrap items-center sm:order-none sm:w-auto sm:flex-1"
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
            class="block h-1.5 rounded-full transition-all motion-reduce:transition-none"
            :class="current === i ? 'w-5 bg-accent' : 'w-1.5 bg-ink/30 group-hover:bg-ink/60'"
          />
        </button>
      </div>
      <div class="ml-auto flex gap-2">
        <button
          v-for="dir in (['prev', 'next'] as const)"
          :key="dir"
          type="button"
          :aria-label="dir === 'prev' ? 'Previous slide' : 'Next slide'"
          :disabled="dir === 'prev' ? current === 0 : current === items.length - 1"
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
