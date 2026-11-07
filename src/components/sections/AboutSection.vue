<script setup lang="ts">
import aboutJson from '../../data/about.json'
import type { About } from '../../types/data'
import CommitBadge from '../CommitBadge.vue'

const about: About = aboutJson
</script>

<template>
  <!-- Phones: a small photo beside the name, the rest below, so the section fits one screen.
       md+: the large photo on the left spans both text blocks. -->
  <div class="grid grid-cols-[6.5rem_1fr] items-center gap-x-5 gap-y-5 text-ink md:grid-cols-[16rem_1fr] md:gap-x-12 md:gap-y-5">
    <img
      v-if="about.photo"
      :src="about.photo"
      :alt="about.fullName"
      class="aspect-[4/5] w-full rounded-2xl border border-line object-cover md:row-span-2 md:self-center md:rounded-[1.75rem] md:short:w-52"
    >
    <div class="min-w-0 space-y-2 self-center md:space-y-4 md:self-end">
      <h3 class="font-serif text-3xl leading-tight sm:text-4xl">
        {{ about.fullName }}
      </h3>
      <p class="text-xs uppercase tracking-[0.18em] text-accent">
        {{ [about.role, about.location].filter(Boolean).join(' - ') }}
      </p>
    </div>
    <div class="col-span-2 min-w-0 space-y-5 md:col-span-1 md:col-start-2 md:self-start">
      <p class="max-w-prose whitespace-pre-line text-lg text-ink/85">
        {{ about.description }}
      </p>
      <p class="text-sm opacity-80">
        Languages: {{ about.languages.join(', ') }}
      </p>
      <CommitBadge />
    </div>
  </div>
</template>
