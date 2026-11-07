<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, useId } from 'vue'
import { artProps, useGrown } from './useGrow.js'

const props = defineProps(artProps)
const el = ref(null)
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
          stop-color="#1e3fa8"
        />
        <stop
          offset=".55"
          stop-color="#4f8bff"
        />
        <stop
          offset="1"
          stop-color="#bcd8ff"
        />
      </radialGradient>
    </defs>
    <g class="pop">
      <path
        d="M0 0 C-12 -14 -10 -34 0 -46 C10 -34 12 -14 0 0Z"
        :fill="`url(#${id}-p)`"
        stroke="#d6e8ff"
        stroke-opacity=".6"
        stroke-width=".8"
      />
      <path
        d="M0 -4 L0 -38"
        stroke="#e9f2ff"
        stroke-opacity=".4"
        stroke-width=".8"
      />
      <path
        d="M0 2 C-10 -4 -12 -14 -8 -22 C-4 -14 0 -8 0 2Z M0 2 C10 -4 12 -14 8 -22 C4 -14 0 -8 0 2Z"
        fill="#1f7a8f"
        stroke="#5fd0e8"
        stroke-opacity=".5"
        stroke-width=".7"
      />
    </g>
  </g>
</template>
