<script setup>
import { computed } from 'vue'
import { Bud } from '../garden'

const props = defineProps({
  image: { type: String, default: '' },
  title: { type: String, required: true },
  bud: { type: Boolean, default: false },
  subtitle: { type: String, default: '' },
  period: { type: String, default: '' },
  tags: { type: Array, default: () => [] },
  links: { type: Array, default: () => [] },
})
defineEmits(['open'])
const shownLinks = computed(() => props.links
  .map((l) => ({ label: l.label, url: typeof l.url === 'string' ? l.url.trim() : '' }))
  .filter((l) => l.url))
</script>

<template>
  <article class="relative flex flex-col overflow-hidden rounded-2xl border border-[rgba(127,176,255,.3)] bg-[#0b1f4a] text-[#e4edff]">
    <svg
      v-if="bud"
      aria-hidden="true"
      focusable="false"
      viewBox="-20 -56 40 60"
      class="pointer-events-none absolute right-3 top-3 h-10 w-7"
    >
      <Bud />
    </svg>
    <button
      type="button"
      class="flex flex-1 flex-col gap-2 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4f8bff]"
      @click="$emit('open')"
    >
      <img
        v-if="image"
        :src="image"
        alt=""
        class="h-40 w-full rounded-xl object-cover"
      >
      <span class="font-serif text-xl">{{ title }}</span>
      <span
        v-if="subtitle"
        class="text-sm opacity-80"
      >{{ subtitle }}</span>
      <span
        v-if="period"
        class="text-xs opacity-60"
      >{{ period }}</span>
    </button>
    <ul
      v-if="tags.length"
      class="flex flex-wrap gap-2 px-4 pb-3"
    >
      <li
        v-for="(t, i) in tags"
        :key="i"
        class="rounded-full border border-[rgba(127,176,255,.3)] px-2 py-0.5 text-xs"
      >
        {{ t }}
      </li>
    </ul>
    <div
      v-if="shownLinks.length"
      class="flex flex-wrap gap-x-4 px-4 pb-1 text-sm"
    >
      <template
        v-for="(l, i) in shownLinks"
        :key="i"
      >
        <a
          :href="l.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex min-h-11 items-center text-[#4f8bff] underline"
        >{{ l.label }}</a>
      </template>
    </div>
  </article>
</template>
