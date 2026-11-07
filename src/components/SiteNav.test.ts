import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import SiteNav from './SiteNav.vue'
import App from '../App.vue'

test('SiteNav renders one anchor per section', () => {
  const sections = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]
  const links = mount(SiteNav, { props: { sections } }).findAll('a')
  expect(links.map((l) => l.attributes('href'))).toEqual(['#a', '#b', '#c'])
})

test('App renders the seven sections in order', () => {
  const ids = mount(App).findAll('section').map((s) => s.attributes('id'))
  expect(ids).toEqual(['about', 'experience', 'projects', 'education', 'certificates', 'organizations', 'contact'])
})
