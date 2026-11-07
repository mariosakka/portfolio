<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { LEAF } from './flowers'
import { easeOut, useGrowthTimeline } from './timeline'
import { artDefaults, useGrown } from './useGrow'
import type { ArtProps } from './types'

// A leaf with its base at (x, y): put it on an anchor. Unfurls from the base through the shared timeline hook.
const props = withDefaults(defineProps<ArtProps>(), artDefaults)
const el = ref<SVGGElement | null>(null)
const { grown, isStatic } = useGrown(props, el)
const id = useId()
const timeline = useGrowthTimeline(grown, { duration: 1100, delay: props.delay, isStatic })
const s = computed(() => easeOut(timeline.value))
</script>

<template>
  <g
    ref="el"
    class="g-art g-leaf"
    :class="{ 'g-is-grown': grown, 'g-is-static': isStatic }"
    :transform="`translate(${x} ${y}) rotate(${rotate}) scale(${size})`"
  >
    <defs>
      <linearGradient
        :id="`${id}-l`"
        x1="0"
        y1="0"
        x2="1"
        y2="1"
      >
        <stop
          offset="0"
          stop-color="#26788d"
        />
        <stop
          offset="1"
          stop-color="#0e3e56"
        />
      </linearGradient>
    </defs>
    <g
      class="g-leaf-body"
      :style="{ transform: `scale(${s})`, opacity: s > 0 ? 1 : 0 }"
    >
      <path
        :d="LEAF.d"
        :fill="`url(#${id}-l)`"
        stroke="#4fa6ba"
        stroke-opacity=".5"
        stroke-width=".8"
      />
      <path
        :d="LEAF.midrib"
        fill="none"
        stroke="#79bccb"
        stroke-opacity=".7"
        stroke-width="1"
      />
      <path
        :d="LEAF.veins"
        fill="none"
        stroke="#79bccb"
        stroke-opacity=".45"
        stroke-width=".8"
      />
    </g>
  </g>
</template>
