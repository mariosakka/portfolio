<script setup lang="ts">
import HeroCard from '../HeroCard.vue'
import raw from '../../data/experience.json'
import type { Experience } from '../../types/data'
import { formatPeriod, toList } from '../../lib/normalize'

const data: Experience[] = raw
</script>

<template>
  <div class="space-y-8 sm:space-y-10">
    <HeroCard
      v-for="(d, i) in data"
      :key="d.id"
      :title="d.title"
      :eyebrow="d.company"
      :meta="formatPeriod(d.startDate, d.endDate, d.isPresent)"
      :image="d.image"
      logo
      :short-description="d.shortDescription"
      :description="d.description"
      :long-description="d.longDescription"
      :facts="[{ label: 'Location', value: d.location }]"
      :tags="toList(d.technologies)"
      :links="[{ label: 'Website', url: d.websiteUrl }]"
      :image-side="i % 2 ? 'right' : 'left'"
    />
  </div>
</template>
