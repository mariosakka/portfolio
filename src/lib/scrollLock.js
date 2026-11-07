// iOS Safari ignores body overflow:hidden, so also pin the body with position:fixed
// and restore the scroll offset afterwards. Shared across instances (count) so
// overlapping modals neither leak nor restore early.
let locks = 0
let saved = null
export function lockScroll() {
  if (locks++) return
  const { body, documentElement: html } = document
  saved = {
    y: window.scrollY,
    comp: html.style.getPropertyValue('--scrollbar-comp'),
    html: html.style.overflow,
    body: ['overflow', 'position', 'top', 'width'].map((k) => [k, body.style[k]]),
  }
  // Keep layout width when the desktop scrollbar disappears (style.css pads body and nav by this).
  html.style.setProperty('--scrollbar-comp', `${Math.max(0, window.innerWidth - html.clientWidth)}px`)
  html.style.overflow = 'hidden'
  Object.assign(body.style, { overflow: 'hidden', position: 'fixed', top: `-${saved.y}px`, width: '100%' })
}
export function unlockScroll() {
  if (!locks || --locks) return
  const { body, documentElement: html } = document
  html.style.overflow = saved.html
  if (saved.comp) html.style.setProperty('--scrollbar-comp', saved.comp)
  else html.style.removeProperty('--scrollbar-comp')
  saved.body.forEach(([k, v]) => { body.style[k] = v })
  const y = saved.y
  saved = null
  try {
    window.scrollTo({ top: y, left: 0, behavior: 'instant' })
  } catch {
    window.scrollTo(0, y) // older iOS Safari rejects behavior:'instant'
  }
}
