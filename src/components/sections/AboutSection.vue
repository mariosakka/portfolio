<script setup lang="ts">
import aboutJson from '../../data/about.json'
import type { About } from '../../types/data'
import CardGarden from '../CardGarden.vue'
import CommitBadge from '../CommitBadge.vue'
import MediaFrame from '../MediaFrame.vue'
import { vReveal } from '../../lib/useMotion'

const about: About = aboutJson
</script>

<template>
  <!-- Phones: a small photo beside the name, the rest below, so the section fits one screen.
       md+: the large photo on the left spans both text blocks. The photo is revealed by a rising mask and
       drifts a little with scroll; the text lines stagger in. -->
  <div
    v-reveal="'stagger'"
    class="grid grid-cols-[6.5rem_1fr] items-center gap-x-5 gap-y-3 text-ink xshort:grid-cols-[5rem_1fr] sm:gap-y-5 md:grid-cols-[16rem_1fr] md:gap-x-12 md:gap-y-5"
  >
    <div
      v-if="about.photo"
      v-reveal="'mask'"
      data-photo
      class="relative md:row-span-2 md:self-center md:short:w-52"
    >
      <CardGarden
        seed="about"
        variant="frame"
      />
      <MediaFrame
        :src="about.photo"
        :alt="about.fullName"
        fit="cover"
        parallax
        class="aspect-[4/5] w-full rounded-2xl md:rounded-[1.75rem]"
      />
    </div>
    <div class="min-w-0 space-y-2 self-center md:space-y-4 md:self-end">
      <h3
        data-stagger
        style="--i: 1"
        class="font-serif text-3xl leading-tight xshort:text-2xl sm:text-4xl"
      >
        {{ about.fullName }}
      </h3>
      <p
        data-stagger
        style="--i: 2"
        class="text-xs uppercase tracking-[0.18em] text-accent"
      >
        {{ [about.role, about.location].filter(Boolean).join(' - ') }}
      </p>
    </div>
    <div class="col-span-2 min-w-0 space-y-3 sm:space-y-5 md:col-span-1 md:col-start-2 md:self-start">
      <p
        data-stagger
        style="--i: 3"
        class="max-w-prose whitespace-pre-line text-ink/85 sm:text-lg xshort:text-[0.95rem] xshort:leading-snug"
      >
        {{ about.description }}
      </p>
      <p
        data-stagger
        style="--i: 4"
        class="text-sm opacity-80"
      >
        Languages: {{ about.languages.join(', ') }}
      </p>
      <div
        data-stagger
        style="--i: 5"
      >
        <CommitBadge />
      </div>
    </div>
  </div>
</template>
