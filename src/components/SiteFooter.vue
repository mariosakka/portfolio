<script setup lang="ts">
import aboutJson from '../data/about.json'
import type { About } from '../types/data'

defineProps<{ sections: { id: string; label: string }[] }>()

const { fullName, contact }: About = aboutJson
const repo = 'https://github.com/mariosakka/portfolio'
const prefix: Record<string, string> = {
  Email: 'mailto:',
  GitHub: 'https://github.com/',
  LinkedIn: 'https://www.linkedin.com/in/',
}
// Phone is deliberately not listed: it is not in `prefix`.
const elsewhere = contact.methods.filter((m) => m.value && prefix[m.type])
const year = new Date().getFullYear()
const version = __APP_VERSION__

function toTop() {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  // App.vue marks the page heading with data-page-top; without it we only scroll.
  const top = document.querySelector<HTMLElement>('[data-page-top]')
  top?.setAttribute('tabindex', '-1')
  top?.focus({ preventScroll: true })
}

const link =
  'flex items-center [@media(pointer:coarse)]:min-h-11 text-ink/70 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
</script>

<template>
  <footer class="mt-24 border-t border-line pb-[env(safe-area-inset-bottom)] font-sans text-sm text-ink/70">
    <div class="mx-auto max-w-5xl px-4 pt-14 sm:px-10 lg:px-14">
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_1fr_1fr]">
        <div class="min-w-0 sm:col-span-2 lg:col-span-1">
          <p class="font-serif text-3xl leading-tight text-ink sm:text-4xl">
            Thanks for wandering through.
          </p>
          <p class="mt-3 text-accent">
            {{ fullName }}
          </p>
        </div>
        <nav aria-label="Footer">
          <h2 class="text-xs uppercase tracking-[0.18em] text-ink/60">
            Navigate
          </h2>
          <ul class="mt-3">
            <li
              v-for="s in sections"
              :key="s.id"
            >
              <a
                :href="`#${s.id}`"
                :class="link"
                class="py-1"
              >{{ s.label }}</a>
            </li>
          </ul>
        </nav>
        <div>
          <h2 class="text-xs uppercase tracking-[0.18em] text-ink/60">
            Elsewhere
          </h2>
          <ul class="mt-3">
            <li
              v-for="m in elsewhere"
              :key="m.id"
            >
              <a
                :href="prefix[m.type] + m.value"
                :class="link"
                class="py-1"
              >{{ m.type }}</a>
            </li>
          </ul>
        </div>
      </div>
      <button
        type="button"
        class="mt-10 inline-flex items-center gap-2 min-h-11 rounded-full border border-line px-5 text-ink/80 transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        @click="toTop"
      >
        <span aria-hidden="true">&uarr;</span> Back to top
      </button>
      <div class="mt-10 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-line py-6 text-xs text-ink/60">
        <p>&copy; {{ year }} {{ fullName }}</p>
        <a
          :href="`${repo}/releases`"
          target="_blank"
          rel="noopener noreferrer"
          :class="link"
        >v{{ version }}<span class="sr-only"> release notes (opens in a new tab)</span></a>
        <a
          :href="repo"
          target="_blank"
          rel="noopener noreferrer"
          :class="link"
        >Source<span class="sr-only"> on GitHub (opens in a new tab)</span></a>
      </div>
    </div>
  </footer>
</template>
