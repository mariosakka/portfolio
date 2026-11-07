import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import App from './App.vue'

test('renders the app root with the name', () => {
  const wrapper = mount(App)
  const root = wrapper.find('#app-root')
  expect(root.exists()).toBe(true)
  expect(root.text()).toContain('Mohamad-Mario Sakka')
})
