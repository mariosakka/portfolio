<script setup lang="ts">
import { computed, ref } from 'vue'
import CardGarden from '../CardGarden.vue'
import DetailModal from '../DetailModal.vue'
import MediaFrame from '../MediaFrame.vue'
import raw from '../../data/certificates.json'
import type { Certificate } from '../../types/data'
import { toList } from '../../lib/normalize'
import { vPointer, vReveal } from '../../lib/useMotion'

const data: Certificate[] = raw
// Bento from md: the first tile is large (2x2), then two small ones and a wide one; the pattern repeats.
const span = ['md:col-span-2 md:row-span-2', '', '', 'md:col-span-2']
const open = ref<number | null>(null)
const shown = computed(() => (open.value === null ? null : data[open.value]))
const text = (c: Certificate) => [c.longDescription, c.description ?? '', c.shortDescription].find((s) => s.trim()) ?? ''
const url = (c: Certificate) => (typeof c.credentialUrl === 'string' ? c.credentialUrl.trim() : '')
</script>

<template>
  <!-- Mosaic of every certificate at once; a tile opens the shared detail dialog. -->
  <ul
    v-reveal="'stagger'"
    aria-label="Certificates"
    class="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4 md:grid-rows-[repeat(2,clamp(10.5rem,28svh,15.5rem))]"
  >
    <li
      v-for="(c, i) in data"
      :key="c.id"
      data-stagger
      :style="{ '--i': i }"
      class="flex min-w-0"
      :class="span[i % span.length]"
    >
      <article
        v-pointer
        class="group relative flex w-full min-w-0 flex-col gap-2 rounded-[1.5rem] border border-line bg-surface p-2 text-ink transition-colors hover:border-accent/40"
      >
        <CardGarden :seed="c.id" />
        <MediaFrame
          :src="c.image"
          class="h-[clamp(5.5rem,15svh,9rem)] shrink-0 md:h-auto md:min-h-[4.5rem] md:flex-1"
        />
        <div class="min-w-0 px-2 pb-1.5">
          <p class="truncate text-[0.65rem] uppercase tracking-[0.14em] text-accent">
            {{ c.issuer }}
          </p>
          <h3 class="line-clamp-2 font-serif text-base leading-tight sm:text-lg">
            <!-- The title button covers the whole tile (after:inset-0); the credential link sits above it. -->
            <button
              type="button"
              aria-haspopup="dialog"
              class="text-left after:absolute after:inset-0 after:rounded-[1.5rem] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
              @click="open = i"
            >
              {{ c.title }}
            </button>
          </h3>
        </div>
        <a
          v-if="url(c)"
          :href="url(c)"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`Credential (${c.title}, opens in a new tab)`"
          class="absolute right-3.5 top-3.5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-night-950/85 text-ink transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            class="h-4 w-4"
          ><path
            d="M5 11 11 5M6 5h5v5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          /></svg>
        </a>
      </article>
    </li>
  </ul>
  <DetailModal
    :open="shown !== null"
    :title="shown?.title ?? ''"
    @close="open = null"
  >
    <template v-if="shown">
      <p class="mb-3 text-xs uppercase tracking-[0.16em] text-accent">
        {{ shown.issuer }}
      </p>
      <p class="mb-3 whitespace-pre-line">
        {{ text(shown) }}
      </p>
      <ul
        v-if="toList(shown.skills).length"
        class="mt-4 flex flex-wrap gap-1.5"
      >
        <li
          v-for="(t, k) in toList(shown.skills)"
          :key="k"
          class="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink/80"
        >
          {{ t }}
        </li>
      </ul>
      <a
        v-if="url(shown)"
        :href="url(shown)"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-5 inline-flex h-11 items-center rounded-full border border-accent/40 bg-accent/15 px-4 text-sm text-ink hover:bg-accent/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >Credential<span class="sr-only"> ({{ shown.title }}, opens in a new tab)</span></a>
    </template>
  </DetailModal>
</template>
