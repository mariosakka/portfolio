<script setup>
import { computed } from 'vue'

const props = defineProps({
  image: { type: String, default: '' },
  title: { type: String, required: true },
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
  <article class="flex flex-col overflow-hidden rounded-2xl border border-[rgba(127,176,255,.3)] bg-[#0b1f4a] text-[#e4edff]">
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
      class="flex flex-wrap gap-3 px-4 pb-4 text-sm"
    >
      <template
        v-for="(l, i) in shownLinks"
        :key="i"
      >
        <a
          :href="l.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[#4f8bff] underline"
        >{{ l.label }}</a>
      </template>
    </div>
  </article>
</template>
