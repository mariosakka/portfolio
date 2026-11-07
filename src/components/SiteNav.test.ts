import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import SiteNav from './SiteNav.vue'
import App from '../App.vue'

test('SiteNav renders one anchor per section', () => {
  const sections = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]
  const links = mount(SiteNav, { props: { sections } }).findAll('a')
  expect(links.map((l) => l.attributes('href'))).toEqual(['#a', '#b', '#c'])
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
