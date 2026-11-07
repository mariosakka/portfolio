<script setup lang="ts">
import { computed, ref } from 'vue'
import { imageFit } from '../lib/motion'
import type { Fit } from '../lib/motion'
import { vParallax } from '../lib/useMotion'

// The one framed media area for every card image: a flat dark surface (no image-derived wash), thin border,
// rounded corners. Logos are a contained tile; 'auto' picks cover or contain from the loaded image's shape.
const props = withDefaults(defineProps<{
  src: string
  alt?: string
  fit?: Fit | 'auto'
  logo?: boolean
  // drift the image a little with scroll (large photos only)
  parallax?: boolean
}>(), { alt: '', fit: 'auto', logo: false, parallax: false })
defineSlots<{ default?(): unknown }>()

const natural = ref({ w: 0, h: 0 })
const frame = ref<HTMLElement | null>(null)
// shortcut: the frame size is read when the image loads, not on later resizes; fine while frames keep their shape.
const mode = computed<Fit>(() => {
  if (props.logo) return 'contain'
  const f = frame.value
  return imageFit(props.fit, natural.value, { w: f?.clientWidth ?? 0, h: f?.clientHeight ?? 0 })
})
function onLoad(e: Event) {
  const img = e.target as HTMLImageElement
  natural.value = { w: img.naturalWidth, h: img.naturalHeight }
}
</script>

<template>
  <figure
    ref="frame"
    class="relative flex items-center justify-center overflow-hidden rounded-[1.35rem] border border-line bg-night-900"
  >
    <img
      v-parallax="parallax"
      :src="src"
      :alt="alt"
      loading="lazy"
      :data-fit="mode"
      :class="logo
        ? 'aspect-square h-[58%] max-h-40 w-auto max-w-[70%] rounded-2xl object-contain'
        : ['absolute inset-0 h-full w-full', mode === 'cover' ? 'object-cover' : 'object-contain p-[6%]']"
      @load="onLoad"
    >
    <slot />
  </figure>
</template>
