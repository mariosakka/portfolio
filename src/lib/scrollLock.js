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
    html: html.style.overflow,
    body: ['overflow', 'position', 'top', 'width'].map((k) => [k, body.style[k]]),
  }
  html.style.overflow = 'hidden'
  Object.assign(body.style, { overflow: 'hidden', position: 'fixed', top: `-${saved.y}px`, width: '100%' })
}
export function unlockScroll() {
  if (!locks || --locks) return
  const { body, documentElement: html } = document
  html.style.overflow = saved.html
  saved.body.forEach(([k, v]) => { body.style[k] = v })
  window.scrollTo({ top: saved.y, left: 0, behavior: 'instant' })
  saved = null
}
