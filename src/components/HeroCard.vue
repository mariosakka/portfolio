<script setup lang="ts">
import { computed, ref } from 'vue'
import DetailModal from './DetailModal.vue'
import type { CardLink } from '../types/card'

const props = withDefaults(defineProps<{
  title: string
  eyebrow?: string
  meta?: string
  image?: string
  shortDescription?: string
  description?: string
  longDescription?: string
  facts?: { label: string; value: string }[]
  tags?: string[]
  links?: CardLink[]
  layout?: 'split' | 'stacked'
  imageSide?: 'left' | 'right'
  compact?: boolean
  // Small square logo (company, school): shown as a crisp tile on the blurred wash instead of filling the frame.
  logo?: boolean
}>(), {
  eyebrow: '',
  meta: '',
  image: '',
  shortDescription: '',
  description: '',
  longDescription: '',
  facts: () => [],
  tags: () => [],
  links: () => [],
  layout: 'split',
  imageSide: 'left',
  compact: false,
  logo: false,
})

const first = (...v: string[]): string => v.find((s) => s.trim()) ?? ''
const summary = computed(() => first(props.shortDescription, props.description))
const detail = computed(() => first(props.longDescription, props.description, props.shortDescription))
const paras = computed(() => detail.value.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean))
// Empty values hide; a value repeating an earlier fact (e.g. field = department) shows once.
const shownFacts = computed(() => props.facts.filter((f, i) => f.value.trim() && props.facts.findIndex((g) => g.value === f.value) === i))
// The runtime typeof check stays: link urls come from JSON that may hold non-strings.
const shownLinks = computed(() => props.links
  .map((l) => ({ label: l.label, url: typeof l.url === 'string' ? l.url.trim() : '' }))
  .filter((l) => l.url))
const split = computed(() => props.layout === 'split')
const open = ref(false)
const wash = ref<HTMLCanvasElement | null>(null)
// Image -> 6x4 pixels -> smoothed up to the 48x30 canvas: two one-off draws act as a blur
// (no ctx.filter, which older Safari lacks), so the CSS stretch shows a soft gradient, not cells.
function paintWash(e: Event) {
  const c = wash.value
  const ctx = c?.getContext('2d')
  if (!c || !ctx) return
  ctx.drawImage(e.target as HTMLImageElement, 0, 0, 6, 4)
  ctx.globalCompositeOperation = 'copy' // replace, so the 6x4 draft never shows through transparent images
  ctx.drawImage(c, 0, 0, 6, 4, 0, 0, c.width, c.height)
}
</script>

<template>
  <article
    class="relative grid w-full overflow-hidden rounded-[1.75rem] border border-line bg-surface text-ink"
    :class="split ? 'md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]' : ''"
  >
    <figure
      v-if="image"
      class="relative m-2 flex items-center justify-center overflow-hidden rounded-[1.35rem] bg-night-900 [contain:paint] sm:m-3"
      :class="[
        split ? 'aspect-[16/10] md:aspect-auto md:min-h-[20rem]' : 'aspect-[16/10]',
        split && imageSide === 'right' ? 'md:order-last' : '',
      ]"
    >
      <!-- Real images are square or portrait logos and shots, so the image is never cropped; a soft wash of its
           colors fills the frame. The wash is a 48x30 canvas painted once from the already loaded image and stretched
           by CSS: no filter layer, no extra request, no per-frame cost. -->
      <canvas
        ref="wash"
        width="48"
        height="30"
        aria-hidden="true"
        class="absolute inset-0 h-full w-full opacity-35"
      />
      <img
        :src="image"
        alt=""
        loading="lazy"
        class="relative"
        :class="logo ? 'h-28 w-28 rounded-2xl object-cover shadow-[0_12px_28px_rgba(0,0,0,0.45)] sm:h-36 sm:w-36' : 'h-full w-full object-contain p-[7%]'"
        @load="paintWash"
      >
      <span
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 rounded-[1.35rem] ring-1 ring-inset ring-white/10"
      />
    </figure>

    <div
      class="flex min-w-0 flex-col"
      :class="compact ? 'gap-3 p-5 sm:p-6' : 'gap-4 p-6 sm:p-8 lg:p-10'"
    >
      <p
        v-if="eyebrow || meta"
        class="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs uppercase tracking-[0.18em]"
      >
        <span
          v-if="eyebrow"
          class="text-accent"
        >{{ eyebrow }}</span>
        <span
          v-if="meta"
          class="text-ink/60"
        >{{ meta }}</span>
      </p>
      <h3
        class="font-serif leading-[1.05] tracking-tight text-ink"
        :class="compact ? 'text-2xl sm:text-[1.7rem]' : 'text-3xl sm:text-4xl lg:text-[2.75rem]'"
      >
        {{ title }}
      </h3>
      <p
        v-if="summary"
        class="max-w-prose text-ink/75"
        :class="compact ? 'line-clamp-3' : 'line-clamp-4 sm:text-lg'"
      >
        {{ summary }}
      </p>
      <dl
        v-if="shownFacts.length"
        class="flex flex-wrap gap-x-8 gap-y-2 text-sm"
      >
        <div
          v-for="f in shownFacts"
          :key="f.label"
        >
          <dt class="text-xs uppercase tracking-[0.18em] text-ink/50">
            {{ f.label }}
          </dt>
          <dd class="mt-0.5 font-serif text-lg text-ink">
            {{ f.value }}
          </dd>
        </div>
      </dl>
      <ul
        v-if="tags.length"
        class="flex flex-wrap gap-1.5"
      >
        <li
          v-for="(t, i) in tags"
          :key="i"
          class="rounded-full border border-line bg-night-950/40 px-2.5 py-0.5 text-xs text-ink/80"
        >
          {{ t }}
        </li>
      </ul>
      <div
        v-if="shownLinks.length || paras.length"
        class="mt-auto flex flex-wrap items-center gap-2 pt-2"
      >
        <a
          v-for="(l, i) in shownLinks"
          :key="i"
          :href="l.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          :class="i === 0 ? 'border-accent/40 bg-accent/15 text-ink hover:bg-accent/25' : 'border-line text-ink/85 hover:border-accent/50 hover:text-accent'"
        >
          {{ l.label }}<span class="sr-only"> ({{ title }}, opens in a new tab)</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            class="h-3.5 w-3.5"
          ><path
            d="M5 11 11 5M6 5h5v5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          /></svg>
        </a>
        <button
          v-if="paras.length"
          type="button"
          class="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm text-accent transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          @click="open = true"
        >
          Read more<span class="sr-only"> about {{ title }}</span>
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </div>
    <DetailModal
      :open="open"
      :title="title"
      @close="open = false"
    >
      <p
        v-for="(p, i) in paras"
        :key="i"
        class="mb-3 whitespace-pre-line"
      >
        {{ p }}
      </p>
    </DetailModal>
  </article>
</template>
