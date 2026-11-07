<script setup lang="ts">
import HeroCard from '../HeroCard.vue'
import raw from '../../data/organizations.json'
import type { Organization } from '../../types/data'
import { formatPeriod } from '../../lib/normalize'
import { vPointer, vReveal } from '../../lib/useMotion'

const data: Organization[] = raw
</script>

<template>
  <!-- Spotlight: one large split card (text left, logo right) wiped in from the left, its title underline
       drawn after it. -->
  <div
    v-reveal="'wipe'"
    class="space-y-8 sm:space-y-10"
  >
    <HeroCard
      v-for="d in data"
      :key="d.id"
      v-pointer
      underline
      variant="wrap"
      :density="3"
      image-side="right"
      :title="d.name"
      :eyebrow="[d.role, d.shortDescription].filter(Boolean).join(' · ')"
      :meta="formatPeriod(d.startDate, d.endDate, d.isPresent)"
      :image="d.image"
      logo
      :description="d.description"
      :long-description="d.longDescription"
      :facts="[{ label: 'Location', value: d.location }]"
      :links="[{ label: 'Website', url: d.websiteUrl }, { label: 'Social', url: d.socialUrl }]"
    />
  </div>
</template>
