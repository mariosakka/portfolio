<script setup lang="ts">
import aboutJson from '../../data/about.json'
import type { About } from '../../types/data'
import CommitBadge from '../CommitBadge.vue'

const about: About = aboutJson
</script>

<template>
  <div class="grid items-center gap-8 text-ink md:grid-cols-[16rem_1fr] md:gap-12">
    <img
      v-if="about.photo"
      :src="about.photo"
      :alt="about.fullName"
      class="aspect-[4/5] w-56 rounded-[1.75rem] border border-line object-cover md:w-64"
    >
    <div class="min-w-0 space-y-5">
      <h3 class="font-serif text-3xl leading-tight sm:text-4xl">
        {{ about.fullName }}
      </h3>
      <p class="text-xs uppercase tracking-[0.18em] text-accent">
        {{ [about.role, about.location].filter(Boolean).join(' - ') }}
      </p>
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
