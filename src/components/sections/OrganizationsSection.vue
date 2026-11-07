<script setup>
import CardList from './CardList.vue'
import data from '../../data/organizations.json'
import { formatPeriod } from '../../lib/normalize'

const first = (...v) => v.find((s) => s && s.trim()) || ''
const items = data.map((d) => ({
  title: d.name,
  subtitle: [d.role, d.shortDescription].filter(Boolean).join(' - '),
  period: formatPeriod(d.startDate, d.endDate, d.isPresent),
  image: d.image,
  tags: [],
  links: [{ label: 'Website', url: d.websiteUrl }, { label: 'Social', url: d.socialUrl }],
  detail: first(d.longDescription, d.description, d.shortDescription),
}))
</script>

<template>
  <CardList :items="items" />
</template>
