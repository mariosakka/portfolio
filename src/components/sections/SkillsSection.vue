<script setup lang="ts">
import CardGarden from '../CardGarden.vue'
import aboutJson from '../../data/about.json'
import type { About } from '../../types/data'
import { vReveal } from '../../lib/useMotion'

const { skills }: About = aboutJson
// Organic cluster: a repeating pattern of three pill sizes and small vertical offsets (px, halved on phones).
const size = ['text-xl sm:text-3xl', 'text-base sm:text-xl', 'text-lg sm:text-2xl']
const dy = [0, 14, -8, 10, -12, 4, 12, -6, 8, -10, 2, 14]
</script>

<template>
  <div
    v-if="skills.length"
    class="relative mx-auto w-full max-w-4xl"
  >
    <CardGarden
      seed="skills"
      variant="cluster"
    />
    <ul
      v-reveal="'stagger'"
      aria-label="Skills"
      class="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:gap-x-4 sm:gap-y-6 short:sm:gap-y-4"
    >
      <li
        v-for="(s, i) in skills"
        :key="s"
        data-stagger
        class="relative top-[calc(var(--dy)*0.5px)] sm:top-[calc(var(--dy)*1px)]"
        :style="{ '--i': i, '--dy': dy[i % dy.length] }"
      >
        <span class="group flex items-baseline gap-2.5 rounded-full border border-line bg-surface px-3.5 py-1.5 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-accent/50 active:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-6 sm:py-3">
          <span
            aria-hidden="true"
            class="text-xs tabular-nums text-ink/45 transition-colors group-hover:text-accent"
          >{{ String(i + 1).padStart(2, '0') }}</span>
          <span
            data-skill
            class="font-serif text-ink"
            :class="size[i % size.length]"
          >{{ s }}</span>
        </span>
      </li>
    </ul>
  </div>
</template>
