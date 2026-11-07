<script setup lang="ts">
import { computed, ref } from 'vue'
import Carousel from '../Carousel.vue'
import HeroCard from '../HeroCard.vue'
import raw from '../../data/projects.json'
import type { Project } from '../../types/data'
import { toList } from '../../lib/normalize'

const data: Project[] = raw
const cats = ['All', ...new Set(data.map((d) => d.category).filter(Boolean))]
const active = ref('All')
const team: Record<string, string> = { team: 'Team project', single: 'Solo project' }
const items = computed(() => data.filter((d) => active.value === 'All' || d.category === active.value))
</script>

<template>
  <div
    data-filter
    role="group"
    aria-label="Filter projects by category"
    class="nav-scroll -mx-1 mb-4 flex gap-2 overflow-x-auto p-1 short:mb-2 sm:flex-wrap"
  >
    <!-- one swipeable row on phones so the filter costs a single line of height -->
    <button
      v-for="c in cats"
      :key="c"
      type="button"
      :aria-pressed="active === c"
      class="[@media(pointer:coarse)]:min-h-11 shrink-0 whitespace-nowrap rounded-full border border-line px-4 py-1.5 text-sm text-ink transition-colors hover:border-accent/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-night-950"
      @click="active = c"
    >
      {{ c }}
    </button>
  </div>
  <!-- keyed by filter: a new filter remounts the carousel at its first slide -->
  <Carousel
    :key="active"
    :items="items"
    label="Projects"
  >
    <template #slide="{ item }">
      <HeroCard
        :title="item.title"
        :eyebrow="[item.category, item.role].filter(Boolean).join(' · ')"
        :meta="team[item.teamType] ?? ''"
        :image="item.image"
        :short-description="item.shortDescription"
        :description="item.description"
        :long-description="item.longDescription"
        :tags="toList(item.technologies)"
        :links="[{ label: 'Live', url: item.liveUrl }, { label: 'GitHub', url: item.githubUrl }]"
      />
    </template>
  </Carousel>
</template>
