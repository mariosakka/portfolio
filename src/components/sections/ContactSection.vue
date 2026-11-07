<script setup lang="ts">
import aboutJson from '../../data/about.json'
import type { About } from '../../types/data'

const { contact }: About = aboutJson
const prefix: Record<string, string> = {
  Email: 'mailto:',
  Phone: 'tel:',
  GitHub: 'https://github.com/',
  LinkedIn: 'https://www.linkedin.com/in/',
}
const methods = contact.methods.filter((m) => m.value && prefix[m.type])
</script>

<template>
  <div class="text-[#e4edff]">
    <h3 class="font-serif text-2xl">
      {{ contact.title }}
    </h3>
    <p class="mt-2 opacity-80">
      {{ contact.subtitle }}
    </p>
    <ul class="mt-4 flex flex-wrap gap-x-4">
      <li
        v-for="m in methods"
        :key="m.id"
      >
        <a
          :href="prefix[m.type] + m.value"
          class="inline-flex [@media(pointer:coarse)]:min-h-11 items-center text-[#4f8bff] underline"
        >{{ m.type }}</a>
      </li>
    </ul>
  </div>
</template>
