import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

type RGB = [number, number, number]
const tw = readFileSync('tailwind.config.ts', 'utf8')
const tok = (re: RegExp) => tw.match(re)![1]
const colors = {
  night: { 950: tok(/950: '(#[0-9a-f]+)'/), 900: tok(/900: '(#[0-9a-f]+)'/) },
  surface: tok(/surface: '([^']+)'/),
  accent: tok(/accent: '(#[0-9a-f]+)'/),
  ink: tok(/ink: '(#[0-9a-f]+)'/),
}
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB
const mix = (fg: RGB, bg: RGB, a: number): RGB => fg.map((v, i) => v * a + bg[i] * (1 - a)) as RGB
const lum = (c: RGB) => {
  const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: RGB, b: RGB) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05) }

const bg = hex(colors.night[950])
const [sr, sg, sb, sa] = colors.surface.match(/[\d.]+/g)!.map(Number)
const card = mix([sr, sg, sb], bg, sa)
const modal = hex(colors.night[900])
const ink = hex(colors.ink)
const accent = hex(colors.accent)

test.each([
  ['ink on page', ink, bg],
  ['ink on card', ink, card],
  ['ink on modal', ink, modal],
  ['ink at 80% (subtitle) on card', mix(ink, card, 0.8), card],
  ['ink at 70% (nav) on page', mix(ink, bg, 0.7), bg],
  ['ink at 60% (period) on card', mix(ink, card, 0.6), card],
  ['accent on page', accent, bg],
  ['accent on card', accent, card],
  ['accent on modal', accent, modal],
  ['page color on accent (active chip)', bg, accent],
])('contrast %s is at least 4.5:1', (_n, fg, back) => {
  expect(ratio(fg as RGB, back as RGB)).toBeGreaterThanOrEqual(4.5)
})

test('page background is flat on html and body; stars live on a fixed, masked top-only sky layer', () => {
  const css = readFileSync('src/style.css', 'utf8')
  const block = (sel: string) => css.match(new RegExp(`^${sel} [{][^}]*[}]`, 'm'))![0]
  expect(block('html')).toContain(`background-color: ${colors.night[950]}`)
  expect(block('html')).toContain('color-scheme: dark')
  expect(block('body')).toContain('bg-night-950')
  // no gradient and no star tile on the page background itself
  expect(block('body')).not.toMatch(/gradient|background-image|background-size/)
  expect(block('html')).not.toMatch(/gradient|background-image/)
  const sky = block('body::before')
  expect(sky).toContain('radial-gradient') // the star dots
  expect(sky).toContain('position: fixed')
  expect(sky).toContain('pointer-events: none')
  expect(sky).toMatch(/mask-image:\s*linear-gradient\(to bottom, #000 [\d.]+%, #000 \d+%, transparent 100%\)/)
  expect(sky).toMatch(/-webkit-mask-image/)
  const heights = [...sky.matchAll(/height:\s*(\d+)(vh|svh)/g)].map((m) => Number(m[1]))
  expect(heights.length).toBeGreaterThanOrEqual(2) // vh fallback + svh
  expect(Math.max(...heights)).toBeLessThanOrEqual(60)
})
