<script setup lang="ts">
import { computed, ref } from 'vue'
import DetailModal from './DetailModal.vue'
import type { CardLink } from '../types/card'
import { fitTags } from '../lib/normalize'

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
// About two rows of chips; the rest is a +k chip and the full list is in the Read more dialog.
const chips = computed(() => fitTags(props.tags, props.compact ? 40 : 56))
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
    :class="[
      // Stacked: the image row keeps its height and the text row takes any extra (equal-height slides).
      image ? 'grid-rows-[auto_1fr]' : '',
      split ? 'md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:grid-rows-none' : '',
    ]"
  >
    <!-- Phones and stacked cards: the image band takes a share of the screen height; split: it fills the row. -->
    <figure
      v-if="image"
      class="relative m-2 flex items-center justify-center overflow-hidden rounded-[1.35rem] bg-night-900 [contain:paint] sm:m-3"
      :class="[
        'h-[clamp(7rem,20vh,15rem)] sm:h-[clamp(7rem,24vh,15rem)] supports-[height:1svh]:h-[clamp(7rem,20svh,15rem)] supports-[height:1svh]:sm:h-[clamp(7rem,24svh,15rem)]',
        split ? 'md:h-auto md:min-h-[clamp(14rem,42vh,26rem)] supports-[height:1svh]:md:h-auto supports-[height:1svh]:md:min-h-[clamp(14rem,42svh,26rem)]' : '',
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
        :class="logo ? 'relative aspect-square h-[62%] max-h-36 w-auto rounded-2xl object-cover shadow-[0_12px_28px_rgba(0,0,0,0.45)]' : 'absolute inset-0 h-full w-full object-contain p-[7%]'"
        @load="paintWash"
      >
      <span
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 rounded-[1.35rem] ring-1 ring-inset ring-white/10"
      />
    </figure>

    <div
      class="flex min-w-0 flex-col"
      :class="compact ? 'gap-2.5 p-5 short:p-4' : 'gap-3 p-4 sm:p-7 lg:p-9 short:gap-2.5 sm:short:p-5 lg:short:p-7'"
    >
      <p
        v-if="eyebrow || meta"
        class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs uppercase tracking-[0.1em] sm:tracking-[0.18em]"
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
        :class="compact ? 'text-2xl sm:text-[1.7rem] short:text-[1.4rem]' : 'text-[1.65rem] sm:text-4xl lg:text-[2.75rem] sm:short:text-3xl lg:short:text-[2.1rem] xshort:text-2xl'"
      >
        {{ title }}
      </h3>
      <p
        v-if="summary"
        class="max-w-prose text-ink/75"
        :class="compact ? 'line-clamp-2 text-sm sm:text-base' : 'line-clamp-3 sm:text-lg short:line-clamp-2 short:text-base xshort:text-sm'"
      >
        {{ summary }}
      </p>
      <dl
        v-if="shownFacts.length"
        class="flex flex-wrap gap-x-5 gap-y-0.5 text-sm"
      >
        <div
          v-for="f in shownFacts"
          :key="f.label"
          class="flex items-baseline gap-2"
        >
          <dt class="text-[0.65rem] uppercase tracking-[0.16em] text-ink/50">
            {{ f.label }}
          </dt>
          <dd class="font-serif text-base text-ink">
            {{ f.value }}
          </dd>
        </div>
      </dl>
      <ul
        v-if="chips.shown.length"
        class="flex flex-wrap gap-1.5 [@media(max-width:639px)]:short:hidden"
      >
        <li
          v-for="(t, i) in chips.shown"
          :key="i"
          class="rounded-full border border-line bg-night-950/40 px-2.5 py-0.5 text-xs text-ink/80"
        >
          {{ t }}
        </li>
        <li
          v-if="chips.more"
          data-more-tags
          class="rounded-full border border-dashed border-line px-2.5 py-0.5 text-xs text-ink/60"
        >
          +{{ chips.more }}<span class="sr-only"> and {{ chips.more }} more, listed under Read more</span>
        </li>
      </ul>
      <div
        v-if="shownLinks.length || paras.length || tags.length"
        class="mt-auto flex flex-wrap items-center gap-1.5 pt-1 sm:gap-2"
      >
        <a
          v-for="(l, i) in shownLinks"
          :key="i"
          :href="l.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm sm:px-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
          v-if="paras.length || tags.length"
          type="button"
          class="inline-flex h-11 items-center gap-2 rounded-full px-2 text-sm text-accent sm:px-3 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          @click="open = true"
        >
          Read more<span class="sr-only"> about {{ title }}</span>
          <span
            aria-hidden="true"
            class="hidden sm:inline"
          >&rarr;</span>
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
      <ul
        v-if="tags.length"
        class="mt-4 flex flex-wrap gap-1.5"
      >
        <li
          v-for="(t, i) in tags"
          :key="i"
          class="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink/80"
        >
          {{ t }}
        </li>
      </ul>
    </DetailModal>
  </article>
</template>
