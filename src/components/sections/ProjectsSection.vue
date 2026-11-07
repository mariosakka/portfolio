<script setup lang="ts">
import { computed, ref } from 'vue'
import CardList from './CardList.vue'
import raw from '../../data/projects.json'
import type { Project } from '../../types/data'
import { toList } from '../../lib/normalize'

const data: Project[] = raw
const first = (...v: (string | undefined)[]): string => v.find((s) => s && s.trim()) || ''
const cats = ['All', ...new Set(data.map((d) => d.category).filter(Boolean))]
const active = ref('All')
const items = computed(() => data
  .filter((d) => active.value === 'All' || d.category === active.value)
  .map((d) => ({
    title: d.title,
    bud: true,
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
      class="[@media(pointer:coarse)]:min-h-11 rounded-full border border-line px-4 text-sm text-ink aria-pressed:bg-accent aria-pressed:text-night-950"
      @click="active = c"
    >
      {{ c }}
    </button>
  </div>
  <CardList :items="items" />
</template>
