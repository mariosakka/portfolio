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
const email = methods.find((m) => m.type === 'Email')
const others = methods.filter((m) => m !== email)
</script>

<template>
  <div class="relative overflow-hidden rounded-[1.75rem] border border-line bg-surface p-6 text-ink sm:p-10 lg:p-14">
    <div class="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
      <div class="min-w-0">
        <h3 class="font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          {{ contact.title }}
        </h3>
        <p class="mt-4 max-w-prose text-lg text-ink/75">
          {{ contact.subtitle }}
        </p>
        <a
          v-if="email"
          :href="prefix[email.type] + email.value"
          class="group mt-8 inline-flex max-w-full flex-col gap-1 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span class="text-xs uppercase tracking-[0.18em] text-accent">Email me</span>
          <span class="flex items-center gap-3 font-serif text-xl text-ink sm:text-[1.75rem]">
            <span class="min-w-0 underline decoration-accent/40 decoration-1 underline-offset-[6px] transition-colors [overflow-wrap:anywhere] group-hover:decoration-accent">{{ email.value.split('@')[0] }}<template v-if="email.value.includes('@')">@<wbr>{{ email.value.split('@')[1] }}</template></span>
            <span
              aria-hidden="true"
              class="shrink-0 text-accent transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
            >&rarr;</span>
          </span>
        </a>
      </div>
      <ul class="self-end border-t border-line">
        <li
          v-for="m in others"
          :key="m.id"
          class="border-b border-line"
        >
          <a
            :href="prefix[m.type] + m.value"
            class="group flex min-h-14 items-center justify-between gap-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span class="min-w-0">
              <span class="block text-xs uppercase tracking-[0.18em] text-ink/50">{{ m.type }}</span>
              <span class="block truncate text-ink/90 transition-colors group-hover:text-accent">{{ m.value }}</span>
            </span>
            <span
              aria-hidden="true"
              class="text-accent transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
            >&rarr;</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
