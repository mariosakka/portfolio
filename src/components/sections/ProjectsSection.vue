<script setup>
import { computed, ref } from 'vue'
import CardList from './CardList.vue'
import data from '../../data/projects.json'
import { toList } from '../../lib/normalize'

const first = (...v) => v.find((s) => s && s.trim()) || ''
const cats = ['All', ...new Set(data.map((d) => d.category).filter(Boolean))]
const active = ref('All')
const items = computed(() => data
  .filter((d) => active.value === 'All' || d.category === active.value)
  .map((d) => ({
    title: d.title,
    subtitle: first(d.shortDescription, d.role),
    image: d.image,
    tags: toList(d.technologies),
    links: [{ label: 'Live', url: d.liveUrl }, { label: 'GitHub', url: d.githubUrl }],
    detail: first(d.longDescription, d.description, d.shortDescription),
  })))
</script>

<template>
  <div
    data-filter
    role="group"
    aria-label="Filter projects by category"
    class="mb-6 flex flex-wrap gap-2"
  >
    <button
      v-for="c in cats"
      :key="c"
      type="button"
      :aria-pressed="active === c"
      class="rounded-full border border-[rgba(127,176,255,.3)] px-3 py-1 text-sm text-[#e4edff] aria-pressed:bg-[#4f8bff] aria-pressed:text-[#06122e]"
      @click="active = c"
    >
      {{ c }}
    </button>
  </div>
  <CardList :items="items" />
</template>
