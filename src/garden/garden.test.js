import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { useGrow, Vine, Bloom, Leaf } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))

function mockMedia(reduce) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce })
}
let observer
function mockIO() {
  globalThis.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; observer = this }
    observe() {}
    disconnect() {}
    fire(isIntersecting) { this.cb([{ isIntersecting }]) }
  }
}
function probe(opts) {
  let grown
  const C = defineComponent({
    setup() { const el = ref(null); grown = useGrow(el, opts); return () => h('div', { ref: el }) },
  })
  mount(C)
  return () => grown.value
}

afterEach(() => { delete globalThis.IntersectionObserver; observer = undefined })

describe('useGrow', () => {
  it('is true immediately with reduced motion', () => {
    mockMedia(true); mockIO()
    expect(probe()()).toBe(true)
  })
  it('is true when IntersectionObserver is missing', () => {
    mockMedia(false)
    expect(probe()()).toBe(true)
  })
  it('waits for intersection', async () => {
    mockMedia(false); mockIO()
    const g = probe()
    expect(g()).toBe(false)
    observer.fire(true); await nextTick()
    expect(g()).toBe(true)
  })
  it('once:true stays true after leaving; otherwise toggles', async () => {
    mockMedia(false); mockIO()
    const g = probe({ once: true })
    observer.fire(true); observer.fire(false)
    expect(g()).toBe(true)
    const g2 = probe({ once: false })
    observer.fire(true); observer.fire(false)
    expect(g2()).toBe(false)
  })
})

describe('components', () => {
  it('Vine renders its path and is-grown only after growth', async () => {
    mockMedia(false); mockIO()
    const w = mount(Vine, { props: { path: 'M0 0 L10 10' }, slots: { default: () => h(Leaf) } })
    expect(w.find('path.vine-stem').attributes('d')).toBe('M0 0 L10 10')
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    expect(w.classes()).not.toContain('is-grown')
    observer.fire(true); await nextTick()
    expect(w.classes()).toContain('is-grown')
    expect(w.find('.leaf').classes()).toContain('is-grown')
  })
  it('is-static shows everything and reduced motion renders grown', () => {
    mockMedia(false); mockIO()
    expect(mount(Vine, { props: { path: 'M0 0', isStatic: true } }).classes()).toContain('is-static')
    mockMedia(true)
    expect(mount(Bloom, { attrs: {} }).classes()).toContain('is-grown')
  })
})

describe('garden folder rules', () => {
  const files = readdirSync(here).filter((f) => /\.(vue|js|css)$/.test(f) && f !== 'garden.test.js')
  it('has no imports from outside src/garden except vue', () => {
    for (const f of files) {
      const src = readFileSync(join(here, f), 'utf8')
      for (const m of src.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
        const spec = m[1]
        expect(spec === 'vue' || (spec.startsWith('./') && !spec.includes('..')), `${f}: ${spec}`).toBe(true)
      }
    }
  })
  it('uses no Tailwind', () => {
    for (const f of files) {
      const src = readFileSync(join(here, f), 'utf8')
      expect(src, f).not.toMatch(/@apply|@tailwind|\btw-[\w-]+|class="[^"]*\b(?:flex|px-\d|py-\d|text-(?:sm|lg|xl)|bg-\w+-\d{3})\b/)
    }
  })
})
