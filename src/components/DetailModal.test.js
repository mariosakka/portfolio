import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DetailModal from './DetailModal.vue'

const opts = (open) => ({ props: { open, title: 'Hello' }, slots: { default: '<p>body</p>' }, attachTo: document.body })
afterEach(() => { document.body.innerHTML = ''; document.body.style.overflow = '' })

describe('DetailModal', () => {
  it('is a labelled modal dialog', () => {
    const w = mount(DetailModal, opts(true))
    const d = document.querySelector('[role="dialog"]')
    expect(d.getAttribute('aria-modal')).toBe('true')
    expect(d.getAttribute('aria-label')).toBe('Hello')
    w.unmount()
  })
  it('emits close on Escape and backdrop click', async () => {
    const w = mount(DetailModal, opts(true))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    document.querySelector('[data-backdrop]').click()
    expect(w.emitted('close')).toHaveLength(2)
    w.unmount()
  })
  it('restores focus to opener and toggles body scroll lock', async () => {
    const btn = document.createElement('button')
    document.body.appendChild(btn)
    btn.focus()
    const w = mount(DetailModal, opts(false))
    await w.setProps({ open: true })
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    await w.setProps({ open: false })
    await nextTick()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(btn)
    w.unmount()
  })
  it('moves focus into the dialog and traps Tab', async () => {
    const w = mount(DetailModal, { props: { open: false, title: 'Hello' }, slots: { default: '<a href="#a">a</a><button id="z">z</button>' }, attachTo: document.body })
    await w.setProps({ open: true })
    await nextTick()
    const d = document.querySelector('[role="dialog"]')
    expect(document.activeElement).toBe(d)
    const first = d.querySelector('button[aria-label="Close"]')
    const last = d.querySelector('#z')
    last.focus()
    const tab = (shiftKey) => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true }))
    tab(false)
    expect(document.activeElement).toBe(first)
    tab(true)
    expect(document.activeElement).toBe(last)
    w.unmount()
  })
})
