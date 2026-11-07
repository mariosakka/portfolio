// Viewport-fit check (manual release check, see docs/testing.md). jsdom has no layout, so this runs in a real browser.
// Usage, from a temp folder OUTSIDE the repo (playwright is not a project dependency):
//   npm i playwright && npx playwright install chromium
//   node <repo>/docs/reference/measure-fit.mjs http://localhost:4173   (after `npm run build && npx vite preview`)
// For every viewport x section it clicks the nav link and prints whether the section content (heading, vine,
// body) fits between the sticky nav and the bottom of the screen, by how many px, and whether it is centered.

export const VIEWPORTS = [
  [1920, 1080], [1440, 900], [1366, 768], [1280, 720], [1024, 768],
  [390, 844, true], [375, 667, true], [360, 740, true],
]

export async function measure(page, base) {
  await page.goto(base)
  await page.waitForTimeout(600)
  const ids = await page.$$eval('nav[aria-label="Sections"] a', (as) => as.map((a) => a.getAttribute('href').slice(1)))
  const rows = []
  for (const id of ids) {
    await page.click(`nav[aria-label="Sections"] a[href="#${id}"]`)
    await page.waitForTimeout(400)
    rows.push(await page.evaluate((id) => {
      const sec = document.getElementById(id)
      const nav = document.querySelector('nav[aria-label="Sections"]').getBoundingClientRect()
      const rects = [...sec.children].map((c) => c.getBoundingClientRect()).filter((r) => r.height > 0)
      const top = Math.min(...rects.map((r) => r.top))
      const bottom = Math.max(...rects.map((r) => r.bottom))
      const avail = innerHeight - nav.bottom
      const h = bottom - top
      const visible = top >= nav.bottom - 1 && bottom <= innerHeight + 1
      const off = (top + bottom) / 2 - (nav.bottom + innerHeight) / 2
      return { id, h: Math.round(h), avail: Math.round(avail), spare: Math.round(avail - h), fits: h <= avail && visible, centered: Math.abs(off) <= 24, off: Math.round(off) }
    }, id))
  }
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  return { rows, overflowX }
}

export function table(results) {
  const lines = ['| viewport | section | content h | space | spare (+) / over (-) | fits | centered (off px) |', '|---|---|---|---|---|---|---|']
  for (const { vp, rows, overflowX } of results) {
    for (const r of rows) lines.push(`| ${vp} | ${r.id} | ${r.h} | ${r.avail} | ${r.spare} | ${r.fits ? 'yes' : 'NO'} | ${r.centered ? 'yes' : 'no'} (${r.off}) |`)
    if (overflowX) lines.push(`| ${vp} | (page) | horizontal overflow ${overflowX}px | | | NO | |`)
  }
  return lines.join('\n')
}

if (process.argv[1]?.endsWith('measure-fit.mjs')) {
  // Resolve playwright from the current folder (the temp install), not from the repo.
  const { createRequire } = await import('node:module')
  const { chromium } = createRequire(`${process.cwd()}/`)('playwright')
  const base = process.argv[2] ?? 'http://localhost:4173'
  const browser = await chromium.launch()
  const results = []
  for (const [w, h, phone] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: !!phone, hasTouch: !!phone, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    results.push({ vp: `${w}x${h}`, ...(await measure(page, base)) })
    await ctx.close()
  }
  await browser.close()
  console.log(table(results))
}
