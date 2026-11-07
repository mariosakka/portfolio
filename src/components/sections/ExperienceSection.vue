<script setup lang="ts">
import Carousel from '../Carousel.vue'
import HeroCard from '../HeroCard.vue'
import raw from '../../data/experience.json'
import type { Experience } from '../../types/data'
import { formatPeriod, toList } from '../../lib/normalize'

const data: Experience[] = raw
</script>

<template>
  <!-- A carousel like Projects: two stacked hero cards cannot share one screen at a readable size. -->
  <Carousel
    :items="data"
    label="Experience"
  >
    <template #slide="{ item: d }">
      <HeroCard
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
      />
    </template>
  </Carousel>
</template>
