// Shared by every Sprouts overlay: one requestAnimationFrame loop, a global cap on plants growing at once,
// and a cap on idle-swaying plants (only those nearest the viewport sway).

/** Most plants growing at the same time across the page; further overlays wait in a queue. */
export const MAX_GROWING_PLANTS = 80
/** Most plants swaying at the same time across the page. */
export const MAX_SWAYING = 6

export interface Grower {
  /** Plants this overlay grows; each holds a slot until its own timeline completes. */
  plants: number
  /** Queue order: lower starts first (Sprouts passes the parent's distance to the viewport centre). Read when popping. */
  priority?: () => number
  /** Called once when the grower gets its slots, with the frame clock. */
  begin: (now: number) => void
  /** Called every frame while running: how many of its plants are still unfinished, and whether it is done. */
  tick: (now: number) => { pending: number; done: boolean }
}

interface Slot { g: Grower; held: number }
const queue: Grower[] = []
const running = new Map<Grower, Slot>()
let used = 0
let raf = 0

const clock = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now())

function finish(g: Grower): void {
  const s = running.get(g)
  if (!s) return
  used -= s.held
  running.delete(g)
}

/** Nearest first: the queued grower with the lowest priority, re-evaluated each time one is popped. */
function next(): Grower | undefined {
  let best: Grower | undefined
  let bp = Infinity
  for (const g of queue) {
    let p = Infinity
    try { p = g.priority?.() ?? Infinity } catch { /* a broken priority just goes last */ }
    if (!best || p < bp) { best = g; bp = p }
  }
  return best
}

function pump(): void {
  for (let g = next(); g && (used === 0 || used + g.plants <= MAX_GROWING_PLANTS); g = next()) {
    queue.splice(queue.indexOf(g), 1)
    running.set(g, { g, held: g.plants })
    used += g.plants
    try { g.begin(clock()) } catch (e) { finish(g); console.error(e) }
  }
  if (running.size && !raf) raf = requestAnimationFrame(frame)
}

function frame(now: number): void {
  raf = 0
  for (const s of [...running.values()]) {
    try {
      const { pending, done } = s.g.tick(now)
      const held = done ? 0 : Math.min(s.held, Math.max(0, pending))
      used -= s.held - held // each plant's slot is released as soon as its own timeline completes
      s.held = held
      if (done) finish(s.g)
    } catch (e) {
      // One broken overlay must not stop the others.
      finish(s.g)
      console.error(e)
    }
  }
  pump()
}

/** Queue a grower; it starts as soon as the plant budget allows. Returns a cancel function (safe to call twice). */
export function enqueueGrowth(g: Grower): () => void {
  queue.push(g)
  pump()
  return () => {
    const i = queue.indexOf(g)
    if (i >= 0) queue.splice(i, 1)
    finish(g)
    if (!running.size && raf) { cancelAnimationFrame(raf); raf = 0 }
    pump()
  }
}

/** Current load, for tests and debugging. */
export const growthStats = (): { running: number; queued: number; plants: number } => ({ running: running.size, queued: queue.length, plants: used })

/** Distance in px from an element's centre to the viewport centre (horizontal offset weighted less). */
export function viewportDistance(el: Element): number {
  const r = el.getBoundingClientRect()
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight
  const vw = typeof window === 'undefined' ? 1200 : window.innerWidth
  return Math.hypot(r.top + r.height / 2 - vh / 2, (r.left + r.width / 2 - vw / 2) * 0.25)
}

// ---- sway ----

export interface SwayEntry {
  el: Element
  /** Plants this overlay could sway. */
  plants: number
  /** Receives how many of its plants may sway now. */
  set: (n: number) => void
}

const swayers = new Set<SwayEntry>()
let swayRaf = 0

function assign(): void {
  swayRaf = 0
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight
  const ranked = [...swayers]
    .map((e) => ({ e, r: e.el.getBoundingClientRect(), d: viewportDistance(e.el) }))
    .filter(({ r }) => r.bottom >= 0 && r.top <= vh)
    .sort((a, b) => a.d - b.d)
  let left = MAX_SWAYING
  const given = new Map<SwayEntry, number>()
  for (const { e } of ranked) {
    const n = Math.min(2, e.plants, left)
    given.set(e, n)
    left -= n
  }
  for (const e of swayers) e.set(given.get(e) ?? 0)
}
const schedule = (): void => { if (!swayRaf) swayRaf = requestAnimationFrame(assign) }

/** Register a grown overlay for idle sway. Returns an unregister function. */
export function registerSway(e: SwayEntry): () => void {
  if (!swayers.size) {
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
  }
  swayers.add(e)
  assign()
  return () => {
    if (!swayers.delete(e)) return
    e.set(0)
    if (!swayers.size) {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (swayRaf) { cancelAnimationFrame(swayRaf); swayRaf = 0 }
    } else assign()
  }
}
