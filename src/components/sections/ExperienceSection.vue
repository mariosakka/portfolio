<script setup>
import CardList from './CardList.vue'
import data from '../../data/experience.json'
import { formatPeriod, toList } from '../../lib/normalize'

const first = (...v) => v.find((s) => s && s.trim()) || ''
const items = data.map((d) => ({
  title: d.title,
  subtitle: [d.company, d.shortDescription].filter(Boolean).join(' - '),
  period: formatPeriod(d.startDate, d.endDate, d.isPresent),
  image: d.image,
  tags: toList(d.technologies),
  links: [{ label: 'Website', url: d.websiteUrl }],
  detail: first(d.longDescription, d.description, d.shortDescription),
}))
</script>

<template>
  <CardList :items="items" />
</template>
