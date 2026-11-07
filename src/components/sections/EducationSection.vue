<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import HeroCard from '../HeroCard.vue'
import raw from '../../data/education.json'
import type { Education } from '../../types/data'
import { formatPeriod, toList } from '../../lib/normalize'
import { deckDepth, deckStep, swipeDirection } from '../../lib/motion'
import type { Deck, DeckAction } from '../../lib/motion'
import { prefersReducedMotion, vPointer, vReveal } from '../../lib/useMotion'

const data: Education[] = raw
const n = data.length
const deck = ref<Deck>({ top: 0, moving: null, dir: -1 })
const FLY_MS = 420 // keep in sync with duration-[420ms] below

let settle: ReturnType<typeof setTimeout> | undefined
function act(a: DeckAction) {
  deck.value = deckStep(deck.value, a, n)
  if (deck.value.moving === null) return
  clearTimeout(settle)
  settle = setTimeout(() => { deck.value = deckStep(deck.value, { type: 'settle' }, n) }, prefersReducedMotion() ? 0 : FLY_MS)
}
onBeforeUnmount(() => clearTimeout(settle))

function onKey(e: KeyboardEvent) {
  if (e.target !== e.currentTarget || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return
  e.preventDefault()
  act(e.key === 'ArrowRight' ? { type: 'next' } : { type: 'prev' })
}

// Drag the top card sideways (mouse or touch; vertical page scroll stays native via touch-action: pan-y).
// Past the swipe threshold it flies out to that side; a drag never also counts as a click on a link in it.
const drag = ref(0)
let startX = 0
let down = false
let moved = false
function onDown(e: PointerEvent) {
  if (e.button !== 0) return
  down = true
  moved = false
  startX = e.clientX
}
function onMove(e: PointerEvent) {
  if (!down) return
  const dx = e.clientX - startX
  if (!moved && Math.abs(dx) > 8) {
    moved = true
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  if (moved) drag.value = dx
}
function onUp(e: PointerEvent) {
  if (!down) return
  down = false
  const d = swipeDirection(drag.value, (e.currentTarget as HTMLElement).offsetWidth || 300)
  drag.value = 0
  if (d) act({ type: 'next', dir: d })
}
function onCancel() {
  down = false
  drag.value = 0
}
function onClickCapture(e: MouseEvent) {
  if (!moved) return
  moved = false
  e.preventDefault()
  e.stopPropagation()
}

function pose(i: number): Record<string, string> {
  const { top, moving, dir } = deck.value
  if (i === moving) return { transform: `translateX(${dir * 112}%) rotate(${dir * 7}deg)`, zIndex: String(n + 1) }
  const d = deckDepth(i, top, n)
  if (d === 0 && drag.value) return { transform: `translateX(${drag.value}px) rotate(${drag.value * 0.03}deg)`, zIndex: String(n), transition: 'none' }
  return { transform: d ? `translate(${d * 16}px, ${d * 16}px) scale(${1 - d * 0.03}) rotate(${d * 2.2}deg)` : 'none', zIndex: String(n - d) }
}
</script>

<template>
  <!-- Deck: the cards lie stacked with an offset; Next (button, ArrowRight, or a swipe either way) flies the
       top card out to the side and tucks it under the stack, revealing the next one. -->
  <div v-reveal="'scale'">
    <div
      role="group"
      aria-roledescription="card deck"
      aria-label="Education"
      tabindex="0"
      data-deck
      class="grid rounded-[1.75rem] pb-4 pr-4 sm:pb-5 sm:pr-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      @keydown="onKey"
    >
      <div
        v-for="(d, i) in data"
        :key="d.id"
        data-deck-card
        :aria-hidden="i === deck.top ? undefined : 'true'"
        :inert="i !== deck.top || undefined"
        class="relative flex rounded-[1.75rem] bg-night-950 transition-transform duration-[420ms] ease-[cubic-bezier(0.3,0.7,0.2,1)] [grid-area:1/1] motion-reduce:transition-none"
        :class="i === deck.top ? 'touch-pan-y cursor-grab select-none active:cursor-grabbing' : ''"
        :style="pose(i)"
        @pointerdown="i === deck.top && onDown($event)"
        @pointermove="i === deck.top && onMove($event)"
        @pointerup="i === deck.top && onUp($event)"
        @pointercancel="onCancel"
        @click.capture="onClickCapture"
      >
        <HeroCard
          v-pointer
          :title="d.degree"
          :eyebrow="d.institution"
          :meta="formatPeriod(d.startDate, d.endDate, d.isPresent)"
          :image="d.image"
          logo
          :short-description="d.shortDescription"
          :description="d.description"
          :long-description="d.longDescription"
          :facts="[
            { label: 'Field', value: d.fieldOfStudy },
            { label: 'GPA', value: d.gpa },
            { label: 'Department', value: d.department },
          ]"
          :tags="toList(d.subjects)"
          :links="[{ label: 'Website', url: d.websiteUrl }]"
        />
      </div>
    </div>
    <div
      v-if="n > 1"
      class="mt-3 flex items-center gap-x-4 xshort:mt-1"
    >
      <p
        class="min-w-0 truncate font-serif text-lg tabular-nums text-ink/70"
        aria-live="polite"
      >
        <span class="sr-only">Card {{ deck.top + 1 }} of {{ n }}: {{ data[deck.top].degree }}</span>
        <span aria-hidden="true"><span class="text-ink">{{ deck.top + 1 }}</span> / {{ n }}</span>
      </p>
      <div class="ml-auto flex gap-2">
        <button
          v-for="dir in (['prev', 'next'] as const)"
          :key="dir"
          type="button"
          :aria-label="dir === 'prev' ? 'Previous card' : 'Next card'"
          class="flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm text-ink transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          @click="act(dir === 'prev' ? { type: 'prev' } : { type: 'next' })"
        >
          <span
            aria-hidden="true"
            :class="dir === 'prev' ? '' : 'order-last'"
          >{{ dir === 'prev' ? '←' : '→' }}</span>
          <span>{{ dir === 'prev' ? 'Previous' : 'Next' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
