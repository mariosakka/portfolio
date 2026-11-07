import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import SiteFooter from './SiteFooter.vue'
import App from '../App.vue'

const sections = [{ id: 'about', label: 'About' }, { id: 'skills', label: 'Skills' }, { id: 'contact', label: 'Contact' }]
const releases = 'https://github.com/mariosakka/portfolio/releases'

function setup(reduce = false) {
  vi.stubGlobal('__APP_VERSION__', '1.2.3')
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), media: q }))
  const scrollTo = vi.fn()
  vi.stubGlobal('scrollTo', scrollTo)
  return { scrollTo, wrapper: mount(SiteFooter, { props: { sections } }) }
}

beforeEach(() => { document.body.innerHTML = '' })
afterEach(() => vi.unstubAllGlobals())

test('renders a footer landmark with a Footer nav', () => {
  const { wrapper } = setup()
  expect(wrapper.find('footer').exists()).toBe(true)
  expect(wrapper.find('nav[aria-label="Footer"]').exists()).toBe(true)
})

test('navigate links mirror the sections prop, in order', () => {
  const links = setup().wrapper.findAll('nav[aria-label="Footer"] a')
  expect(links.map((l) => [l.attributes('href'), l.text()])).toEqual(sections.map((s) => [`#${s.id}`, s.label]))
})

test('elsewhere links have exact hrefs and the phone is absent', () => {
  const { wrapper } = setup()
  const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
  expect(hrefs).toContain('mailto:mohamad.mario.sakka@gmail.com')
  expect(hrefs).toContain('https://github.com/mariosakka')
  expect(hrefs).toContain('https://www.linkedin.com/in/mohamad-mario-sakka-37388a29b')
  expect(hrefs.some((h) => h?.startsWith('tel:'))).toBe(false)
  expect(wrapper.html()).not.toContain('40734523633')
})

test('shows the version as a releases link, and the year', () => {
  const { wrapper } = setup()
  const v = wrapper.findAll('a').find((a) => a.text().includes('v1.2.3'))
  expect(v?.text()).toContain('v1.2.3')
  expect(v?.attributes('href')).toBe(releases)
  expect(v?.attributes('rel')).toBe('noopener noreferrer')
  expect(v?.attributes('target')).toBe('_blank')
  expect(wrapper.text()).toContain(`© ${new Date().getFullYear()} Mohamad-Mario Sakka`)
  expect(wrapper.findAll('a').map((a) => a.attributes('href'))).toContain('https://github.com/mariosakka/portfolio')
})

test.each([[false, 'smooth'], [true, 'auto']])('back to top (reduced motion %s) scrolls %s and focuses the h1', async (reduce, behavior) => {
  document.body.innerHTML = '<h1>Name</h1>'
  const { wrapper, scrollTo } = setup(reduce)
  await wrapper.find('button').trigger('click')
  expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior })
  expect(document.activeElement).toBe(document.querySelector('h1'))
})

test('App mounts the footer after main, fed by the same sections', () => {
  vi.stubGlobal('__APP_VERSION__', '0.0.0')
  const root = mount(App).find('#app-root')
  const links = root.findAll('footer nav[aria-label="Footer"] a')
  expect(links).toHaveLength(8)
  expect(root.find('main + footer').exists()).toBe(true)
})
