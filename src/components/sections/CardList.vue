<script setup lang="ts">
import { ref } from 'vue'
import ItemCard from '../ItemCard.vue'
import DetailModal from '../DetailModal.vue'
import type { CardItem } from '../../types/card'

defineProps<{ items: CardItem[] }>()
const current = ref<CardItem | null>(null)
const paras = (s?: string): string[] => (s || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
</script>

<template>
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    <ItemCard
      v-for="(it, i) in items"
      :key="i"
      v-bind="{ ...it, detail: undefined }"
      @open="current = it"
    />
  </div>
  <DetailModal
    :open="!!current"
    :title="current?.title || ''"
    @close="current = null"
  >
    <p
      v-for="(p, i) in paras(current?.detail)"
      :key="i"
      class="mb-3 whitespace-pre-line"
    >
      {{ p }}
    </p>
  </DetailModal>
</template>
