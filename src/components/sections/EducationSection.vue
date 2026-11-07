<script setup lang="ts">
import Carousel from '../Carousel.vue'
import HeroCard from '../HeroCard.vue'
import raw from '../../data/education.json'
import type { Education } from '../../types/data'
import { formatPeriod, toList } from '../../lib/normalize'

const data: Education[] = raw
</script>

<template>
  <!-- A carousel like Projects: two stacked hero cards cannot share one screen at a readable size. -->
  <Carousel
    :items="data"
    label="Education"
  >
    <template #slide="{ item: d }">
      <HeroCard
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
          { label: 'GPA', value: d.gpa },
          { label: 'Department', value: d.department },
        ]"
        :tags="toList(d.subjects)"
        :links="[{ label: 'Website', url: d.websiteUrl }]"
      />
    </template>
  </Carousel>
</template>
