<script setup lang="ts">
import CardList from './CardList.vue'
import raw from '../../data/organizations.json'
import type { Organization } from '../../types/data'
import { formatPeriod } from '../../lib/normalize'

const data: Organization[] = raw
const first = (...v: (string | undefined)[]): string => v.find((s) => s && s.trim()) || ''
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
