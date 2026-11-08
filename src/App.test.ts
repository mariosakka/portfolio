import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import App from './App.vue'

test('renders the app root with the name', () => {
  const wrapper = mount(App)
  const root = wrapper.find('#app-root')
  expect(root.exists()).toBe(true)
  expect(root.text()).toContain('Mohamad-Mario Sakka')
})

test('has no page-tall vine or overlay outside cards: every sprouts overlay is inside a positioned card', () => {
  const wrapper = mount(App, { attachTo: document.body })
  const root = wrapper.get('#app-root').element
  expect(root.querySelectorAll('[class*="page-vine"], [class*="PageVine"]')).toHaveLength(0)
  const overlays = [...root.querySelectorAll('div.sprouts')]
  expect(overlays.length).toBeGreaterThan(5)
  for (const o of overlays) {
    const parent = o.parentElement!
    expect(parent.classList.contains('relative') || parent.hasAttribute('data-track'), parent.className).toBe(true)
    expect(parent.closest('header, nav, footer')).toBeNull()
  }
  // Only the short heading vines are allowed besides the card overlays.
  expect(root.querySelectorAll('svg.g-vine').length).toBeLessThanOrEqual(8)
  wrapper.unmount()
})
