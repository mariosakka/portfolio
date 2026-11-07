import type { Ref } from 'vue'

/** Options for `useGrow`. */
export interface GrowOptions {
  /** Stay grown once visible (default true). */
  once?: boolean
  /** IntersectionObserver threshold (default 0.2). */
  threshold?: number
}

/** Props shared by Bloom, Cornflower, Bud and Leaf (each renders an SVG `<g>`). */
export interface ArtProps {
  /** Override growth; default inherits the parent Vine, else the element's own visibility. */
  grown?: boolean
  /** Scale. */
  size?: number
  /** Animation delay in ms. */
  delay?: number
  x?: number
  y?: number
  /** Degrees. */
  rotate?: number
  /** Fully visible, no animation. */
  isStatic?: boolean
}

/** Props of Vine, the `<svg>` that grows along `path` and drives its children. */
export interface VineProps {
  /** SVG path `d`. */
  path: string
  /** Stem growth in ms (default 2400). */
  duration?: number
  grown?: boolean
  /** Width as a multiple of the parent width (default 1). */
  size?: number
  delay?: number
  /** Default `0 0 400 600`. */
  viewBox?: string
  isStatic?: boolean
}

/** What a Vine provides to the art components inside it. */
export interface GardenContext {
  grown: Readonly<Ref<boolean>>
  isStatic: Readonly<Ref<boolean>>
}
