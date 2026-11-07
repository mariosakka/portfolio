<script setup lang="ts">
import { ref, useId } from 'vue'
import { artDefaults, useGrown } from './useGrow'
import type { ArtProps } from './types'

const props = withDefaults(defineProps<ArtProps>(), artDefaults)
const el = ref<SVGGElement | null>(null)
const { grown, isStatic, swaying } = useGrown(props, el)
const id = useId()
</script>

<template>
  <g
    ref="el"
    class="garden-art leaf"
    :class="{ 'is-grown': grown, 'is-static': isStatic, 'is-swaying': swaying }"
    :transform="`translate(${x} ${y}) rotate(${rotate}) scale(${size})`"
    :style="{ '--delay': delay + 'ms' }"
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
    <g class="pop">
      <path
        d="M0 0 C18 -22 52 -26 78 -4 C52 16 18 14 0 0Z"
        :fill="`url(#${id}-l)`"
        stroke="#4fa6ba"
        stroke-opacity=".5"
        stroke-width=".8"
      />
      <path
        d="M2 -1 C25 -6 50 -6 74 -4"
        fill="none"
        stroke="#79bccb"
        stroke-opacity=".7"
        stroke-width="1"
      />
      <path
        d="M18 -4 L30 -15 M18 -4 L30 7 M36 -5 L48 -15 M36 -5 L48 5 M54 -5 L63 -12 M54 -5 L63 2"
        fill="none"
        stroke="#79bccb"
        stroke-opacity=".45"
        stroke-width=".8"
      />
    </g>
  </g>
</template>
