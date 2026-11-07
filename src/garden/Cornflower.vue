<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, useId } from 'vue'
import { artProps, useGrown } from './useGrow.js'

const props = defineProps(artProps)
const el = ref(null)
const grown = useGrown(props, el)
const id = useId()
const angles = Array.from({ length: 12 }, (_, i) => i * 30)
</script>

<template>
  <g
    ref="el"
    class="garden-art cornflower"
    :class="{ 'is-grown': grown, 'is-static': isStatic }"
    :transform="`translate(${x} ${y}) rotate(${rotate}) scale(${size})`"
    :style="{ '--delay': delay + 'ms' }"
  >
    <defs>
      <radialGradient :id="`${id}-g`">
        <stop
          offset="0"
          stop-color="#6aa8ff"
          stop-opacity=".5"
        />
        <stop
          offset="1"
          stop-color="#6aa8ff"
          stop-opacity="0"
        />
      </radialGradient>
    </defs>
    <circle
      r="40"
      :fill="`url(#${id}-g)`"
      class="glow"
    />
    <g class="sway">
      <g
        stroke="#a9ccff"
        stroke-width=".9"
        stroke-linecap="round"
        fill="#3b78f0"
        fill-opacity=".8"
      >
        <g
          v-for="(a, i) in angles"
          :key="a"
          :transform="`rotate(${a})`"
        >
          <path
            class="petal"
            :style="{ '--i': i }"
            d="M0 -4 C-3 -12 -3 -22 0 -28 C3 -22 3 -12 0 -4Z"
          />
        </g>
      </g>
      <circle
        r="5"
        fill="#16307a"
      />
    </g>
  </g>
</template>
