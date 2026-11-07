<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ sections: { id: string; label: string }[] }>()
const active = ref('')
let observer: IntersectionObserver | undefined

onMounted(() => {
  // Without IntersectionObserver (e.g. jsdom) no link is highlighted.
  if (typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    (entries) => {
      const hit = entries.find((e) => e.isIntersecting)
      if (hit) active.value = hit.target.id
    },
    { rootMargin: '-40% 0px -55% 0px' },
  )
  props.sections.forEach(({ id }) => {
    const el = document.getElementById(id)
    if (el) observer?.observe(el)
  })
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <nav
    class="nav-bleed sticky top-0 z-10 border-b border-accent/20 bg-night-950/90 backdrop-blur"
    aria-label="Sections"
  >
    <ul class="nav-scroll mx-auto flex max-w-5xl gap-2 overflow-x-auto whitespace-nowrap px-2 font-sans text-sm sm:px-6">
      <li
        v-for="s in sections"
        :key="s.id"
      >
        <a
          :href="`#${s.id}`"
          :aria-current="active === s.id ? 'true' : undefined"
          class="flex [@media(pointer:coarse)]:min-h-11 items-center px-2 transition-colors hover:text-accent"
          :class="active === s.id ? 'text-accent' : 'text-ink/70'"
        >{{ s.label }}</a>
      </li>
    </ul>
  </nav>
</template>
