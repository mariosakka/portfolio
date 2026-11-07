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
    class="garden-art bud"
    :class="{ 'is-grown': grown, 'is-static': isStatic, 'is-swaying': swaying }"
    :transform="`translate(${x} ${y}) rotate(${rotate}) scale(${size})`"
    :style="{ '--delay': delay + 'ms' }"
  >
    <defs>
      <radialGradient
        :id="`${id}-p`"
        cx="50%"
        cy="100%"
        r="100%"
      >
        <stop
          offset="0"
          stop-color="#2a3f86"
        />
        <stop
          offset=".55"
          stop-color="#4b79cc"
        />
        <stop
          offset="1"
          stop-color="#a9bfdc"
        />
      </radialGradient>
    </defs>
    <g class="pop">
      <path
        d="M0 0 C-12 -14 -10 -34 0 -46 C10 -34 12 -14 0 0Z"
        :fill="`url(#${id}-p)`"
        stroke="#bccce4"
        stroke-opacity=".6"
        stroke-width=".8"
      />
      <path
        d="M0 -4 L0 -38"
        stroke="#d3deee"
        stroke-opacity=".4"
        stroke-width=".8"
      />
      <path
        d="M0 2 C-10 -4 -12 -14 -8 -22 C-4 -14 0 -8 0 2Z M0 2 C10 -4 12 -14 8 -22 C4 -14 0 -8 0 2Z"
        fill="#1d6577"
        stroke="#4fa6ba"
        stroke-opacity=".5"
        stroke-width=".7"
      />
    </g>
  </g>
</template>
