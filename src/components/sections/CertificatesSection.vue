<script setup lang="ts">
import Carousel from '../Carousel.vue'
import HeroCard from '../HeroCard.vue'
import raw from '../../data/certificates.json'
import type { Certificate } from '../../types/data'
import { toList } from '../../lib/normalize'

const data: Certificate[] = raw
</script>

<template>
  <Carousel
    :items="data"
    label="Certificates"
    slide-class="basis-[88%] md:basis-[46%]"
  >
    <template #slide="{ item }">
      <HeroCard
        layout="stacked"
        compact
        :title="item.title"
        :eyebrow="item.issuer"
        :image="item.image"
        :short-description="item.shortDescription"
        :description="item.description"
        :long-description="item.longDescription"
        :tags="toList(item.skills)"
        :links="[{ label: 'Credential', url: item.credentialUrl }]"
      />
    </template>
  </Carousel>
</template>
