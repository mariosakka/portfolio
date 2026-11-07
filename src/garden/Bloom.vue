<script setup lang="ts">
import { ref, useId } from 'vue'
import { artDefaults, useGrown } from './useGrow'
import type { ArtProps } from './types'

const props = withDefaults(defineProps<ArtProps>(), artDefaults)
const el = ref<SVGGElement | null>(null)
const { grown, isStatic, swaying } = useGrown(props, el)
const id = useId()
const petals = [0, 72, 144, 216, 288]
const stamens = [[0, -20], [14, -14], [20, 0], [14, 14], [-14, 14], [-20, 0], [-14, -14]]
const PETAL = 'M0 0 C-16 -18 -18 -52 0 -70 C18 -52 16 -18 0 0Z'
</script>

<template>
  <g
    ref="el"
    class="garden-art bloom"
    :class="{ 'is-grown': grown, 'is-static': isStatic, 'is-swaying': swaying }"
    :transform="`translate(${x} ${y}) rotate(${rotate}) scale(${size})`"
    :style="{ '--delay': delay + 'ms' }"
  >
    <defs>
      <radialGradient
        :id="`${id}-a`"
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
      <radialGradient
        :id="`${id}-b`"
        cx="50%"
        cy="100%"
        r="100%"
      >
        <stop
          offset="0"
          stop-color="#14307f"
        />
        <stop
          offset=".6"
          stop-color="#2f66d8"
        />
        <stop
          offset="1"
          stop-color="#7fb0ff"
        />
      </radialGradient>
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
      r="95"
      :fill="`url(#${id}-g)`"
      class="glow"
    />
    <g class="sway">
      <!-- back layer, offset 36deg -->
      <g
        :fill="`url(#${id}-b)`"
        stroke="#9cc4ff"
        stroke-opacity=".5"
        stroke-width=".8"
        transform="rotate(36)"
      >
        <g
          v-for="(a, i) in petals"
          :key="'b' + a"
          :transform="`rotate(${a})`"
        >
          <g
            class="petal"
            :style="{ '--i': i }"
          >
            <path :d="PETAL" />
          </g>
        </g>
      </g>
      <!-- front layer with veins -->
      <g
        :fill="`url(#${id}-a)`"
        stroke="#d6e8ff"
        stroke-opacity=".7"
        stroke-width=".9"
      >
        <g
          v-for="(a, i) in petals"
          :key="'f' + a"
          :transform="`rotate(${a})`"
        >
          <g
            class="petal"
            :style="{ '--i': i + 5 }"
          >
            <path :d="PETAL" />
            <g
              fill="none"
              stroke="#e9f2ff"
              stroke-opacity=".55"
              stroke-width=".8"
              stroke-linecap="round"
            >
              <path d="M0 -4 L0 -62" />
              <path d="M0 -20 L-7 -42 M0 -20 L7 -42 M0 -36 L-5 -52 M0 -36 L5 -52" />
            </g>
          </g>
        </g>
      </g>
      <circle
        r="11"
        fill="#0d1f5c"
      />
      <g
        stroke="#fde9a8"
        stroke-width="1.2"
        stroke-linecap="round"
      >
        <path
          v-for="s in stamens"
          :key="s.join()"
          :d="`M0 0 L${s[0]} ${s[1]}`"
        />
      </g>
      <g fill="#ffd96b">
        <circle
          v-for="s in stamens"
          :key="s.join()"
          :cx="s[0]"
          :cy="s[1]"
          r="2.6"
        />
      </g>
    </g>
  </g>
</template>
