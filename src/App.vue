<script setup>
import SectionBlock from './components/SectionBlock.vue'
import SiteNav from './components/SiteNav.vue'
import AboutSection from './components/sections/AboutSection.vue'
import ExperienceSection from './components/sections/ExperienceSection.vue'
import ProjectsSection from './components/sections/ProjectsSection.vue'
import EducationSection from './components/sections/EducationSection.vue'
import CertificatesSection from './components/sections/CertificatesSection.vue'
import OrganizationsSection from './components/sections/OrganizationsSection.vue'
import ContactSection from './components/sections/ContactSection.vue'

const sections = [
  { id: 'about', label: 'About', body: AboutSection },
  { id: 'experience', label: 'Experience', body: ExperienceSection },
  { id: 'projects', label: 'Projects', body: ProjectsSection },
  { id: 'education', label: 'Education', body: EducationSection },
  { id: 'certificates', label: 'Certificates', body: CertificatesSection },
  { id: 'organizations', label: 'Organizations', body: OrganizationsSection },
  { id: 'contact', label: 'Contact', body: ContactSection },
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
      >
        <component :is="s.body" />
      </SectionBlock>
    </main>
  </div>
</template>
