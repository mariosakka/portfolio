<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { lockScroll, unlockScroll } from '../lib/scrollLock'

const props = withDefaults(defineProps<{ open?: boolean; title: string }>(), { open: false })
const emit = defineEmits<{ close: [] }>()

let opener: HTMLElement | null = null
let locked = false // this instance owns one lock count
const box = ref<HTMLElement | null>(null)
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') return emit('close')
  if (e.key !== 'Tab' || !box.value) return
  const f = [...box.value.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')]
    .filter((el) => !el.matches(':disabled') && !(el instanceof HTMLInputElement && el.type === 'hidden') && el.tabIndex >= 0)
  if (!box.value.contains(document.activeElement)) {
    e.preventDefault()
    return (f[0] ?? box.value).focus()
  }
  if (!f.length) return e.preventDefault()
  const first = f[0]
  const last = f[f.length - 1]
  if (e.shiftKey && (document.activeElement === first || document.activeElement === box.value)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

function lock() {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  if (!locked) { locked = true; lockScroll() }
  document.addEventListener('keydown', onKey)
  nextTick(() => box.value?.focus())
}
function unlock() {
  if (locked) { locked = false; unlockScroll() }
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
      class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      @click.self="emit('close')"
    >
      <div
        ref="box"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        class="modal-box w-full max-w-2xl overflow-y-auto rounded-2xl outline-none border border-line bg-night-900 p-5 text-ink"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <h2 class="font-serif text-2xl">
            {{ title }}
          </h2>
          <button
            type="button"
            aria-label="Close"
            class="-mr-3 -mt-3 flex h-11 w-11 shrink-0 items-center justify-center text-3xl leading-none text-accent"
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
