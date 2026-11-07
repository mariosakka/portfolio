import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'

export const GROWN_KEY = 'garden-grown'

export function useGrow(el, { once = true, threshold = 0.2 } = {}) {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const grown = ref(Boolean(reduce) || typeof IntersectionObserver === 'undefined')
  let io
  onMounted(() => {
    if (grown.value || !el.value) return
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) grown.value = true
        else if (!once) grown.value = false
      }
    }, { threshold })
    io.observe(el.value)
  })
  onBeforeUnmount(() => io?.disconnect())
  return grown
}

// Shared by art components: explicit `grown` prop wins, then a parent Vine, then own visibility.
export function useGrown(props, el) {
  const parent = inject(GROWN_KEY, null)
  const own = useGrow(el)
  return computed(() => props.grown ?? parent?.value ?? own.value)
}

export const artProps = {
  grown: { type: Boolean, default: undefined },
  size: { type: Number, default: 1 },
  delay: { type: Number, default: 0 },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  rotate: { type: Number, default: 0 },
  isStatic: { type: Boolean, default: false },
}
