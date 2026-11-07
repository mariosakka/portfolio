<script setup>
import { watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
})
const emit = defineEmits(['close'])

let opener = null
const onKey = (e) => { if (e.key === 'Escape') emit('close') }

function lock() {
  opener = document.activeElement
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKey)
}
function unlock() {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKey)
  opener?.focus?.()
  opener = null
}

watch(() => props.open, (v) => (v ? lock() : unlock()), { immediate: true })
onBeforeUnmount(() => { if (props.open) unlock() })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      data-backdrop
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3"
      @click.self="emit('close')"
    >
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[rgba(127,176,255,.3)] bg-[#0b1f4a] p-5 text-[#e4edff]"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <h2 class="font-serif text-2xl">
            {{ title }}
          </h2>
          <button
            type="button"
            aria-label="Close"
            class="text-[#4f8bff]"
            @click="emit('close')"
          >
            &times;
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
