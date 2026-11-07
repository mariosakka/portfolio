import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import SiteNav from './SiteNav.vue'
import App from '../App.vue'

test('SiteNav renders one anchor per section', () => {
  const sections = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]
  const links = mount(SiteNav, { props: { sections } }).findAll('a')
  expect(links.map((l) => l.attributes('href'))).toEqual(['#a', '#b', '#c'])
})

describe('SiteNav link click', () => {
  // jsdom has no layout: section heights, the nav height and the window height are stubbed.
  function setup(sectionHeight: number, reduced = false) {
    document.body.innerHTML = ''
    window.matchMedia = vi.fn().mockReturnValue({ matches: reduced }) as unknown as typeof window.matchMedia
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    const sec = document.createElement('section')
    sec.id = 'b'
    sec.innerHTML = '<h2>B</h2>'
    vi.spyOn(sec, 'getBoundingClientRect').mockReturnValue({ height: sectionHeight } as DOMRect)
    const scroll = vi.fn()
    sec.scrollIntoView = scroll
    const w = mount(SiteNav, { props: { sections: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] }, attachTo: document.body })
    document.body.appendChild(sec)
    vi.spyOn(w.get('nav').element, 'getBoundingClientRect').mockReturnValue({ height: 44 } as DOMRect)
    history.replaceState(null, '', '#')
    return { w, sec, scroll, link: w.get('a[href="#b"]') }
  }
  afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

  it('centers a section that fits below the nav, smoothly, sets the hash and focuses the heading', async () => {
    const { w, sec, scroll, link } = setup(756)
    await link.trigger('click')
    expect(scroll).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' })
    expect(location.hash).toBe('#b')
    const h = sec.querySelector('h2')!
    expect(document.activeElement).toBe(h)
    expect(h.getAttribute('tabindex')).toBe('-1')
    expect(link.attributes('aria-current')).toBe('true')
    expect(link.attributes('href')).toBe('#b')
    w.unmount()
  })

  it('aligns a taller section to the top, instantly under reduced motion', async () => {
    const { w, scroll, link } = setup(900, true)
    await link.trigger('click')
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' })
    w.unmount()
  })

  it('leaves modified clicks (new tab) to the browser', async () => {
    const { w, scroll, link } = setup(500)
    await link.trigger('click', { ctrlKey: true })
    expect(scroll).not.toHaveBeenCalled()
    w.unmount()
  })
})

const order = ['about', 'skills', 'experience', 'projects', 'education', 'certificates', 'organizations', 'contact']

test('App renders the eight sections in order, skills after about', () => {
  const ids = mount(App).findAll('section').map((s) => s.attributes('id'))
  expect(ids).toEqual(order)
})

test('App nav links every section in the same order', () => {
  const links = mount(App).findAll('nav[aria-label="Sections"] a')
  expect(links).toHaveLength(8)
  expect(links.map((l) => l.attributes('href'))).toEqual(order.map((id) => `#${id}`))
})
