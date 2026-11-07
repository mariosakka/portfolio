<script setup lang="ts">
import type { Component } from 'vue'
import SectionBlock from './components/SectionBlock.vue'
import GardenHero from './components/GardenHero.vue'
import SiteNav from './components/SiteNav.vue'
import SiteFooter from './components/SiteFooter.vue'
import AboutSection from './components/sections/AboutSection.vue'
import SkillsSection from './components/sections/SkillsSection.vue'
import ExperienceSection from './components/sections/ExperienceSection.vue'
import ProjectsSection from './components/sections/ProjectsSection.vue'
import EducationSection from './components/sections/EducationSection.vue'
import CertificatesSection from './components/sections/CertificatesSection.vue'
import OrganizationsSection from './components/sections/OrganizationsSection.vue'
import ContactSection from './components/sections/ContactSection.vue'

interface Section {
  id: string
  label: string
  body: Component
}

const sections: Section[] = [
  { id: 'about', label: 'About', body: AboutSection },
  { id: 'skills', label: 'Skills', body: SkillsSection },
  { id: 'experience', label: 'Experience', body: ExperienceSection },
  { id: 'projects', label: 'Projects', body: ProjectsSection },
  { id: 'education', label: 'Education', body: EducationSection },
  { id: 'certificates', label: 'Certificates', body: CertificatesSection },
  { id: 'organizations', label: 'Organizations', body: OrganizationsSection },
  { id: 'contact', label: 'Contact', body: ContactSection },
]
</script>

<template>
  <div
    id="app-root"
    class="relative isolate"
  >
    <GardenHero />
    <header class="mx-auto max-w-5xl px-4 pt-16 sm:px-8">
      <h1
        data-page-top
        class="font-serif text-4xl sm:text-5xl"
      >
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
      >
        <component :is="s.body" />
      </SectionBlock>
    </main>
    <SiteFooter :sections="sections" />
  </div>
</template>
