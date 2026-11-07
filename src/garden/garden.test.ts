import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { useGrow, Vine, Bloom, Leaf, Bud } from './index'
import type { GrowOptions } from './index'

const here = dirname(fileURLToPath(import.meta.url))

function mockMedia(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce })
}
class MockIO {
  private cb: (entries: { isIntersecting: boolean }[]) => void
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void) { this.cb = cb; instances.push(this) }
  observe() {}
  disconnect() {}
  fire(isIntersecting: boolean) { this.cb([{ isIntersecting }]) }
}
const instances: MockIO[] = []
const io = (): MockIO => {
  const last = instances[instances.length - 1]
  if (!last) throw new Error('no IntersectionObserver was created')
  return last
}
function mockIO() {
  vi.stubGlobal('IntersectionObserver', MockIO)
}
function probe(opts?: GrowOptions) {
  let grown: ReturnType<typeof useGrow> | undefined
  const C = defineComponent({
    setup() { const el = ref(null); grown = useGrow(el, opts); return () => h('div', { ref: el }) },
  })
  mount(C)
  return () => grown?.value
}

afterEach(() => { instances.length = 0; vi.unstubAllGlobals() })

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
    io().fire(true); await nextTick()
    expect(g()).toBe(true)
  })
  it('once:true stays true after leaving; otherwise toggles', async () => {
    mockMedia(false); mockIO()
    const g = probe({ once: true })
    io().fire(true); io().fire(false)
    expect(g()).toBe(true)
    const g2 = probe({ once: false })
    io().fire(true); io().fire(false)
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
    io().fire(true); await nextTick()
    expect(w.classes()).toContain('is-grown')
    expect(w.find('.leaf').classes()).toContain('is-grown')
  })
  it('is-static shows everything and reduced motion renders grown', () => {
    mockMedia(false); mockIO()
    expect(mount(Vine, { props: { path: 'M0 0', isStatic: true } }).classes()).toContain('is-static')
    mockMedia(true)
    expect(mount(Bloom, { attrs: {} }).classes()).toContain('is-grown')
  })
  it('static Vine makes Leaf/Bud children static without an observer firing', () => {
    mockMedia(false); mockIO()
    const w = mount(Vine, { props: { path: 'M0 0', isStatic: true }, slots: { default: () => [h(Leaf), h(Bud)] } })
    expect(w.find('.leaf').classes()).toContain('is-static')
    expect(w.find('.bud').classes()).toContain('is-static')
  })
  it('static Bloom inside a grown Vine has no sway class', () => {
    mockMedia(false); mockIO()
    const w = mount(Vine, { props: { path: 'M0 0', grown: true }, slots: { default: () => h(Bloom, { isStatic: true }) } })
    expect(w.find('.bloom').classes()).toContain('is-static')
    expect(w.find('.bloom').classes()).not.toContain('is-swaying')
    expect(w.find('.vine').classes()).not.toContain('is-swaying')
  })
  it('children inside a Vine create no observer of their own', () => {
    mockMedia(false); mockIO()
    mount(Vine, { props: { path: 'M0 0' }, slots: { default: () => [h(Leaf), h(Bloom), h(Bud)] } })
    expect(instances).toHaveLength(1)
  })
})

describe('garden folder rules', () => {
  const files = readdirSync(here).filter((f) => /\.(vue|ts|css)$/.test(f) && !f.endsWith('.test.ts'))
  it('has no imports from outside src/garden except vue', () => {
    expect(files.length).toBeGreaterThan(0)
    expect(files).toEqual(expect.arrayContaining(['index.ts', 'useGrow.ts', 'types.ts', 'Vine.vue', 'garden.css']))
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
