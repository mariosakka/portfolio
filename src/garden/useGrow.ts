import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { ArtProps, GardenContext, GrowOptions } from './types'

export const GROWN_KEY: InjectionKey<GardenContext> = Symbol('garden-grown')

export function useGrow(el: Ref<Element | null>, { once = true, threshold = 0.2 }: GrowOptions = {}): Ref<boolean> {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const grown = ref(Boolean(reduce) || typeof IntersectionObserver === 'undefined')
  let io: IntersectionObserver | undefined
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

export interface GrownState {
  grown: ComputedRef<boolean>
  isStatic: ComputedRef<boolean>
  swaying: ComputedRef<boolean>
}

// Shared by art components: explicit props win, then a parent Vine (which owns the single
// observer), then own visibility.
export function useGrown(props: Pick<ArtProps, 'grown' | 'isStatic'>, el: Ref<Element | null>): GrownState {
  const parent = inject(GROWN_KEY, null)
  const own = parent ? null : useGrow(el)
  const grown = computed(() => props.grown ?? parent?.grown.value ?? own?.value ?? false)
  const isStatic = computed(() => props.isStatic || Boolean(parent?.isStatic.value))
  const swaying = computed(() => grown.value && !isStatic.value)
  return { grown, isStatic, swaying }
}

// `grown: undefined` is deliberate: an absent Boolean prop must stay undefined (not false) so it can inherit.
export const artDefaults = { grown: undefined, size: 1, delay: 0, x: 0, y: 0, rotate: 0, isStatic: false }
