<script setup lang="ts">
import { ref } from 'vue'
import HeroCard from '../HeroCard.vue'
import raw from '../../data/experience.json'
import type { Experience } from '../../types/data'
import { formatPeriod, toList } from '../../lib/normalize'
import { stepIndex } from '../../lib/motion'
import { vPointer, vReveal } from '../../lib/useMotion'

const data: Experience[] = raw
const sel = ref(0)
const tabs = ref<HTMLButtonElement[]>([])

// Tabs pattern: arrows (either orientation, wrapping), Home and End move selection and focus.
function onKey(e: KeyboardEvent) {
  const i = stepIndex(e.key, sel.value, data.length)
  if (i === null) return
  e.preventDefault()
  sel.value = i
  tabs.value[i]?.focus()
}
</script>

<template>
  <!-- Timeline: period markers on a rail (vertical beside the card from md, a horizontal stepper above it on
       phones); the selected role's detail card swaps with a short slide-up cross-fade. -->
  <div
    v-reveal="'slide'"
    class="grid gap-4 md:grid-cols-[minmax(0,12.5rem)_minmax(0,1fr)] md:items-center md:gap-10"
  >
    <div
      role="tablist"
      aria-label="Roles"
      class="relative flex gap-3 md:flex-col md:gap-8"
      @keydown="onKey"
    >
      <span
        aria-hidden="true"
        class="absolute left-3 right-3 top-3 h-px bg-line md:bottom-3 md:right-auto md:h-auto md:w-px"
      />
      <button
        v-for="(d, i) in data"
        :id="`exp-tab-${i}`"
        :key="d.id"
        ref="tabs"
        role="tab"
        type="button"
        :aria-selected="sel === i"
        aria-controls="exp-panel"
        :tabindex="sel === i ? 0 : -1"
        class="group relative min-w-0 flex-1 rounded-xl pt-8 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:flex-none md:pl-10 md:pt-0"
        @click="sel = i"
      >
        <span
          aria-hidden="true"
          class="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border bg-night-950 transition-colors"
          :class="sel === i ? 'border-accent' : 'border-line group-hover:border-accent/60'"
        >
          <span
            class="h-2.5 w-2.5 rounded-full bg-accent transition-transform duration-300 motion-reduce:transition-none"
            :class="sel === i ? 'scale-100' : 'scale-0'"
          />
        </span>
        <span class="block text-[0.7rem] uppercase tracking-[0.14em] text-accent">{{ formatPeriod(d.startDate, d.endDate, d.isPresent) }}</span>
        <span
          class="mt-1 block font-serif text-lg leading-tight transition-colors md:text-xl"
          :class="sel === i ? 'text-ink' : 'text-ink/60 group-hover:text-ink/85'"
        >{{ d.title }}</span>
        <span class="mt-0.5 hidden text-sm text-ink/55 md:block">{{ d.company }}</span>
      </button>
    </div>
    <div
      id="exp-panel"
      role="tabpanel"
      :aria-labelledby="`exp-tab-${sel}`"
      class="relative min-w-0"
    >
      <Transition
        name="swap"
        mode="out-in"
      >
        <div
          :key="sel"
          class="flex"
        >
          <HeroCard
            v-pointer
            :title="data[sel].title"
            :eyebrow="data[sel].company"
            :meta="formatPeriod(data[sel].startDate, data[sel].endDate, data[sel].isPresent)"
            :image="data[sel].image"
            logo
            :short-description="data[sel].shortDescription"
            :description="data[sel].description"
            :long-description="data[sel].longDescription"
            :facts="[{ label: 'Location', value: data[sel].location }]"
            :tags="toList(data[sel].technologies)"
            :links="[{ label: 'Website', url: data[sel].websiteUrl }]"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>
