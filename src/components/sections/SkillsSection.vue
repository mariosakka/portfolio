<script setup lang="ts">
import aboutJson from '../../data/about.json'
import type { About } from '../../types/data'

const { skills }: About = aboutJson
</script>

<template>
  <ul
    aria-label="Skills"
    class="flex flex-wrap gap-3 sm:gap-4"
  >
    <li
      v-for="(s, i) in skills"
      :key="s"
      class="group flex items-baseline gap-3 rounded-2xl border border-line bg-surface px-5 py-3.5 transition-colors duration-300 hover:border-accent/50 motion-reduce:transition-none sm:px-6 sm:py-4"
    >
      <span
        aria-hidden="true"
        class="text-xs tabular-nums text-ink/40 transition-colors group-hover:text-accent"
      >{{ String(i + 1).padStart(2, '0') }}</span>
      <span class="font-serif text-xl text-ink sm:text-2xl">{{ s }}</span>
    </li>
  </ul>
</template>
