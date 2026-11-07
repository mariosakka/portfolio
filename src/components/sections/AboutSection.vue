<script setup>
import about from '../../data/about.json'
import CommitBadge from '../CommitBadge.vue'
</script>

<template>
  <div class="grid gap-8 text-[#e4edff] md:grid-cols-[14rem_1fr]">
    <img
      v-if="about.photo"
      :src="about.photo"
      :alt="about.fullName"
      class="w-56 rounded-2xl object-cover"
    >
    <div class="min-w-0 space-y-4">
      <h3 class="font-serif text-2xl">
        {{ about.fullName }}
      </h3>
      <p class="opacity-80">
        {{ [about.role, about.location].filter(Boolean).join(' - ') }}
      </p>
      <p class="whitespace-pre-line">
        {{ about.description }}
      </p>
      <ul
        aria-label="Skills"
        class="flex flex-wrap gap-2"
      >
        <li
          v-for="s in about.skills"
          :key="s"
          class="rounded-full border border-[rgba(127,176,255,.3)] px-2 py-0.5 text-xs"
        >
          {{ s }}
        </li>
      </ul>
      <p class="text-sm opacity-80">
        Languages: {{ about.languages.join(', ') }}
      </p>
      <CommitBadge />
    </div>
  </div>
</template>
