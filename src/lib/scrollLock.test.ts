import { describe, it, expect, afterEach, vi } from 'vitest'
import { lockScroll, unlockScroll } from './scrollLock'

const html = document.documentElement
const setScroll = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  return vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
}
afterEach(() => {
  unlockScroll(); unlockScroll()
  Reflect.deleteProperty(window, 'scrollY')
  vi.restoreAllMocks()
  document.body.removeAttribute('style')
  html.removeAttribute('style')
})

describe('scrollLock', () => {
  it('pins body, restores inline styles and scroll', () => {
    const spy = setScroll(50)
    document.body.style.position = 'relative'
    lockScroll()
    expect(document.body.style.top).toBe('-50px')
    unlockScroll()
    expect(document.body.style.position).toBe('relative')
    expect(spy).toHaveBeenCalledWith({ top: 50, left: 0, behavior: 'instant' })
  })
  it('tolerates unbalanced unlock', () => {
    setScroll(0)
    unlockScroll()
    lockScroll()
    expect(document.body.style.position).toBe('fixed')
    unlockScroll()
    expect(document.body.style.position).toBe('')
  })
  it('compensates for the scrollbar and restores it', () => {
    setScroll(0)
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    vi.spyOn(html, 'clientWidth', 'get').mockReturnValue(1009)
    lockScroll()
    expect(html.style.getPropertyValue('--scrollbar-comp')).toBe('15px')
    unlockScroll()
    expect(html.style.getPropertyValue('--scrollbar-comp')).toBe('')
  })
  it('falls back to scrollTo(x, y) when the options form throws', () => {
    const spy = setScroll(70)
    spy.mockImplementationOnce(() => { throw new TypeError('bad') })
    lockScroll()
    unlockScroll()
    expect(spy).toHaveBeenLastCalledWith(0, 70)
  })
})
