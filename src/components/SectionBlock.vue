<script setup>
import { Vine } from '../garden'

defineProps({ id: { type: String, required: true }, title: { type: String, required: true } })
</script>

<template>
  <section
    :id="id"
    class="mx-auto max-w-5xl scroll-mt-20 px-4 py-16 sm:px-8"
  >
    <h2 class="mb-2 font-serif text-3xl text-ink sm:text-4xl">
      {{ title }}
    </h2>
    <Vine
      path="M2 12 C30 2 60 20 90 10 S130 6 158 12"
      view-box="0 0 160 24"
      :duration="1400"
      class="mb-6 !w-40"
    />
    <slot />
  </section>
</template>
