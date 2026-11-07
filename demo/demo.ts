/* eslint-disable vue/one-component-per-file -- dev demo with two small views */
// Dev-only demo (see garden-demo.html). Default: a gallery of mock cards with <Sprouts>, every variant at
// density 1/2/3 plus an `auto` row, driven by a progress slider or ?p=0.5. ?live=1 grows them with the real
// `visible` trigger instead. ?view=species shows one plant per species (?zoom=3 enlarges it).
import { createApp, defineComponent, h, ref } from 'vue'
import { Plant, Sprouts, SPROUT_VARIANTS, parsePath, pointAt } from '../src/garden'
import type { Species, SproutDensity, SproutVariant } from '../src/garden'

const params = new URLSearchParams(window.location.search)
const live = params.get('live') === '1'
const SIZES: [number, number][] = [[200, 120], [380, 150], [170, 250]]
const AUTO_SIZES: [number, number][] = [[300, 190], [300, 190], [300, 190], [460, 160], [220, 220], [140, 90], [520, 300], [260, 140], [180, 300]]

const cardStyle = (w: number, hh: number): string =>
  `position:relative;width:${w}px;height:${hh}px;box-sizing:border-box;border:1px solid rgba(123,155,217,.15);border-radius:16px;background:rgba(140,170,230,.06);padding:14px;color:#c9d3ea;font:13px/1.45 system-ui,sans-serif`

function card(label: string, w: number, hh: number, variant: SproutVariant | 'auto', density: SproutDensity, seed: string | number, p: number) {
  return h('div', { style: cardStyle(w, hh), 'data-card': label }, [
    h('div', { style: 'font:600 15px Georgia,serif;margin-bottom:6px' }, label),
    h('div', { style: 'opacity:.75' }, `${w}x${hh}, density ${density}`),
    hh >= 120 ? h('div', { style: 'opacity:.5;margin-top:6px' }, 'Card text stays readable: the art never covers it.') : null,
    live
      ? h(Sprouts, { seed, variant, density })
      : h(Sprouts, { seed, variant, density, trigger: 'manual', progress: p }),
  ])
}

const Gallery = defineComponent({
  setup() {
    const p = ref(Number(params.get('p') ?? 1))
    return () => h('div', { style: 'padding:24px 48px' }, [
      live ? null : h('label', { style: 'display:block;margin-bottom:24px' }, [
        `progress ${p.value.toFixed(2)} `,
        h('input', { type: 'range', min: 0, max: 1, step: 0.01, value: p.value, style: 'width:320px', onInput: (e: Event) => { p.value = Number((e.target as HTMLInputElement).value) } }),
      ]),
      ...SPROUT_VARIANTS.map((v, vi) => h('section', { style: 'margin-bottom:56px', 'data-variant': v }, [
        h('h2', { style: 'font:16px Georgia,serif;color:#9aa7c4;margin:0 0 64px' }, v),
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:136px;align-items:flex-start' },
          ([1, 2, 3] as SproutDensity[]).map((d, i) => { const [w, hh] = SIZES[i] ?? [200, 120]; return card(`${v} ${d}`, w, hh, v, d, vi * 10 + d, p.value) })),
      ])),
      h('section', { 'data-variant': 'auto' }, [
        h('h2', { style: 'font:16px Georgia,serif;color:#9aa7c4;margin:0 0 64px' }, 'auto (seeds 0 to 8, like a page of cards)'),
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:136px;align-items:flex-start' },
          AUTO_SIZES.map(([w, hh], i) => card(`card ${i}`, w, hh, 'auto', 2, i, p.value))),
      ]),
    ])
  },
})

const SPECIES: Species[] = ['bloom', 'cornflower', 'bell', 'forgetmenot', 'daisy']
const PATH = 'M64 -10 C80 70 70 130 62 160 C40 220 70 270 60 330'
const model = parsePath(PATH)
const zoom = Number(params.get('zoom') ?? 1)
const SpeciesView = defineComponent({
  setup() {
    const p = ref(Number(params.get('p') ?? 1))
    return () =>
      h('div', { style: 'padding:12px' }, [
        h('label', { style: 'display:block;margin-bottom:8px' }, [
          `progress ${p.value.toFixed(2)} `,
          h('input', { type: 'range', min: 0, max: 1, step: 0.01, value: p.value, style: 'width:320px', onInput: (e: Event) => { p.value = Number((e.target as HTMLInputElement).value) } }),
        ]),
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px' }, SPECIES.map((sp, i) =>
          h('figure', { style: 'margin:0', 'data-species': sp }, [
            h('svg', { width: 300 * zoom, height: 340 * zoom, viewBox: '-20 0 300 340', style: 'background:#050914;display:block;overflow:hidden' }, [
              h('path', { d: PATH, fill: 'none', stroke: '#26788d', 'stroke-width': 4, 'stroke-linecap': 'round' }),
              h(Plant, { species: sp, seed: 3 + i, anchor: pointAt(model, 0.5), side: 1, reach: 90, size: 2, leaves: 2, branches: sp === 'bloom' ? 2 : 0, progress: p.value, grown: true }),
            ]),
            h('figcaption', sp),
          ]),
        )),
      ])
  },
})

createApp(params.get('view') === 'species' ? SpeciesView : Gallery).mount('#demo')
