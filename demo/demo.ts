// Dev-only demo (see garden-demo.html): one plant per species, driven by a progress slider or ?p=0.5.
import { createApp, defineComponent, h, ref } from 'vue'
import { Plant, parsePath, pointAt } from '../src/garden'
import type { Species } from '../src/garden'

const SPECIES: Species[] = ['bloom', 'cornflower', 'bell', 'forgetmenot', 'daisy']
const PATH = 'M64 -10 C80 70 70 130 62 160 C40 220 70 270 60 330'
const model = parsePath(PATH)
const params = new URLSearchParams(window.location.search)
const zoom = Number(params.get('zoom') ?? 1)

const App = defineComponent({
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
              // A plain, fully drawn vine: `Plant` anchors its stem on a point of this exact path.
              h('path', { d: PATH, fill: 'none', stroke: '#26788d', 'stroke-width': 4, 'stroke-linecap': 'round' }),
              h(Plant, { species: sp, seed: 3 + i, anchor: pointAt(model, 0.5), side: 1, reach: 90, size: 2, leaves: 2, branches: sp === 'bloom' ? 2 : 0, progress: p.value, grown: true }),
            ]),
            h('figcaption', sp),
          ]),
        )),
      ])
  },
})
createApp(App).mount('#demo')
