<script setup>
import SectionBlock from './components/SectionBlock.vue'
import SiteNav from './components/SiteNav.vue'

const sections = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'organizations', label: 'Organizations' },
  { id: 'contact', label: 'Contact' },
]
</script>

<template>
  <div id="app-root">
    <header class="mx-auto max-w-5xl px-4 pt-16 sm:px-8">
      <h1 class="font-serif text-4xl sm:text-5xl">
        Mohamad-Mario Sakka
      </h1>
    </header>
    <SiteNav :sections="sections" />
    <main>
      <SectionBlock
        v-for="s in sections"
        :id="s.id"
        :key="s.id"
        :title="s.label"
      />
    </main>
  </div>
</template>
