<script setup>
defineProps({ id: { type: String, required: true }, title: { type: String, required: true } })
</script>

<template>
  <section
    :id="id"
    class="mx-auto max-w-5xl scroll-mt-20 px-4 py-16 sm:px-8"
  >
    <h2 class="mb-8 font-serif text-3xl text-ink sm:text-4xl">
      {{ title }}
    </h2>
    <slot />
  </section>
</template>
