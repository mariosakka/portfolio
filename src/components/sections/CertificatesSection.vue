<script setup>
import CardList from './CardList.vue'
import data from '../../data/certificates.json'
import { toList } from '../../lib/normalize'

const first = (...v) => v.find((s) => s && s.trim()) || ''
const items = data.map((d) => ({
  title: d.title,
  subtitle: first(d.shortDescription, d.issuer),
  period: '',
  image: d.image,
  tags: toList(d.skills),
  links: [{ label: 'Credential', url: d.credentialUrl }],
  detail: first(d.longDescription, d.description, d.shortDescription),
}))
</script>

<template>
  <CardList :items="items" />
</template>
