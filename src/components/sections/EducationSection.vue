<script setup lang="ts">
import HeroCard from '../HeroCard.vue'
import raw from '../../data/education.json'
import type { Education } from '../../types/data'
import { formatPeriod, toList } from '../../lib/normalize'

const data: Education[] = raw
</script>

<template>
  <div class="space-y-8 sm:space-y-10">
    <HeroCard
      v-for="(d, i) in data"
      :key="d.id"
      :title="d.degree"
      :eyebrow="d.institution"
      :meta="formatPeriod(d.startDate, d.endDate, d.isPresent)"
      :image="d.image"
      logo
      :short-description="d.shortDescription"
      :description="d.description"
      :long-description="d.longDescription"
      :facts="[
        { label: 'Field', value: d.fieldOfStudy },
        { label: 'Department', value: d.department },
        { label: 'GPA', value: d.gpa },
      ]"
      :tags="toList(d.subjects)"
      :links="[{ label: 'Website', url: d.websiteUrl }]"
      :image-side="i % 2 ? 'right' : 'left'"
    />
  </div>
</template>
