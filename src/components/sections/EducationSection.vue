<script setup lang="ts">
import CardList from './CardList.vue'
import raw from '../../data/education.json'
import type { Education } from '../../types/data'
import { formatPeriod, toList } from '../../lib/normalize'

const data: Education[] = raw
const first = (...v: (string | undefined)[]): string => v.find((s) => s && s.trim()) || ''
const items = data.map((d) => ({
  title: d.degree,
  subtitle: [d.institution, d.fieldOfStudy].filter(Boolean).join(' - '),
  period: formatPeriod(d.startDate, d.endDate, d.isPresent),
  image: d.image,
  tags: toList(d.subjects),
  links: [{ label: 'Website', url: d.websiteUrl }],
  detail: first(d.longDescription, d.description, d.shortDescription),
}))
</script>

<template>
  <CardList :items="items" />
</template>
