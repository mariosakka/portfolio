// Shared by every Sprouts overlay: one requestAnimationFrame loop, a global cap on plants growing at once,
// and a cap on idle-swaying plants (only those nearest the viewport sway).

/** Most plants growing at the same time across the page; further overlays wait in a queue. */
export const MAX_GROWING_PLANTS = 40
/** Most plants swaying at the same time across the page. */
export const MAX_SWAYING = 6

export interface Grower {
  /** Plants this overlay grows (counted against MAX_GROWING_PLANTS). */
  plants: number
  /** Called once when the grower gets its slot, with the frame clock. */
  begin: (now: number) => void
  /** Called every frame while running; return true when finished. */
  tick: (now: number) => boolean
}

const queue: Grower[] = []
const running = new Set<Grower>()
let used = 0
let raf = 0

const clock = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now())

function pump(): void {
  for (let g = queue[0]; g && (used === 0 || used + g.plants <= MAX_GROWING_PLANTS); g = queue[0]) {
    queue.shift()
    running.add(g)
    used += g.plants
    g.begin(clock())
  }
  if (running.size && !raf) raf = requestAnimationFrame(frame)
}

function finish(g: Grower): void {
  if (running.delete(g)) used -= g.plants
}

function frame(now: number): void {
  raf = 0
  for (const g of [...running]) if (g.tick(now)) finish(g)
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
    .map((e) => ({ e, r: e.el.getBoundingClientRect() }))
    .filter(({ r }) => r.bottom >= 0 && r.top <= vh)
    .sort((a, b) => Math.abs(a.r.top + a.r.height / 2 - vh / 2) - Math.abs(b.r.top + b.r.height / 2 - vh / 2))
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
