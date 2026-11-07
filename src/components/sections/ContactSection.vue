<script setup>
import { contact } from '../../data/about.json'

const prefix = {
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
    <ul class="mt-6 flex flex-wrap gap-4">
      <li
        v-for="m in methods"
        :key="m.id"
      >
        <a
          :href="prefix[m.type] + m.value"
          class="text-[#4f8bff] underline"
        >{{ m.type }}</a>
      </li>
    </ul>
  </div>
</template>
