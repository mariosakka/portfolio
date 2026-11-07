<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ sections: { id: string; label: string }[] }>()
const active = ref('')
const nav = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | undefined
let resize: ResizeObserver | undefined

// Progressive enhancement over the plain #id anchors: a section that fits below the nav is centered on
// screen, a taller one starts just below the nav (via scroll-margin). The hash is kept, and focus moves to
// the section heading for keyboard and screen reader users. Modified clicks (new tab etc.) stay native.
function go(e: MouseEvent, id: string) {
  const el = document.getElementById(id)
  if (!el || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  const navH = nav.value?.getBoundingClientRect().height ?? 0
  const fits = el.getBoundingClientRect().height <= window.innerHeight - navH + 1
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ block: fits ? 'center' : 'start', behavior: reduced ? 'instant' : 'smooth' })
  history.replaceState(null, '', `#${id}`)
  const h = el.querySelector<HTMLElement>('h2')
  if (h) {
    h.tabIndex = -1
    h.focus({ preventScroll: true })
  }
  active.value = id
}

// The real nav height feeds --nav-h, the section budget in style.css (it changes with pointer type and zoom).
function measureNav() {
  if (nav.value) document.documentElement.style.setProperty('--nav-h', `${nav.value.getBoundingClientRect().height}px`)
}

onMounted(() => {
  measureNav()
  if (typeof ResizeObserver !== 'undefined' && nav.value) {
    resize = new ResizeObserver(measureNav)
    resize.observe(nav.value)
  }
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

onBeforeUnmount(() => {
  observer?.disconnect()
  resize?.disconnect()
})
</script>

<template>
  <nav
    ref="nav"
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
          @click="go($event, s.id)"
        >{{ s.label }}</a>
      </li>
    </ul>
  </nav>
</template>
